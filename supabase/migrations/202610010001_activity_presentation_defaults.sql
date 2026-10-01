begin;
-- Normalize future writes without changing request fingerprints, permissions,
-- dates, execution state or any existing record during deployment.
alter table public.activities alter column classification set default 'standard';
create function private.activity_presentation_defaults()
returns trigger language plpgsql set search_path='' as $$
begin
  new.classification := coalesce(new.classification, 'standard');
  if new.type = 'Edición' then new.place := 'Lima'; end if;
  return new;
end $$;
revoke all on function private.activity_presentation_defaults() from public,anon,authenticated,service_role;
create trigger activity_presentation_defaults before insert or update of type,place,classification
  on public.activities for each row execute function private.activity_presentation_defaults();

create function private.editing_span_place()
returns trigger language plpgsql set search_path='' as $$
begin
  if exists(select 1 from public.activities where id=new.activity_id and type='Edición') then
    new.place := 'Lima';
  end if;
  return new;
end $$;
revoke all on function private.editing_span_place() from public,anon,authenticated,service_role;
create trigger editing_span_place before insert or update of place,activity_id
  on public.activity_date_spans for each row execute function private.editing_span_place();

-- Existing places are corrected only through an explicit, version-checked Admin
-- operation. A schema rollout alone must not silently rewrite historical work.
create function public.normalize_editing_location_v1(p_activity_id uuid,p_expected_version integer)
returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype; old_spans jsonb;
begin
  actor := private.require_admin_profile();
  select * into item from public.activities where id=p_activity_id and deleted_at is null for update;
  if not found or item.type<>'Edición' then
    raise exception using errcode='SR002',message='editing activity unavailable';
  end if;
  if p_expected_version is null or item.version<>p_expected_version then
    raise exception using errcode='SR001',message='version conflict';
  end if;
  select jsonb_agg(jsonb_build_object('id',id,'place',place) order by position,id)
    into old_spans from public.activity_date_spans where activity_id=item.id;
  if item.place='Lima' and not exists(select 1 from public.activity_date_spans where activity_id=item.id and place is distinct from 'Lima') then return; end if;
  update public.activities set place='Lima',version=version+1,updated_at=now() where id=item.id;
  update public.activity_date_spans set place='Lima' where activity_id=item.id;
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
    values(item.id,actor.id,actor.display_name,actor.role,'Ubicación de Edición normalizada',
      jsonb_build_object('lugar_anterior',item.place,'jornadas_anteriores',old_spans,'lugar_nuevo','Lima','fechas_conservadas',true));
end $$;
revoke all on function public.normalize_editing_location_v1(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.normalize_editing_location_v1(uuid,integer) to authenticated;
notify pgrst,'reload schema';
commit;
