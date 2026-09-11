begin;

-- Defense against accidental physical deletion, not against a database owner
-- deliberately disabling triggers. Backups remain necessary.
create table private.record_history (
  id bigint generated always as identity primary key,
  recorded_at timestamptz not null default clock_timestamp(),
  table_name text not null,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  database_actor text not null,
  transaction_id bigint not null,
  old_record jsonb,
  new_record jsonb
);
revoke all on private.record_history from public,anon,authenticated,service_role;
revoke all on sequence private.record_history_id_seq from public,anon,authenticated,service_role;
create index record_history_table_time on private.record_history(table_name,recorded_at desc);

create function private.preserve_record_revision() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into private.record_history(table_name,operation,actor_id,database_actor,transaction_id,old_record,new_record)
  values (tg_table_schema||'.'||tg_table_name,tg_op,auth.uid(),session_user,txid_current(),
    case when tg_op<>'INSERT' then to_jsonb(old) end,
    case when tg_op<>'DELETE' then to_jsonb(new) end);
  return null;
end $$;
create function private.reject_irreversible_removal() returns trigger
language plpgsql set search_path='' as $$
begin
  raise exception using errcode='SR012', message='Real work data: physical deletion or history modification is forbidden';
end $$;
revoke all on function private.preserve_record_revision(), private.reject_irreversible_removal() from public,anon,authenticated,service_role;

do $$
declare target text;
begin
  foreach target in array array[
    'public.profiles','public.activities','public.activity_messages',
    'private.aunor_services','private.aunor_publications','private.aunor_material_revisions',
    'private.aunor_deliveries','private.aunor_agreements','private.aunor_replacements',
    'private.aunor_confirmations','private.aunor_messages','private.aunor_requests'
  ] loop
    execute format('create trigger preserve_revision after insert or update on %s for each row execute function private.preserve_record_revision()',target);
    execute format('create trigger prevent_physical_delete before delete on %s for each row execute function private.reject_irreversible_removal()',target);
    execute format('create trigger prevent_truncate before truncate on %s for each statement execute function private.reject_irreversible_removal()',target);
  end loop;
  foreach target in array array['public.audit_events','public.account_audit_events','private.record_history'] loop
    execute format('create trigger history_append_only before update or delete on %s for each row execute function private.reject_irreversible_removal()',target);
    execute format('create trigger prevent_truncate before truncate on %s for each statement execute function private.reject_irreversible_removal()',target);
  end loop;
end $$;
-- Replanning replaces journey rows in one transaction. Preserve the removed
-- versions instead of blocking that legitimate business operation.
create trigger preserve_revision after insert or update or delete on public.activity_date_spans
for each row execute function private.preserve_record_revision();
create trigger prevent_truncate before truncate on public.activity_date_spans
for each statement execute function private.reject_irreversible_removal();
commit;
