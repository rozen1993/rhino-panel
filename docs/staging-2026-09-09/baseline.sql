begin read only;
select
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.profiles where is_active and role='admin') as active_admins,
  (select count(*) from public.profiles where is_active and role='burson') as active_burson,
  (select count(*) from public.profiles where is_burson_operator) as linked_operators,
  (select count(*) from public.activities) as activities,
  (select md5(coalesce(string_agg(to_jsonb(a)::text,'' order by a.id),'')) from public.activities a) as activities_hash,
  (select md5(coalesce(string_agg((to_jsonb(s)-'place')::text,'' order by s.activity_id,s.position),'')) from public.activity_date_spans s) as journeys_hash,
  (select md5(coalesce(string_agg((to_jsonb(p)-'is_burson_operator'-'updated_at')::text,'' order by p.id),'')) from public.profiles p) as profiles_without_link_hash,
  (select count(*) from public.activity_messages) as internal_messages,
  (select count(*) from public.audit_events) as audit_events,
  (select count(*) from auth.users) as auth_users;
commit;
