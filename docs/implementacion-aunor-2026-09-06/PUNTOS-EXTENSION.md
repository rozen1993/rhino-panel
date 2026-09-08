# Puntos concretos de extensión

Exploración de código de solo lectura; no auditoría general.

- Roles: `frontend/lib/roles.ts`, tipos Supabase en frontend y funciones Edge, validador Edge de cuentas. Las cuentas antiguas demo no se reinician ni se sobrescriben.
- Redirecciones por rol: `app/acceso/actions.ts`, `app/cambiar-clave/page.tsx`, `components/temporary-password-gate.tsx`, `app/sin-acceso/page.tsx`, `lib/supabase/proxy.ts` (proteger `/aunor`).
- Navegación: `components/nav-bar.tsx`; reemplazar exclusión Burson por autorización positiva Admin/Operario donde corresponda.
- Calendario: `components/annual-calendar.tsx` consume demo interna y muestra opiniones. Reutilizar presentación/calendario, nunca su consulta interna ni el detalle privado para Aunor. Conservar `/historico` Admin.
- Admin: sección externa dentro de `components/activity-detail.tsx`, separada de conversación interna y sin tocar su bloqueo de entrega.
- Demo: endurecer `canViewActivity`, `addThreadMessage`, `editThreadMessage`, `deleteThreadMessage` en `lib/activity-simulation.ts` con roles explícitos.
- SQL: las tres funciones de conversación privada `post_activity_message_v1`, `edit_activity_message_v1`, `delete_activity_message_v1` deben rechazar explícitamente roles distintos de Admin/Operario. Mantener autoría, versión, estado y `thread_opened_at` intactos. Advance, execution, create_own ya exigen Operario; planning/delete/restore/accountupdate exigen Admin.
- RLS: no ampliar SELECT de la tabla interna `activities` al cliente. Auditoría debe permitir explícitamente Admin/Operario. Canales externos independientes.
- Migraciones: nuevo valor enum en migración separada antes de sus usos. Una cuenta compartida requiere invariante de unicidad también al cambiar rol/reactivar.
- Pruebas: nueva DB efímera UUID; nunca `verify-local-supabase.mjs` (resetea base existente). Build/puerto/browser contexts aislados para Aunor; nunca perfil Chrome del usuario.

La primera derivación de Claude se interrumpió sin respuesta completa. Se volvió a invocar exclusivamente esa fase a las 22:36 UTC; journal `claudex-20260906T223610812Z-4e2464d1bf544da6ae672a6a9afa8a62.jsonl`. No se ha implementado antes de la comparación.
