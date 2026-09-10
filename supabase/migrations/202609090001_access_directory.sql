-- Limited public account picker for the pilot; no operational or Auth data.
create function public.access_directory_v1()
returns table(username text, display_name text, role text)
language sql stable security definer set search_path = ''
as $$
  select p.username::text, p.display_name, p.role::text
  from public.profiles p
  where p.is_active and p.role::text in ('admin', 'operario', 'aunor')
  order by case p.role::text when 'admin' then 0 when 'operario' then 1 else 2 end, p.display_name, p.username;
$$;
revoke all on function public.access_directory_v1() from public;
grant execute on function public.access_directory_v1() to anon, authenticated;
