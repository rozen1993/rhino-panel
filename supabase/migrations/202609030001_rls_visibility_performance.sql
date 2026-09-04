begin;

-- La policy vigente de activities llama helpers SECURITY DEFINER por cada fila.
-- Las subconsultas escalares fuerzan InitPlans de sesion, rol e identidad una
-- sola vez por sentencia, mientras las comparaciones permanecen sobre las
-- columnas de la fila y conservan el orden de private.can_view_activity.
drop policy activities_select_authorized
  on public.activities;

create policy activities_select_authorized
on public.activities
for select
to authenticated
using (
  (select private.has_active_app_session())
  and case (select private.current_app_role())
    when 'admin'::public.app_role then true
    when 'operario'::public.app_role then
      deleted_at is null
      and responsible_id = (select auth.uid())
    when 'burson'::public.app_role then
      deleted_at is null
      and origin = 'burson'::public.activity_origin
      and created_by = (select auth.uid())
    else false
  end
);

-- Reutiliza la visibilidad efectiva de activities en vez de evaluar un lookup
-- SECURITY DEFINER por cada jornada. El subquery no correlacionado se ejecuta
-- con los privilegios de authenticated, por lo que aplica la policy vigente de
-- activities y nunca acepta identidad, rol o sesion declarados por el caller.
-- El fast-path Admin conserva la lectura de jornadas de Papelera sin recorrer
-- activities para cada fila.
drop policy activity_date_spans_select_authorized
  on public.activity_date_spans;

create policy activity_date_spans_select_authorized
on public.activity_date_spans
for select
to authenticated
using (
  (select private.has_active_app_session())
  and case (select private.current_app_role())
    when 'admin'::public.app_role then true
    else activity_id in (
      select visible_activity.id
      from public.activities visible_activity
    )
  end
);

-- Una reversion se publica siempre como una migracion posterior: restaura
-- activities_select_authorized con private.can_view_activity(...) y la policy
-- de jornadas con private.can_view_activity_id(activity_id). Las seis
-- migraciones remotas ya aplicadas nunca se reescriben.

commit;
