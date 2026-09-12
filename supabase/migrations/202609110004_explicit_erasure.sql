begin;

-- Owner-authorized, password-gated erasure. Ordinary DELETE/TRUNCATE remain
-- blocked. Nothing in this migration deletes existing work.
create table private.erasure_context (transaction_id bigint primary key, manifest name not null);
create table private.erasure_account_requests (
  target_id uuid primary key, actor_id uuid not null, session_id uuid not null,
  fingerprint text not null, expires_at timestamptz not null
);
create table private.erasure_password_attempts (
  actor_id uuid primary key, window_start timestamptz not null, attempts integer not null
);
revoke all on private.erasure_context,private.erasure_account_requests,private.erasure_password_attempts from public,anon,authenticated,service_role;

create function private.erasure_key(p_relation oid,p_row jsonb) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_object_agg(a.attname,p_row->a.attname)
  from pg_constraint c cross join lateral unnest(c.conkey) k(attnum)
  join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum
  where c.conrelid=p_relation and c.contype='p';
$$;

-- The manifest lives in a randomly named temp table, never a caller-controlled
-- object. Include all FK descendants, not just the visible activity rows.
create function private.build_erasure_manifest(p_kind text,p_target uuid) returns name
language plpgsql security definer set search_path='' as $$
declare manifest name := ('erase_'||replace(gen_random_uuid()::text,'-',''))::name;
  fk record; join_sql text; added integer; total_added integer; id_list text[];
begin
  if p_kind not in ('trash','account') or (p_kind='account' and p_target is null) then
    raise exception using errcode='SR003',message='invalid erasure kind';
  end if;
  execute format('create temporary table %I (relation oid not null, key jsonb not null, payload jsonb not null, primary key(relation,key)) on commit drop',manifest);
  if p_kind='account' then
    execute format('insert into pg_temp.%I select tableoid,private.erasure_key(tableoid,to_jsonb(p)),to_jsonb(p) from public.profiles p where id=$1',manifest) using p_target;
  else
    execute format('insert into pg_temp.%I select tableoid,private.erasure_key(tableoid,to_jsonb(a)),to_jsonb(a) from public.activities a where deleted_at is not null',manifest);
  end if;
  loop
    total_added:=0;
    for fk in
      select c.*,format('%I.%I',n.nspname,t.relname) child,format('%I.%I',pn.nspname,pt.relname) parent
      from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
      join pg_class pt on pt.oid=c.confrelid join pg_namespace pn on pn.oid=pt.relnamespace
      where c.contype='f' and n.nspname in ('public','private') and pn.nspname in ('public','private')
        and t.relname not like 'erasure_%' and t.relname<>'record_history'
    loop
      select string_agg(format('ch.%I=pa.%I',ca.attname,pa.attname),' and ' order by x.i) into join_sql
      from generate_subscripts(fk.conkey,1) x(i)
      join pg_attribute ca on ca.attrelid=fk.conrelid and ca.attnum=fk.conkey[x.i]
      join pg_attribute pa on pa.attrelid=fk.confrelid and pa.attnum=fk.confkey[x.i];
      execute format('insert into pg_temp.%I select ch.tableoid,private.erasure_key(ch.tableoid,to_jsonb(ch)),to_jsonb(ch) from %s ch join %s pa on %s join pg_temp.%I m on m.relation=pa.tableoid and m.key=private.erasure_key(pa.tableoid,to_jsonb(pa)) on conflict do nothing',manifest,fk.child,fk.parent,join_sql,manifest);
      get diagnostics added=row_count; total_added:=total_added+added;
    end loop;
    exit when total_added=0;
  end loop;
  -- JSON evidence and idempotency receipts do not have foreign keys. Match only
  -- primary UUID ids of the selected records, never other actors' FK values.
  execute format('select coalesce(array_agg(key->>''id''),array[]::text[]) from pg_temp.%I where key->>''id'' ~ ''^[0-9a-f-]{36}$''',manifest) into id_list;
  execute format('insert into pg_temp.%I select tableoid,private.erasure_key(tableoid,to_jsonb(r)),to_jsonb(r) from private.aunor_requests r where exists(select 1 from unnest($1) id where position(id in r.result::text)>0) on conflict do nothing',manifest) using id_list;
  execute format('insert into pg_temp.%I select tableoid,private.erasure_key(tableoid,to_jsonb(r)),to_jsonb(r) from public.audit_events r where exists(select 1 from unnest($1) id where position(id in r.detail::text)>0) on conflict do nothing',manifest) using id_list;
  execute format('insert into pg_temp.%I select tableoid,private.erasure_key(tableoid,to_jsonb(h)),to_jsonb(h) from private.record_history h where exists(select 1 from unnest($1) id where h.actor_id::text=id or position(id in coalesce(h.old_record::text,''''))>0 or position(id in coalesce(h.new_record::text,''''))>0) on conflict do nothing',manifest) using id_list;
  return manifest;
end $$;

create function private.erasure_summary(p_manifest name) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  execute format($q$
    select jsonb_build_object(
      'fingerprint',encode(extensions.digest(coalesce(string_agg(relation::text||key::text||payload::text,'' order by relation,key),''),'sha256'),'hex'),
      'total',count(*),
      'activities',coalesce(jsonb_agg(jsonb_build_object('id',payload->>'id','title',payload->>'title','responsible',payload->>'responsible_name','trashed',payload->>'deleted_at' is not null) order by payload->>'title',payload->>'id') filter(where relation='public.activities'::regclass),'[]'::jsonb),
      'counts',(select coalesce(jsonb_object_agg(name,n),'{}'::jsonb) from(select relation::regclass::text name,count(*) n from pg_temp.%I group by relation) c)
    ) from pg_temp.%I
  $q$,p_manifest,p_manifest) into result;
  return result;
end $$;

create function private.require_erasure_actor(p_actor uuid,p_session uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_service_admin(p_actor);
  if not exists(select 1 from public.app_sessions where user_id=p_actor and session_id=p_session and revoked_at is null and expires_at>now()) then
    raise exception using errcode='SR002',message='active administrator session required';
  end if;
end $$;

create function private.validate_erasure_target(p_actor uuid,p_kind text,p_target uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_kind='account' then
    if p_target=p_actor or not exists(select 1 from public.profiles where id=p_target and not is_active) then
      raise exception using errcode='SR009',message='only another inactive account can be erased';
    end if;
    if exists(select 1 from private.credential_operations where profile_id=p_target or actor_id=p_target) then
      raise exception using errcode='SR009',message='credential operation pending';
    end if;
  elsif p_kind<>'trash' or p_target is not null then
    raise exception using errcode='SR003',message='invalid erasure target';
  end if;
end $$;

create function public.erasure_identity_v1() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype;
begin
  actor:=private.require_admin_profile();
  return jsonb_build_object('actorId',actor.id,'sessionId',private.current_session_id());
end $$;
create function public.preview_erasure_v1(p_kind text,p_target uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; manifest name;
begin
  actor:=private.require_admin_profile();
  perform private.validate_erasure_target(actor.id,p_kind,p_target);
  manifest:=private.build_erasure_manifest(p_kind,p_target);
  return private.erasure_summary(manifest);
end $$;

create function public.begin_erasure_password_attempt_v1(p_actor uuid,p_session uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare attempts integer;
begin
  perform private.require_erasure_actor(p_actor,p_session);
  insert into private.erasure_password_attempts values(p_actor,clock_timestamp(),1)
  on conflict(actor_id) do update set
    attempts=case when erasure_password_attempts.window_start<clock_timestamp()-interval '15 minutes' then 1 else erasure_password_attempts.attempts+1 end,
    window_start=case when erasure_password_attempts.window_start<clock_timestamp()-interval '15 minutes' then clock_timestamp() else erasure_password_attempts.window_start end
  returning erasure_password_attempts.attempts into attempts;
  return attempts<=5;
end $$;

create function private.lock_erasure_tables() returns void
language plpgsql security definer set search_path='' as $$
declare t record;
begin
  -- Stable lock order; prevent a changed/expanded target between preview check
  -- and deletion. Reads remain available. Fail instead of a long production wait.
  perform set_config('lock_timeout','5s',true);
  perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
  for t in select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' and c.relname not like 'erasure_%' order by c.oid
  loop execute format('lock table %I.%I in share row exclusive mode',t.nspname,t.relname); end loop;
end $$;

create or replace function private.reject_irreversible_removal() returns trigger
language plpgsql security definer set search_path='' as $$
declare manifest name; permitted boolean:=false;
begin
  if tg_op='DELETE' then
    select c.manifest into manifest from private.erasure_context c where transaction_id=txid_current();
    if manifest is not null then
      execute format('select exists(select 1 from pg_temp.%I where relation=$1 and key=private.erasure_key($1,$2))',manifest) into permitted using tg_relid,to_jsonb(old);
    end if;
    if permitted then return old; end if;
  end if;
  raise exception using errcode='SR012',message='Physical deletion requires an explicit verified erasure';
end $$;
create or replace function private.preserve_record_revision() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from private.erasure_context where transaction_id=txid_current()) then return null; end if;
  insert into private.record_history(table_name,operation,actor_id,database_actor,transaction_id,old_record,new_record)
  values(tg_table_schema||'.'||tg_table_name,tg_op,auth.uid(),session_user,txid_current(),case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
  return null;
end $$;

create function private.apply_erasure(p_manifest name) returns void
language plpgsql security definer set search_path='' as $$
declare t record;
begin
  insert into private.erasure_context values(txid_current(),p_manifest);
  -- Children first; ignore self-edges (all selected rows of a table are deleted
  -- in the same statement). Unexpected cross-links fail the entire transaction.
  for t in
    with recursive depths(relid,depth,path) as (
      select c.oid,0,array[c.oid] from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r'
      union all
      select f.conrelid,d.depth+1,d.path||f.conrelid from depths d join pg_constraint f on f.confrelid=d.relid and f.contype='f' where not f.conrelid=any(d.path)
    ) select relid,relid::regclass relation,max(depth) depth from depths group by relid order by max(depth) desc,relid
  loop
    execute format('delete from %s r using pg_temp.%I m where m.relation=$1 and m.key=private.erasure_key($1,to_jsonb(r))',t.relation,p_manifest) using t.relid;
  end loop;
  delete from private.erasure_context where transaction_id=txid_current();
end $$;

create function public.execute_erasure_v1(p_actor uuid,p_session uuid,p_kind text,p_target uuid,p_fingerprint text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare manifest name; result jsonb;
begin
  perform private.lock_erasure_tables();
  perform private.require_erasure_actor(p_actor,p_session);
  perform private.validate_erasure_target(p_actor,p_kind,p_target);
  manifest:=private.build_erasure_manifest(p_kind,p_target);
  result:=private.erasure_summary(manifest);
  if p_fingerprint is null or result->>'fingerprint'<>p_fingerprint then raise exception using errcode='SR001',message='erasure preview changed'; end if;
  if p_kind='account' then
    insert into private.erasure_account_requests values(p_target,p_actor,p_session,p_fingerprint,clock_timestamp()+interval '2 minutes')
    on conflict(target_id) do update set actor_id=excluded.actor_id,session_id=excluded.session_id,fingerprint=excluded.fingerprint,expires_at=excluded.expires_at;
  else perform private.apply_erasure(manifest); end if;
  return jsonb_build_object('ok',true,'total',result->'total');
end $$;

-- Run in Auth's own delete transaction so application data is rolled back if
-- auth.admin.deleteUser fails. No direct SQL deletion of auth.users is exposed.
create function private.erase_account_before_auth_delete() returns trigger
language plpgsql security definer set search_path='' as $$
declare pending private.erasure_account_requests%rowtype; manifest name; result jsonb;
begin
  if not exists(select 1 from public.profiles where id=old.id) then return old; end if;
  select * into pending from private.erasure_account_requests where target_id=old.id and expires_at>clock_timestamp() for update;
  if not found then raise exception using errcode='SR012',message='verified account erasure required'; end if;
  perform private.lock_erasure_tables();
  perform private.require_erasure_actor(pending.actor_id,pending.session_id);
  perform private.validate_erasure_target(pending.actor_id,'account',old.id);
  manifest:=private.build_erasure_manifest('account',old.id);
  result:=private.erasure_summary(manifest);
  if result->>'fingerprint'<>pending.fingerprint then raise exception using errcode='SR001',message='erasure preview changed'; end if;
  perform private.apply_erasure(manifest);
  delete from private.erasure_password_attempts where actor_id=old.id;
  delete from private.erasure_account_requests where target_id=old.id or actor_id=old.id;
  return old;
end $$;
create trigger verified_account_erasure before delete on auth.users for each row execute function private.erase_account_before_auth_delete();
create function public.cancel_erasure_v1(p_actor uuid,p_target uuid) returns void
language sql security definer set search_path='' as $$
  delete from private.erasure_account_requests where target_id=p_target and actor_id=p_actor;
$$;

revoke all on function public.erasure_identity_v1(),public.preview_erasure_v1(text,uuid),public.begin_erasure_password_attempt_v1(uuid,uuid),public.execute_erasure_v1(uuid,uuid,text,uuid,text),public.cancel_erasure_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.erasure_identity_v1(),public.preview_erasure_v1(text,uuid) to authenticated;
grant execute on function public.begin_erasure_password_attempt_v1(uuid,uuid),public.execute_erasure_v1(uuid,uuid,text,uuid,text),public.cancel_erasure_v1(uuid,uuid) to service_role;
-- Private functions have no caller grants; only these definer entry points.
revoke all on function private.erasure_key(oid,jsonb),private.build_erasure_manifest(text,uuid),private.erasure_summary(name),private.require_erasure_actor(uuid,uuid),private.validate_erasure_target(uuid,text,uuid),private.lock_erasure_tables(),private.apply_erasure(name),private.erase_account_before_auth_delete() from public,anon,authenticated,service_role;
commit;
