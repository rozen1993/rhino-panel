begin;

-- Only the two columns needed by provisioning/recovery, not profile contents.
grant select (id, username) on public.profiles to service_role;

-- Durable cross-request mutex: never expire a lock while an Auth write may
-- still be running. Ambiguous failures require operator reconciliation.
create table private.credential_operations (
  profile_id uuid primary key references public.profiles(id),
  operation_id uuid not null unique,
  actor_id uuid not null references public.profiles(id),
  started_at timestamptz not null default clock_timestamp()
);
revoke all on private.credential_operations from public, anon, authenticated, service_role;

create function public.begin_credential_operation_v1(p_profile_id uuid, p_actor_id uuid, p_operation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.profiles%rowtype;
begin
  select * into target from public.profiles where id=p_profile_id and is_active for update;
  if not found then raise exception using errcode='SR003', message='account unavailable'; end if;
  if p_profile_id=p_actor_id then
    if not target.must_change_password then
      raise exception using errcode='SR002', message='self reset is not allowed';
    end if;
  else
    perform private.require_service_admin(p_actor_id);
  end if;
  insert into private.credential_operations(profile_id,actor_id,operation_id)
    values(p_profile_id,p_actor_id,p_operation_id);
exception when unique_violation then
  raise exception using errcode='SR001', message='credential operation in progress';
end $$;

create function public.end_credential_operation_v1(p_profile_id uuid, p_operation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from private.credential_operations where profile_id=p_profile_id and operation_id=p_operation_id;
  if not found then raise exception using errcode='SR001', message='credential operation mismatch'; end if;
end $$;
revoke all on function public.begin_credential_operation_v1(uuid,uuid,uuid), public.end_credential_operation_v1(uuid,uuid) from public,anon,authenticated;
grant execute on function public.begin_credential_operation_v1(uuid,uuid,uuid), public.end_credential_operation_v1(uuid,uuid) to service_role;

-- Tokens issued before the security boundary cannot open a fresh app session.
-- Use the underlying Auth session creation time, not the refreshable JWT iat.
create table private.account_session_boundaries (
  profile_id uuid primary key references public.profiles(id),
  valid_after timestamptz not null
);
revoke all on private.account_session_boundaries from public,anon,authenticated,service_role;
create function private.advance_account_session_boundary()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.is_active is not distinct from new.is_active
    and old.role is not distinct from new.role
    and old.must_change_password is not distinct from new.must_change_password
    and not new.must_change_password then return new; end if;
  insert into private.account_session_boundaries values(new.id,clock_timestamp())
    on conflict(profile_id) do update set valid_after=excluded.valid_after;
  update public.app_sessions set revoked_at=coalesce(revoked_at,clock_timestamp()) where user_id=new.id;
  return new;
end $$;
revoke all on function private.advance_account_session_boundary() from public,anon,authenticated,service_role;
create trigger account_session_boundary after update of must_change_password,is_active,role on public.profiles
for each row execute function private.advance_account_session_boundary();

create or replace function public.register_app_session()
returns void language plpgsql security definer set search_path = '' as $$
declare caller_id uuid:=auth.uid(); caller_session uuid:=private.current_session_id(); boundary timestamptz;
begin
  if caller_id is null or caller_session is null then
    raise exception using errcode='SR002', message='authenticated session required';
  end if;
  perform 1 from public.profiles where id=caller_id and is_active and role<>'burson' for share;
  if not found then raise exception using errcode='SR002', message='active profile required'; end if;
  select valid_after into boundary from private.account_session_boundaries where profile_id=caller_id;
  if boundary is not null and not exists(
    select 1 from auth.sessions s where s.id=caller_session and s.user_id=caller_id and s.created_at>boundary
  ) then raise exception using errcode='SR002', message='sign in again after account change'; end if;
  insert into public.app_sessions(session_id,user_id) values(caller_session,caller_id)
    on conflict(session_id) do nothing;
end $$;
commit;
