-- Social keeps folder links only. No Storage bucket or Microsoft API access.
-- Apply remotely only after a verified private backup; no sample rows here.
begin;
create table private.activity_social_folders (
  activity_id uuid primary key references public.activities(id),
  folder_url text not null check (char_length(folder_url) between 10 and 3000),
  version integer not null default 1 check(version>0),
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);
alter table private.activity_social_folders enable row level security;
revoke all on private.activity_social_folders from public,anon,authenticated,service_role;
create trigger preserve_revision after insert or update on private.activity_social_folders
for each row execute function private.preserve_record_revision();
create trigger prevent_physical_delete before delete on private.activity_social_folders
for each row execute function private.reject_irreversible_removal();
create trigger prevent_truncate before truncate on private.activity_social_folders
for each statement execute function private.reject_irreversible_removal();

create function private.can_manage_social_folder(p_activity uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.activities a join public.profiles p on p.id=auth.uid()
 where a.id=p_activity and a.deleted_at is null and p.is_active and not p.must_change_password
 and private.has_active_app_session() and (p.role='admin' or (p.role='operario' and a.responsible_id=p.id)));
$$;
create function private.can_read_social_folder(p_activity uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.activities a join public.profiles p on p.id=auth.uid()
 where a.id=p_activity and a.deleted_at is null and p.is_active and not p.must_change_password
 and private.has_active_app_session() and (p.role in ('admin','aunor') or (p.role='operario' and a.responsible_id=p.id)));
$$;
revoke all on function private.can_manage_social_folder(uuid),private.can_read_social_folder(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_manage_social_folder(uuid),private.can_read_social_folder(uuid) to authenticated;
create view public.activity_social_folders with (security_barrier=true) as
select activity_id,folder_url,version,updated_at from private.activity_social_folders f
where private.can_read_social_folder(f.activity_id);
revoke all on public.activity_social_folders from public,anon,authenticated;
grant select on public.activity_social_folders to authenticated;

create function public.save_social_folder_v1(p_activity_id uuid,p_folder_url text,p_expected_version integer)
returns void language plpgsql security definer set search_path='' as $$
declare f private.activity_social_folders%rowtype; actor public.profiles%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
 perform 1 from public.activities where id=p_activity_id for update;
 if not private.can_manage_social_folder(p_activity_id) then raise exception using errcode='SR002',message='folder permission required';end if;
 -- Strict Microsoft host allowlist; not proof of folder existence/access.
 if p_folder_url is null or char_length(p_folder_url)>3000 or p_folder_url ~ '[[:space:][:cntrl:]\\]'
 or not (p_folder_url ~ '^https://(1drv\.ms|onedrive\.live\.com|[a-z0-9-]+\.sharepoint\.com)/[^/?#][^[:space:]]*$'
 or p_folder_url ~ '^https://onedrive\.live\.com/\?([^#]*&)?(id|resid)=[^&#]+[^[:space:]]*$')
 then raise exception using errcode='SR003',message='valid OneDrive folder URL required';end if;
 select * into f from private.activity_social_folders where activity_id=p_activity_id;
 -- Same-value retry is safe and does not duplicate audits.
 if f.folder_url=p_folder_url and p_expected_version in (f.version,f.version-1) then return;end if;
 if p_expected_version is null or p_expected_version<>coalesce(f.version,0) then raise exception using errcode='SR001',message='folder changed';end if;
 insert into private.activity_social_folders(activity_id,folder_url,updated_by)
 values(p_activity_id,p_folder_url,auth.uid())
 on conflict(activity_id) do update set folder_url=excluded.folder_url,updated_by=excluded.updated_by,
 updated_at=now(),version=private.activity_social_folders.version+1;
 select * into actor from public.profiles where id=auth.uid();
 insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
 values(p_activity_id,actor.id,actor.display_name,actor.role,'Carpeta Social vinculada',jsonb_build_object('version',coalesce(f.version,0)+1));
end $$;
revoke all on function public.save_social_folder_v1(uuid,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.save_social_folder_v1(uuid,text,integer) to authenticated;
notify pgrst,'reload schema';
commit;
