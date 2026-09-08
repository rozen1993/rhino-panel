begin;

-- This migration depends on 202609050001 (journey places) and 202609060001.
create unique index profiles_one_active_aunor
  on public.profiles ((true)) where is_active and role = 'aunor';

create function private.guard_single_aunor_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'aunor' and new.is_active then
    if exists(select 1 from public.profiles p where p.id<>new.id and p.role='aunor' and p.is_active) then
      raise exception using errcode='SR009', message='only one active Aunor account is allowed';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_single_aunor before insert or update of role,is_active on public.profiles
  for each row execute function private.guard_single_aunor_profile();
revoke all on function private.guard_single_aunor_profile() from public,anon,authenticated,service_role;

create table private.aunor_services (
  id text primary key,
  position smallint not null unique,
  label text not null,
  reference text not null default 'Cláusula 2.2'
);
-- Reference labels only. No quantities, terms, equivalences or payment decisions.
insert into private.aunor_services (id, position, label) values
  ('cobertura',1,'Cobertura fotográfica y audiovisual'),
  ('redes',2,'Videos para redes sociales'),
  ('micronews',3,'Micronews internos'),
  ('resumen-anual',4,'Videos de resumen anual'),
  ('fiesta',5,'Videos de fiesta de fin de año'),
  ('campanas',6,'Videos de campañas internas'),
  ('social-ambiental',7,'Videos sociales y ambientales'),
  ('seguridad-vial',8,'Videos de seguridad vial'),
  ('voluntariado',9,'Videos de voluntariado'),
  ('ositran',10,'Postproducción de resumen OSITRAN'),
  ('webinars',11,'Webinars'),
  ('radio',12,'Spots radiales');

-- This table is the explicit Aunor association, independent of a service link.
-- Every publication revision is retained. No voluntary unpublish API in v1.
create table private.aunor_publications (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  client_code text not null default 'AUNOR' check (client_code = 'AUNOR'),
  version integer not null check (version > 0),
  summary text not null check (char_length(summary) between 1 and 5000),
  service_id text references private.aunor_services(id),
  not_performed_reason text not null default '' check (char_length(not_performed_reason) <= 3000),
  recorded_by uuid not null references public.profiles(id),
  published_at timestamptz not null default now(),
  superseded_at timestamptz,
  unique (activity_id, version)
);
create unique index aunor_publications_current on private.aunor_publications(activity_id)
  where superseded_at is null;

-- Tracks only material changes, not comments, planning or internal opinion.
-- It never restricts or rewrites the existing execution workflow.
create table private.aunor_material_revisions (
  activity_id uuid primary key references public.activities(id) on delete restrict,
  revision integer not null default 0
);
create function private.track_aunor_material_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.material_link is distinct from new.material_link then
    insert into private.aunor_material_revisions(activity_id, revision)
    values (new.id, 1)
    on conflict (activity_id) do update
      set revision = private.aunor_material_revisions.revision + 1;
  end if;
  return new;
end;
$$;
create trigger activities_aunor_material_revision
  after update of material_link on public.activities
  for each row execute function private.track_aunor_material_revision();

create table private.aunor_deliveries (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  version integer not null check (version > 0),
  material_revision integer not null check (material_revision >= 0),
  material_link text not null check (private.is_safe_https_url(material_link)),
  label text not null check (char_length(btrim(label)) between 1 and 180),
  published_by uuid not null references public.profiles(id),
  published_at timestamptz not null default now(),
  unique (activity_id, version)
);

create table private.aunor_agreements (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  channel text not null check (channel in ('Llamada','Reunión','Acuerdo verbal')),
  contacted_at timestamptz not null,
  requester_declared text not null check (char_length(btrim(requester_declared)) between 2 and 180),
  body text not null check (char_length(btrim(body)) between 2 and 5000),
  evidence_link text not null default '' check (evidence_link = '' or private.is_safe_https_url(evidence_link)),
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now(),
  corrects_id uuid references private.aunor_agreements(id) on delete restrict
);

create table private.aunor_replacements (
  id uuid primary key default gen_random_uuid(),
  original_activity_id uuid not null references public.activities(id) on delete restrict,
  substitute_activity_id uuid not null references public.activities(id) on delete restrict,
  original_title text not null,
  substitute_title text not null,
  agreement_id uuid not null references private.aunor_agreements(id) on delete restrict,
  reason text not null check (char_length(btrim(reason)) between 2 and 3000),
  evidence_note text not null check (char_length(btrim(evidence_note)) between 2 and 3000),
  evidence_link text not null default '' check (evidence_link = '' or private.is_safe_https_url(evidence_link)),
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now(),
  corrects_id uuid references private.aunor_replacements(id) on delete restrict,
  check (original_activity_id <> substitute_activity_id)
);
create unique index aunor_replacement_single_correction
  on private.aunor_replacements(corrects_id) where corrects_id is not null;
create unique index aunor_agreement_single_correction
  on private.aunor_agreements(corrects_id) where corrects_id is not null;

create table private.aunor_confirmations (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid unique references private.aunor_deliveries(id) on delete restrict,
  replacement_id uuid unique references private.aunor_replacements(id) on delete restrict,
  confirmed_by uuid not null references public.profiles(id),
  confirmed_at timestamptz not null default now(),
  check ((delivery_id is not null)::integer + (replacement_id is not null)::integer = 1)
);

create table private.aunor_messages (
  id uuid primary key default gen_random_uuid(),
  sequence bigint generated always as identity unique,
  activity_id uuid not null references public.activities(id) on delete restrict,
  author_id uuid not null references public.profiles(id),
  author_role public.app_role not null check (author_role in ('admin','aunor')),
  body text not null check (body = btrim(body) and char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  corrects_id uuid references private.aunor_messages(id) on delete restrict
);
create index aunor_messages_activity_sequence on private.aunor_messages(activity_id,sequence);

create table private.aunor_read_markers (
  activity_id uuid not null references public.activities(id) on delete restrict,
  profile_id uuid not null references public.profiles(id),
  last_sequence bigint not null default 0 check (last_sequence >= 0),
  primary key(activity_id,profile_id)
);

create table private.aunor_requests (
  actor_id uuid not null references public.profiles(id),
  request_id uuid not null,
  fingerprint text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);

-- No direct table grants. RLS is defence in depth; public projections/RPCs are
-- the sole interface, including for Admin. Service credentials cannot bypass
-- table privileges accidentally.
alter table private.aunor_services enable row level security;
alter table private.aunor_publications enable row level security;
alter table private.aunor_material_revisions enable row level security;
alter table private.aunor_deliveries enable row level security;
alter table private.aunor_agreements enable row level security;
alter table private.aunor_replacements enable row level security;
alter table private.aunor_confirmations enable row level security;
alter table private.aunor_messages enable row level security;
alter table private.aunor_read_markers enable row level security;
alter table private.aunor_requests enable row level security;
revoke all on private.aunor_services, private.aunor_publications,
  private.aunor_material_revisions, private.aunor_deliveries,
  private.aunor_agreements, private.aunor_replacements,
  private.aunor_confirmations, private.aunor_messages,
  private.aunor_read_markers, private.aunor_requests
  from public, anon, authenticated, service_role;
revoke all on sequence private.aunor_messages_sequence_seq from public, anon, authenticated, service_role;

create function private.can_access_aunor_activity(target_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_app_role() in ('admin','aunor'), false)
    and exists (
      select 1 from private.aunor_publications p
      join public.activities a on a.id = p.activity_id
      where p.activity_id = target_id and p.client_code = 'AUNOR'
        and p.superseded_at is null and a.deleted_at is null
        and a.origin <> 'burson'
    );
$$;

create view public.aunor_activities with (security_invoker = false, security_barrier = true) as
select a.id, a.type, a.title, a.status, a.place,
  p.summary, p.service_id,
  case when a.status='Entregada' then '' else p.not_performed_reason end as not_performed_reason,
  p.version as publication_version, p.published_at,
  coalesce((
    select count(*) from private.aunor_messages m
    where m.activity_id = a.id and m.author_role <> private.current_app_role()
      and m.sequence > coalesce((
        select r.last_sequence from private.aunor_read_markers r
        where r.activity_id = a.id and r.profile_id = auth.uid()
      ),0)
  ),0)::integer as unread_count
from public.activities a
join private.aunor_publications p on p.activity_id = a.id and p.superseded_at is null
where private.can_access_aunor_activity(a.id);

create view public.aunor_journeys with (security_invoker = false, security_barrier = true) as
select s.activity_id, s.position, s.start_date, s.end_date, s.place
from public.activity_date_spans s where private.can_access_aunor_activity(s.activity_id);

create view public.aunor_services with (security_invoker = false, security_barrier = true) as
select s.id, s.position, s.label, s.reference from private.aunor_services s
where private.current_app_role() in ('admin','aunor');

create view public.aunor_deliveries with (security_invoker = false, security_barrier = true) as
select d.id, d.activity_id, d.version, d.material_link, d.label, d.published_at,
  c.confirmed_at, case when c.id is not null then 'Aunor'::text else null::text end as confirmed_by,
  (
    d.version = (select max(n.version) from private.aunor_deliveries n where n.activity_id = d.activity_id)
    and d.material_revision = coalesce((select r.revision from private.aunor_material_revisions r where r.activity_id=d.activity_id),0)
    and a.material_link = d.material_link and a.status = 'Entregada'
  ) as is_current
from private.aunor_deliveries d
join public.activities a on a.id=d.activity_id
left join private.aunor_confirmations c on c.delivery_id=d.id
where private.can_access_aunor_activity(d.activity_id);

create view public.aunor_agreements with (security_invoker = false, security_barrier = true) as
select g.id, g.activity_id, g.channel, g.contacted_at, g.requester_declared,
  g.body, g.evidence_link, 'Admin · Rhino'::text as recorded_by, g.recorded_at, g.corrects_id,
  not exists(select 1 from private.aunor_agreements n where n.corrects_id=g.id) as is_current
from private.aunor_agreements g where private.can_access_aunor_activity(g.activity_id);

create view public.aunor_replacements with (security_invoker = false, security_barrier = true) as
select r.id, r.original_activity_id, r.substitute_activity_id,
  r.original_title, r.substitute_title, r.agreement_id, r.reason,
  r.evidence_note, r.evidence_link, 'Admin · Rhino'::text as recorded_by, r.recorded_at, r.corrects_id,
  c.confirmed_at, case when c.id is not null then 'Aunor'::text else null::text end as confirmed_by,
  not exists(select 1 from private.aunor_replacements n where n.corrects_id=r.id) as is_current
from private.aunor_replacements r
left join private.aunor_confirmations c on c.replacement_id=r.id
where private.can_access_aunor_activity(r.original_activity_id)
  and private.can_access_aunor_activity(r.substitute_activity_id)
  and exists(select 1 from private.aunor_agreements g
    where g.id=r.agreement_id and private.can_access_aunor_activity(g.activity_id));

create view public.aunor_messages with (security_invoker = false, security_barrier = true) as
select m.id, m.sequence, m.activity_id,
  case m.author_role when 'aunor' then 'Aunor' else 'Admin · Rhino' end as author,
  m.author_role, m.body, m.created_at, m.corrects_id,
  m.author_id = auth.uid() as is_own
from private.aunor_messages m where private.can_access_aunor_activity(m.activity_id);

revoke all on public.aunor_activities,public.aunor_journeys,public.aunor_services,
  public.aunor_deliveries,public.aunor_agreements,public.aunor_replacements,public.aunor_messages
  from public,anon,authenticated,service_role;
grant select on public.aunor_activities,public.aunor_journeys,public.aunor_services,
  public.aunor_deliveries,public.aunor_agreements,public.aunor_replacements,public.aunor_messages
  to authenticated;
revoke all on function private.track_aunor_material_revision() from public,anon,authenticated,service_role;
revoke all on function private.can_access_aunor_activity(uuid) from public,anon,authenticated,service_role;

-- Legacy audit remains internal. Activity RLS itself remains unchanged.
drop policy audit_events_select_authorized on public.audit_events;
create policy audit_events_select_authorized on public.audit_events
  for select to authenticated using (
    private.current_app_role() in ('admin','operario') and private.can_view_activity_id(activity_id)
  );

create or replace function public.post_activity_message_v1(
  p_activity_id uuid,
  p_expected_activity_version integer,
  p_body text
)
returns table (
  activity_id uuid,
  activity_version integer,
  message_id uuid,
  message_version integer,
  opened_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype := private.require_active_profile();
  activity public.activities%rowtype;
  normalized_body text := btrim(coalesce(p_body, ''));
  is_opening boolean := p_expected_activity_version is not null;
  next_activity_version integer;
  new_message_id uuid;
  conversation_opened_at timestamptz;
begin
  if char_length(normalized_body) not between 1 and 5000 then
    raise exception using errcode = 'SR003', message = 'invalid message body';
  end if;

  if is_opening then
    select candidate.* into activity
    from public.activities candidate
    where candidate.id = p_activity_id
    for update;
  else
    select candidate.* into activity
    from public.activities candidate
    where candidate.id = p_activity_id
    for share;
  end if;

  if not found or activity.deleted_at is not null then
    raise exception using errcode = 'SR002', message = 'conversation unavailable';
  end if;
  if actor.role not in ('admin', 'operario')
    or (
      actor.role = 'operario'
      and activity.responsible_id <> actor.id
    ) then
    raise exception using errcode = 'SR002', message = 'conversation unavailable';
  end if;
  if activity.status <> 'Entregada' then
    raise exception using errcode = 'SR008', message = 'conversation is not enabled';
  end if;

  if is_opening then
    if actor.role <> 'admin' then
      raise exception using errcode = 'SR008', message = 'Admin must open the conversation';
    end if;
    if activity.thread_opened_at is not null
      or activity.version <> p_expected_activity_version then
      raise exception using errcode = 'SR001', message = 'conversation version conflict';
    end if;

    conversation_opened_at := now();
    next_activity_version := activity.version + 1;
    update public.activities target
    set thread_opened_at = conversation_opened_at,
        version = next_activity_version,
        updated_at = conversation_opened_at
    where target.id = activity.id;
  else
    if activity.thread_opened_at is null then
      raise exception using errcode = 'SR008', message = 'Admin must open the conversation';
    end if;
    conversation_opened_at := activity.thread_opened_at;
    next_activity_version := activity.version;
  end if;

  insert into public.activity_messages (
    activity_id, author_id, author_name, author_role, body, opens_thread
  ) values (
    activity.id, actor.id, actor.display_name, actor.role,
    normalized_body, is_opening
  )
  returning id into new_message_id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id,
    actor.id,
    actor.display_name,
    actor.role,
    case
      when is_opening then 'Admin inició la conversación'
      else 'Mensaje agregado'
    end,
    jsonb_build_object(
      'mensaje_id', new_message_id,
      'apertura', is_opening
    )
  );

  return query select
    activity.id,
    next_activity_version,
    new_message_id,
    1,
    conversation_opened_at;
end;
$$;

create or replace function public.edit_activity_message_v1(
  p_message_id uuid,
  p_expected_message_version integer,
  p_body text
)
returns table (
  activity_id uuid,
  activity_version integer,
  message_id uuid,
  message_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype := private.require_active_profile();
  target_activity_id uuid;
  activity public.activities%rowtype;
  message_record public.activity_messages%rowtype;
  normalized_body text := btrim(coalesce(p_body, ''));
  next_message_version integer;
begin
  if char_length(normalized_body) not between 1 and 5000 then
    raise exception using errcode = 'SR003', message = 'invalid message body';
  end if;

  select candidate.activity_id into target_activity_id
  from public.activity_messages candidate
  where candidate.id = p_message_id;

  if not found then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;

  select candidate.* into activity
  from public.activities candidate
  where candidate.id = target_activity_id
  for share;

  if not found or activity.deleted_at is not null
    or actor.role not in ('admin', 'operario')
    or (
      actor.role = 'operario'
      and activity.responsible_id <> actor.id
    ) then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if activity.status <> 'Entregada' or activity.thread_opened_at is null then
    raise exception using errcode = 'SR008', message = 'conversation is not enabled';
  end if;

  select candidate.* into message_record
  from public.activity_messages candidate
  where candidate.id = p_message_id
    and candidate.activity_id = activity.id
  for update;

  if not found or message_record.deleted_at is not null
    or message_record.author_id <> actor.id then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if p_expected_message_version is null
    or message_record.version <> p_expected_message_version then
    raise exception using errcode = 'SR001', message = 'message version conflict';
  end if;

  next_message_version := message_record.version + 1;
  update public.activity_messages target
  set body = normalized_body,
      edited_at = now(),
      version = next_message_version
  where target.id = message_record.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id,
    actor.id,
    actor.display_name,
    actor.role,
    'Mensaje editado',
    jsonb_build_object('mensaje_id', message_record.id)
  );

  return query select
    activity.id,
    activity.version,
    message_record.id,
    next_message_version;
end;
$$;

create or replace function public.delete_activity_message_v1(
  p_message_id uuid,
  p_expected_message_version integer
)
returns table (
  activity_id uuid,
  activity_version integer,
  message_id uuid,
  message_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype := private.require_active_profile();
  target_activity_id uuid;
  activity public.activities%rowtype;
  message_record public.activity_messages%rowtype;
  next_message_version integer;
begin
  select candidate.activity_id into target_activity_id
  from public.activity_messages candidate
  where candidate.id = p_message_id;

  if not found then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;

  select candidate.* into activity
  from public.activities candidate
  where candidate.id = target_activity_id
  for share;

  if not found or activity.deleted_at is not null
    or actor.role not in ('admin', 'operario')
    or (
      actor.role = 'operario'
      and activity.responsible_id <> actor.id
    ) then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if activity.status <> 'Entregada' or activity.thread_opened_at is null then
    raise exception using errcode = 'SR008', message = 'conversation is not enabled';
  end if;

  select candidate.* into message_record
  from public.activity_messages candidate
  where candidate.id = p_message_id
    and candidate.activity_id = activity.id
  for update;

  if not found or message_record.deleted_at is not null
    or message_record.author_id <> actor.id then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if p_expected_message_version is null
    or message_record.version <> p_expected_message_version then
    raise exception using errcode = 'SR001', message = 'message version conflict';
  end if;

  next_message_version := message_record.version + 1;
  update public.activity_messages target
  set deleted_at = now(),
      deleted_by = actor.id,
      version = next_message_version
  where target.id = message_record.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id,
    actor.id,
    actor.display_name,
    actor.role,
    'Mensaje eliminado lógicamente',
    jsonb_build_object('mensaje_id', message_record.id)
  );

  return query select
    activity.id,
    activity.version,
    message_record.id,
    next_message_version;
end;
$$;

-- All external writes follow the same lock order: channel advisory lock,
-- actor profile, sorted activity rows, publication, external object.
create function public.aunor_mutate_v1(
  p_command text, p_activity_id uuid, p_request_id uuid, p_payload jsonb
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor public.profiles%rowtype;
  activity public.activities%rowtype;
  other_activity public.activities%rowtype;
  publication private.aunor_publications%rowtype;
  delivery private.aunor_deliveries%rowtype;
  replacement private.aunor_replacements%rowtype;
  agreement private.aunor_agreements%rowtype;
  previous_message private.aunor_messages%rowtype;
  object_id uuid;
  other_id uuid;
  correction_id uuid;
  confirmation_id uuid;
  expected integer;
  revision integer;
  next_version integer;
  last_sequence bigint;
  normalized text;
  reason text;
  evidence text;
  service text;
  fingerprint text;
  previous_request private.aunor_requests%rowtype;
  result jsonb;
  allowed_keys text[];
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-aunor-channel-v1',0)
  );
  actor := private.require_active_profile();
  if actor.role not in ('admin','aunor') then
    raise exception using errcode='SR002', message='Aunor channel unavailable';
  end if;
  if p_command is null or p_activity_id is null or p_request_id is null
    or p_payload is null or jsonb_typeof(p_payload)<>'object'
    or octet_length(p_payload::text)>32000 then
    raise exception using errcode='SR003', message='invalid Aunor request';
  end if;
  case p_command
    when 'publish' then allowed_keys := array['expectedVersion','summary','serviceId','notPerformedReason'];
    when 'delivery' then allowed_keys := array['expectedActivityVersion','label'];
    when 'agreement' then allowed_keys := array['channel','contactedAt','requesterDeclared','body','evidenceLink','correctsId'];
    when 'replacement' then allowed_keys := array['substituteId','agreementId','reason','evidenceNote','evidenceLink','correctsId'];
    when 'message' then allowed_keys := array['body','correctsId'];
    when 'read' then allowed_keys := array['sequence'];
    when 'confirm-delivery' then allowed_keys := array['objectId','version','acknowledged'];
    when 'confirm-replacement' then allowed_keys := array['objectId','acknowledged'];
    else raise exception using errcode='SR003', message='invalid Aunor command';
  end case;
  if exists(select 1 from jsonb_object_keys(p_payload) k where not(k=any(allowed_keys))) then
    raise exception using errcode='SR003', message='unexpected Aunor fields';
  end if;
  if p_command in ('publish','delivery','agreement','replacement') and actor.role<>'admin'
    or p_command in ('confirm-delivery','confirm-replacement') and actor.role<>'aunor' then
    raise exception using errcode='SR002', message='action not authorized';
  end if;

  if p_command='replacement' then
    other_id := (p_payload->>'substituteId')::uuid;
    if other_id is null or other_id=p_activity_id then
      raise exception using errcode='SR003', message='invalid replacement';
    end if;
  elsif p_command='confirm-replacement' then
    select r.substitute_activity_id into other_id from private.aunor_replacements r
    where r.id=(p_payload->>'objectId')::uuid and r.original_activity_id=p_activity_id;
    if not found then
      raise exception using errcode='SR002', message='replacement unavailable';
    end if;
  end if;
  perform a.id from public.activities a
    where a.id=p_activity_id or a.id=other_id order by a.id for update;
  select a.* into activity from public.activities a where a.id=p_activity_id;
  if not found or activity.deleted_at is not null or activity.origin='burson' then
    raise exception using errcode='SR002', message='activity unavailable';
  end if;
  if other_id is not null then
    select a.* into other_activity from public.activities a where a.id=other_id;
    if not found or not private.can_access_aunor_activity(other_id) then
      raise exception using errcode='SR002', message='replacement unavailable';
    end if;
  end if;
  if p_command<>'publish' and not private.can_access_aunor_activity(p_activity_id) then
    raise exception using errcode='SR002', message='publication unavailable';
  end if;
  fingerprint := pg_catalog.md5(jsonb_build_array(p_command,p_activity_id,p_payload)::text);
  select r.* into previous_request from private.aunor_requests r
    where r.actor_id=actor.id and r.request_id=p_request_id;
  if found then
    if previous_request.fingerprint<>fingerprint then
      raise exception using errcode='SR006', message='request key reused with other input';
    end if;
    return previous_request.result;
  end if;

  case p_command
  when 'publish' then
    select p.* into publication from private.aunor_publications p
      where p.activity_id=p_activity_id and p.superseded_at is null for update;
    expected := (p_payload->>'expectedVersion')::integer;
    normalized := btrim(coalesce(p_payload->>'summary',''));
    reason := btrim(coalesce(p_payload->>'notPerformedReason',''));
    service := nullif(p_payload->>'serviceId','');
    if expected is null or expected<>coalesce(publication.version,0) then
      raise exception using errcode='SR001', message='publication changed';
    end if;
    if char_length(normalized) not between 1 and 5000 or char_length(reason)>3000
      or (reason<>'' and activity.status='Entregada')
      or (service is not null and not exists(select 1 from private.aunor_services s where s.id=service)) then
      raise exception using errcode='SR003', message='invalid publication';
    end if;
    update private.aunor_publications set superseded_at=now()
      where id=publication.id;
    insert into private.aunor_publications(activity_id,version,summary,service_id,not_performed_reason,recorded_by)
      values(p_activity_id,expected+1,normalized,service,reason,actor.id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id,'version',expected+1);

  when 'delivery' then
    expected := (p_payload->>'expectedActivityVersion')::integer;
    normalized := btrim(coalesce(p_payload->>'label',''));
    if expected is null or expected<>activity.version then
      raise exception using errcode='SR001', message='activity changed';
    end if;
    if activity.status<>'Entregada' or activity.material_link=''
      or char_length(normalized) not between 1 and 180 then
      raise exception using errcode='SR003', message='delivery is not ready';
    end if;
    select coalesce(max(d.version),0)+1 into next_version
      from private.aunor_deliveries d where d.activity_id=p_activity_id;
    select coalesce((select r.revision from private.aunor_material_revisions r where r.activity_id=p_activity_id),0) into revision;
    insert into private.aunor_deliveries(activity_id,version,material_revision,material_link,label,published_by)
      values(p_activity_id,next_version,revision,activity.material_link,normalized,actor.id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id,'version',next_version);

  when 'agreement' then
    correction_id := nullif(p_payload->>'correctsId','')::uuid;
    if correction_id is not null and not exists(
      select 1 from private.aunor_agreements g where g.id=correction_id and g.activity_id=p_activity_id
        and not exists(select 1 from private.aunor_agreements n where n.corrects_id=g.id)
    ) then
      raise exception using errcode='SR002', message='agreement unavailable';
    end if;
    if p_payload->>'channel' is null or p_payload->>'contactedAt' is null then
      raise exception using errcode='SR003', message='agreement details required';
    end if;
    insert into private.aunor_agreements(activity_id,channel,contacted_at,requester_declared,body,evidence_link,recorded_by,corrects_id)
      values(p_activity_id,p_payload->>'channel',(p_payload->>'contactedAt')::timestamptz,
        btrim(coalesce(p_payload->>'requesterDeclared','')),btrim(coalesce(p_payload->>'body','')),
        btrim(coalesce(p_payload->>'evidenceLink','')),actor.id,correction_id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id);

  when 'replacement' then
    object_id := (p_payload->>'agreementId')::uuid;
    select g.* into agreement from private.aunor_agreements g
      where g.id=object_id and g.activity_id in (p_activity_id,other_id);
    if not found then
      raise exception using errcode='SR002', message='agreement unavailable';
    end if;
    correction_id := nullif(p_payload->>'correctsId','')::uuid;
    if correction_id is not null and not exists(
      select 1 from private.aunor_replacements r where r.id=correction_id
        and r.original_activity_id=p_activity_id
        and private.can_access_aunor_activity(r.substitute_activity_id)
        and not exists(select 1 from private.aunor_replacements n where n.corrects_id=r.id)
    ) then
      raise exception using errcode='SR002', message='replacement correction unavailable';
    end if;
    insert into private.aunor_replacements(original_activity_id,substitute_activity_id,original_title,substitute_title,
      agreement_id,reason,evidence_note,evidence_link,recorded_by,corrects_id)
      values(p_activity_id,other_id,activity.title,other_activity.title,object_id,
        btrim(coalesce(p_payload->>'reason','')),btrim(coalesce(p_payload->>'evidenceNote','')),
        btrim(coalesce(p_payload->>'evidenceLink','')),actor.id,correction_id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id);

  when 'message' then
    normalized := btrim(coalesce(p_payload->>'body',''));
    if char_length(normalized) not between 1 and 5000 then
      raise exception using errcode='SR003', message='invalid message body';
    end if;
    correction_id := nullif(p_payload->>'correctsId','')::uuid;
    if correction_id is not null then
      select m.* into previous_message from private.aunor_messages m
        where m.id=correction_id and m.activity_id=p_activity_id and m.author_id=actor.id;
      if not found then
        raise exception using errcode='SR002', message='only own external messages may be corrected';
      end if;
    end if;
    insert into private.aunor_messages(activity_id,author_id,author_role,body,corrects_id)
      values(p_activity_id,actor.id,actor.role,normalized,correction_id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id);

  when 'read' then
    last_sequence := (p_payload->>'sequence')::bigint;
    if last_sequence is null or last_sequence<0 or (last_sequence>0 and not exists(
      select 1 from private.aunor_messages m where m.activity_id=p_activity_id and m.sequence=last_sequence
    )) then
      raise exception using errcode='SR003', message='invalid read position';
    end if;
    insert into private.aunor_read_markers(activity_id,profile_id,last_sequence)
      values(p_activity_id,actor.id,last_sequence)
      on conflict(activity_id,profile_id) do update
        set last_sequence=greatest(private.aunor_read_markers.last_sequence,excluded.last_sequence);
    result := jsonb_build_object('sequence',last_sequence);

  when 'confirm-delivery' then
    if p_payload->'acknowledged' is distinct from 'true'::jsonb then
      raise exception using errcode='SR003', message='explicit confirmation required';
    end if;
    object_id := (p_payload->>'objectId')::uuid;
    expected := (p_payload->>'version')::integer;
    select d.* into delivery from private.aunor_deliveries d
      where d.id=object_id and d.activity_id=p_activity_id for update;
    if not found then
      raise exception using errcode='SR002', message='delivery unavailable';
    end if;
    if expected is null or expected<>delivery.version or activity.status<>'Entregada'
      or activity.material_link<>delivery.material_link
      or delivery.material_revision<>coalesce((select r.revision from private.aunor_material_revisions r where r.activity_id=p_activity_id),0)
      or exists(select 1 from private.aunor_deliveries n where n.activity_id=p_activity_id and n.version>delivery.version) then
      raise exception using errcode='SR001', message='delivery changed; review the current delivery';
    end if;
    insert into private.aunor_confirmations(delivery_id,confirmed_by)
      values(object_id,actor.id) on conflict(delivery_id) do nothing;
    select c.id into confirmation_id from private.aunor_confirmations c where c.delivery_id=object_id;
    result := jsonb_build_object('id',confirmation_id,'objectId',object_id,'objectType','delivery');

  when 'confirm-replacement' then
    if p_payload->'acknowledged' is distinct from 'true'::jsonb then
      raise exception using errcode='SR003', message='explicit confirmation required';
    end if;
    object_id := (p_payload->>'objectId')::uuid;
    select r.* into replacement from private.aunor_replacements r
      where r.id=object_id and r.original_activity_id=p_activity_id for update;
    if not found or not exists(select 1 from private.aunor_agreements g
      where g.id=replacement.agreement_id and private.can_access_aunor_activity(g.activity_id)) then
      raise exception using errcode='SR002', message='replacement unavailable';
    end if;
    if exists(select 1 from private.aunor_replacements n where n.corrects_id=object_id) then
      raise exception using errcode='SR001', message='replacement changed';
    end if;
    insert into private.aunor_confirmations(replacement_id,confirmed_by)
      values(object_id,actor.id) on conflict(replacement_id) do nothing;
    select c.id into confirmation_id from private.aunor_confirmations c where c.replacement_id=object_id;
    result := jsonb_build_object('id',confirmation_id,'objectId',object_id,'objectType','replacement');
  end case;

  insert into private.aunor_requests(actor_id,request_id,fingerprint,result)
    values(actor.id,p_request_id,fingerprint,result);
  if p_command<>'read' then
    insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
      values(p_activity_id,actor.id,case when actor.role='aunor' then 'Aunor' else actor.display_name end,
        actor.role,'Espacio Aunor: '||p_command,jsonb_build_object('result',result));
  end if;
  return result;
exception
  when invalid_text_representation or invalid_datetime_format or datetime_field_overflow
    or numeric_value_out_of_range or check_violation or not_null_violation then
    raise exception using errcode='SR003', message='invalid Aunor input';
end;
$$;
revoke all on function public.aunor_mutate_v1(text,uuid,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.aunor_mutate_v1(text,uuid,uuid,jsonb) to authenticated;
-- Safe boolean only: the caller cannot discover an unpublished/Burson activity.
grant execute on function private.can_access_aunor_activity(uuid) to authenticated;

commit;
