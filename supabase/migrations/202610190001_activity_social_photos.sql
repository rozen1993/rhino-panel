-- Private, curated photographs. Apply remotely only after a verified private backup.
begin;
create table private.activity_social_photos (
  id uuid primary key,
  activity_id uuid not null references public.activities(id),
  uploaded_by uuid not null references public.profiles(id),
  digest text not null check (digest ~ '^[a-f0-9]{64}$'),
  caption text not null check (char_length(caption) between 1 and 160),
  width integer not null check (width between 1 and 4000),
  height integer not null check (height between 1 and 4000),
  byte_size integer not null check (byte_size between 1 and 3145728),
  thumb_size integer not null check (thumb_size between 1 and 524288),
  state text not null default 'pending' check (state in ('pending','ready')),
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index social_photos_activity on private.activity_social_photos(activity_id,created_at);
alter table private.activity_social_photos enable row level security;
revoke all on private.activity_social_photos from public,anon,authenticated,service_role;
create trigger preserve_revision after insert or update on private.activity_social_photos
for each row execute function private.preserve_record_revision();
create trigger prevent_physical_delete before delete on private.activity_social_photos
for each row execute function private.reject_irreversible_removal();
create trigger prevent_truncate before truncate on private.activity_social_photos
for each statement execute function private.reject_irreversible_removal();

create function private.can_manage_social_photos(p_activity uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.activities a join public.profiles p on p.id=auth.uid()
   where a.id=p_activity and a.deleted_at is null and p.is_active and not p.must_change_password
   and private.has_active_app_session() and (p.role='admin' or (p.role='operario' and a.responsible_id=p.id)));
$$;
create function private.can_read_social_photo(p_photo uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.activity_social_photos f join public.activities a on a.id=f.activity_id
   join public.profiles p on p.id=auth.uid()
   where f.id=p_photo and a.deleted_at is null and p.is_active and not p.must_change_password
   and private.has_active_app_session() and (
     private.can_manage_social_photos(a.id) or
     (p.role='aunor' and f.state='ready' and f.archived_at is null)));
$$;
revoke all on function private.can_manage_social_photos(uuid),private.can_read_social_photo(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_manage_social_photos(uuid),private.can_read_social_photo(uuid) to authenticated;

create view public.activity_social_photos with (security_barrier=true) as
select id,activity_id,caption,width,height,byte_size,state,version,archived_at,created_at
from private.activity_social_photos f where private.can_read_social_photo(f.id);
revoke all on public.activity_social_photos from public,anon,authenticated;
grant select on public.activity_social_photos to authenticated;

-- RPC-only reservation, serialization and publication. No activity status changes.
create function public.prepare_social_photo_v1(p_activity_id uuid,p_photo_id uuid,p_digest text,
 p_caption text,p_width integer,p_height integer,p_byte_size integer,p_thumb_size integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare f private.activity_social_photos%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
 perform 1 from public.activities where id=p_activity_id for update;
 if not private.can_manage_social_photos(p_activity_id) then raise exception using errcode='SR002',message='photo permission required';end if;
 select * into f from private.activity_social_photos where activity_id=p_activity_id and digest=p_digest and archived_at is null order by created_at limit 1;
 if found then return jsonb_build_object('id',f.id,'state',f.state,'version',f.version);end if;
 if (select count(*) from private.activity_social_photos where activity_id=p_activity_id and archived_at is null)>=3 then
   raise exception using errcode='SR013',message='maximum three photographs';end if;
 insert into private.activity_social_photos(id,activity_id,uploaded_by,digest,caption,width,height,byte_size,thumb_size)
 values(p_photo_id,p_activity_id,auth.uid(),p_digest,btrim(p_caption),p_width,p_height,p_byte_size,p_thumb_size) returning * into f;
 return jsonb_build_object('id',f.id,'state',f.state,'version',f.version);
end $$;

create function public.finish_social_photo_v1(p_photo_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare f private.activity_social_photos%rowtype; actor public.profiles%rowtype; prefix text;
begin
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
 select * into f from private.activity_social_photos where id=p_photo_id;
 perform 1 from public.activities where id=f.activity_id for update;
 if not private.can_manage_social_photos(f.activity_id) or f.archived_at is not null then raise exception using errcode='SR002',message='photo permission required';end if;
 if f.state='ready' then return;end if;
 prefix:=f.activity_id::text||'/'||f.id::text||'/';
 if not exists(select 1 from storage.objects where bucket_id='activity-social-photos' and name=prefix||'image.jpg' and (metadata->>'size')::bigint=f.byte_size)
 or not exists(select 1 from storage.objects where bucket_id='activity-social-photos' and name=prefix||'thumb.webp' and (metadata->>'size')::bigint=f.thumb_size) then
 raise exception using errcode='SR014',message='upload incomplete';end if;
 update private.activity_social_photos set state='ready',version=version+1 where id=f.id;
 select * into actor from public.profiles where id=auth.uid();
 insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
 values(f.activity_id,actor.id,actor.display_name,actor.role,'Foto para redes añadida',jsonb_build_object('photoId',f.id));
end $$;

create function public.set_social_photo_archived_v1(p_photo_id uuid,p_expected_version integer,p_archived boolean)
returns void language plpgsql security definer set search_path='' as $$
declare f private.activity_social_photos%rowtype; actor public.profiles%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
 select * into f from private.activity_social_photos where id=p_photo_id;
 perform 1 from public.activities where id=f.activity_id for update;
 if not private.can_manage_social_photos(f.activity_id) then raise exception using errcode='SR002',message='photo permission required';end if;
 if p_archived is null or p_expected_version is null or f.version<>p_expected_version then raise exception using errcode='SR001',message='photo changed';end if;
 if not p_archived and f.archived_at is not null and (select count(*) from private.activity_social_photos where activity_id=f.activity_id and archived_at is null)>=3 then
 raise exception using errcode='SR013',message='maximum three photographs';end if;
 update private.activity_social_photos set archived_at=case when p_archived then now() else null end,version=version+1 where id=f.id;
 select * into actor from public.profiles where id=auth.uid();
 insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
 values(f.activity_id,actor.id,actor.display_name,actor.role,case when p_archived then 'Foto para redes retirada' else 'Foto para redes restaurada' end,jsonb_build_object('photoId',f.id));
end $$;

revoke all on function public.prepare_social_photo_v1(uuid,uuid,text,text,integer,integer,integer,integer),
 public.finish_social_photo_v1(uuid),public.set_social_photo_archived_v1(uuid,integer,boolean) from public,anon,authenticated,service_role;
grant execute on function public.prepare_social_photo_v1(uuid,uuid,text,text,integer,integer,integer,integer),
 public.finish_social_photo_v1(uuid),public.set_social_photo_archived_v1(uuid,integer,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('activity-social-photos','activity-social-photos',false,3145728,array['image/jpeg','image/webp']);
-- Uploads run in the authenticated Edge Function using its managed service client:
-- objects have no individual Auth owner, so account erasure remains possible.
-- No direct authenticated INSERT/UPDATE/DELETE policies and no public bucket.
-- Policy cannot select a private table directly as the caller; route via a helper.
create function private.can_read_social_photo_object(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.activity_social_photos f where
 p_name in (f.activity_id::text||'/'||f.id::text||'/image.jpg',f.activity_id::text||'/'||f.id::text||'/thumb.webp')
 and private.can_read_social_photo(f.id));
$$;
revoke all on function private.can_read_social_photo_object(text) from public,anon,authenticated,service_role;
grant execute on function private.can_read_social_photo_object(text) to authenticated;
create policy social_photos_read on storage.objects for select to authenticated
using(bucket_id='activity-social-photos' and private.can_read_social_photo_object(name));

-- Only a verified permanent erasure can reach this trigger. Physical object
-- deletion uses Storage API afterwards; never delete storage.objects via SQL.
create table private.social_photo_erasure_queue(id uuid primary key,paths text[] not null,created_at timestamptz not null default now());
revoke all on private.social_photo_erasure_queue from public,anon,authenticated,service_role;
create function private.queue_social_photo_erasure() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.social_photo_erasure_queue(id,paths) values(old.id,array[old.activity_id::text||'/'||old.id::text||'/image.jpg',old.activity_id::text||'/'||old.id::text||'/thumb.webp']);
 return old;
end $$;
revoke all on function private.queue_social_photo_erasure() from public,anon,authenticated,service_role;
create trigger queue_object_cleanup after delete on private.activity_social_photos for each row execute function private.queue_social_photo_erasure();
create function public.pending_social_photo_erasure_v1() returns table(id uuid,paths text[])
language sql security definer set search_path='' as $$select id,paths from private.social_photo_erasure_queue order by created_at limit 100$$;
create function public.ack_social_photo_erasure_v1(p_ids uuid[]) returns void
language sql security definer set search_path='' as $$delete from private.social_photo_erasure_queue where id=any(p_ids)$$;
-- Compensate an in-flight upload if an approved erasure removed its reservation.
-- A pending/ready/archived reservation is never eligible for this cleanup.
create function public.queue_erased_social_photo_upload_v1(p_activity_id uuid,p_photo_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
 if not exists(select 1 from private.activity_social_photos where id=p_photo_id) then
 insert into private.social_photo_erasure_queue(id,paths) values(p_photo_id,array[p_activity_id::text||'/'||p_photo_id::text||'/image.jpg',p_activity_id::text||'/'||p_photo_id::text||'/thumb.webp'])
 on conflict(id) do nothing;
 end if;
end $$;
revoke all on function public.pending_social_photo_erasure_v1(),public.ack_social_photo_erasure_v1(uuid[]),public.queue_erased_social_photo_upload_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.pending_social_photo_erasure_v1(),public.ack_social_photo_erasure_v1(uuid[]),public.queue_erased_social_photo_upload_v1(uuid,uuid) to service_role;
notify pgrst,'reload schema';
commit;
