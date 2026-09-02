# Auditoría final local de los Cortes 0 a 7

**Fecha:** 2026-09-01 (America/Lima)

**Checkpoint de restauración:** `0be6965`

**Alcance:** árbol de trabajo local, sin commit, push ni despliegue

**Resultado Claudex:** `APTO_PARA_CIERRE_LOCAL`

**Estado de liberación:** **No-Go remoto** hasta completar los gates externos

Esta matriz contrasta el contrato vigente con la implementación y las pruebas
observables. «Apto local» significa que el código, los artefactos y los gates
que pueden ejecutarse sin credenciales ni efectos remotos están aprobados. No
significa que las migraciones hayan compilado en PostgreSQL ni que staging o
Vercel Preview estén certificados.

## Matriz de cumplimiento local

| Corte | Contrato comprobado | Evidencia principal | Estado local |
|---|---|---|---|
| 0 — consolidación | Una sola fuente vigente, históricos marcados como sustituidos y decisiones sin contradicciones operativas. | [Contrato vigente](contrato-producto-vigente-2026-08-28.md), [estado](estado.md), [decisiones](decisiones.md) y `frontend/__tests__/current-contract.test.ts`. | Aprobado |
| 1 — autoridad | Admin crea, planifica, asigna, modifica, reasigna y cambia la baja; el responsable controla únicamente estado, enlace y opinión. `can_create_own_activities` es individual, revocable y `false` por defecto; la creación autorizada se fuerza al actor. No existe una pestaña permanente para Operario. | `supabase/migrations/202608280001_activity_authority.sql`, `frontend/app/actividades/actions.ts`, `frontend/app/actividades/nueva/page.tsx`, `frontend/components/nav-bar.tsx`, `frontend/__tests__/activity-authority.test.ts` y `frontend/__tests__/server-actions-authority.test.ts`. | Implementado y probado localmente |
| 2 — cuentas y Auth | Solo Admin administra cuentas y permisos. El alta genera una clave temporal; `must_change_password` bloquea el negocio hasta reemplazarla. No hay signup público, no se desactiva el último Admin y las operaciones privilegiadas permanecen en Edge Functions. | `supabase/migrations/202608290001_account_administration.sql`, `supabase/functions/admin-accounts/`, `supabase/functions/change-temporary-password/`, `frontend/app/cuentas/`, `frontend/app/cambiar-clave/` y `frontend/__tests__/account-administration.test.ts`. | Implementado; Edge Functions pasan formato y tipos |
| 3 — Burson | Burson crea y consulta solo sus propios encargos, sin superficies internas; el sistema asigna al único Operario especial activo y conserva idempotencia/transferencia según el contrato. | `supabase/migrations/202608300001_burson_channel.sql`, `frontend/app/burson/`, `frontend/lib/burson.ts`, `frontend/__tests__/burson-channel.test.ts` y recorrido E2E Burson. | Implementado y probado localmente |
| 4 — conversación | Solo Admin abre la conversación después de la entrega; Admin y responsable vigente participan. Cada autor modifica o da de baja solo sus mensajes; la baja no filtra el cuerpo a auditoría ni al cliente. | `supabase/migrations/202608300002_private_conversations.sql`, `frontend/components/activity-detail.tsx`, `frontend/lib/supabase/activities.ts` y `frontend/__tests__/private-conversations.test.ts`. | Implementado y probado localmente |
| 5 — baja y restauración | No hay borrado físico. Admin registra motivo, usa Papelera exclusiva y restaura sin perder planificación, ejecución, jornadas, hilo ni auditoría; una actividad abierta exige responsable activo al restaurarse. | `supabase/migrations/202608310001_activity_trash.sql`, `frontend/app/papelera/`, `frontend/components/trash-dashboard.tsx`, `frontend/__tests__/activity-trash-actions.test.ts` y `frontend/__tests__/trash-dashboard.test.tsx`. | Implementado y probado localmente |
| 6 — Histórico | Solo Admin navega desde `2026-01-01`, por año, con rangos y jornadas discontinuas; Papelera queda excluida. Las lecturas Supabase usan sesión/RLS, keyset y loteo, sin fixtures de respaldo. | `frontend/app/historico/page.tsx`, `frontend/lib/supabase/historical.ts`, `frontend/components/annual-calendar.tsx`, `frontend/__tests__/historical-supabase.test.ts`, `frontend/__tests__/historical-route.test.tsx` y `frontend/__tests__/supabase-pagination.test.ts`. | Implementado y probado localmente |
| 7 — Preview y producción | El build remoto falla cerrado si el ambiente no coincide, rechaza `demo` y claves inapropiadas, añade cabeceras defensivas y bloquea indexación. Preview y Production se mantienen separados y todo efecto remoto exige autorización. | `frontend/scripts/check-deployment-readiness.mjs`, `frontend/vercel.json`, `frontend/next.config.ts`, `frontend/app/robots.ts`, `frontend/__tests__/deployment-readiness.test.ts`, `frontend/e2e/security-headers.spec.ts` y [runbook](runbook-preview-produccion.md). | Preparación local aprobada; no desplegado |
| Entregable separado — chat IA | No se integró chat en Sistema R. Solo se entregó el plan reutilizable, exclusivo de Admin en su primera versión y con OpenRouter del lado servidor. | [PDF](plan-chat-ia-reutilizable.pdf) y fuente reproducible `plan-chat-ia-reutilizable.html`; `npm run render:chat-plan`. PDF 1.4, 58 620 bytes y 3 páginas. | Aprobado |

## Evidencia final reproducible

| Gate | Resultado observado |
|---|---|
| `npm run verify` | TypeScript, ESLint, 191/191 pruebas Vitest en 21 archivos y build Next.js 16.3.1 aprobados. |
| `npm run test:e2e` | 10/10 recorridos Playwright aprobados sobre build de producción demo aislado. |
| Deno | `deno fmt --check` aprobó 5 archivos y `deno check` aprobó las dos Edge Functions. |
| Preview sintético | `npm run build:vercel` aprobó `preview → staging` y completó el build con variables sintéticas no secretas. |
| Fail-closed | `npm run preflight:deploy` sin variables terminó con código 1 y 11 diagnósticos genéricos, sin imprimir valores. |
| PDF | Cabecera `%PDF-`, 3 objetos de página y 58 620 bytes. |
| Integridad del diff | `git diff --check` terminó con código 0; solo informó normalización futura LF/CRLF. |

Las pruebas de paginación simulan un `api.max_rows` menor que el solicitado,
fuerzan más de cien identificadores, cubren Papelera y actor de baja, verifican
orden descendente de auditoría y distinguen hidratación `summary` de
`complete`. Los lectores de actividades, Burson, perfiles, cuentas,
conversaciones e Histórico no conservan paginación por offset.

## Revisión independiente Claudex

La ejecución usó modo `execute`, pipeline `core` y perfil `o/max`. Codex fue el
único escritor y Claude Code revisó en solo lectura.

La primera revisión final detectó una lectura sin paginar de jornadas/auditoría
(alta), paginación por offset mutable en actividades/Burson (media) y lecturas
sin paginar de perfiles/auditoría de cuentas (media). Se centralizó el keyset y
el loteo, se reconstruyó el orden visible en memoria y se añadieron pruebas
conductuales bajo truncamiento simulado. Una revisión limpia posterior confirmó
el cierre de esos tres defectos. Después se evitó hidratar auditoría e hilo en
listados, reservando el detalle completo para la ficha. El veredicto final fue
`APTO_PARA_CIERRE_LOCAL`, sin defectos críticos, altos ni medios pendientes.
Sus observaciones bajas válidas sobre estado de hidratación, orden de auditoría
y precisión documental también quedaron corregidas y reverificadas localmente.

Registro Claudex:

```text
Modo: execute
Pipeline: core
Tarea: cierre local verificable de los Cortes 0 a 7
Motivo de activación: permisos, Auth, RLS, migraciones y arquitectura transversal
Coincidencias: contrato de roles, autoridad separada, fail-closed y gates externos
Discrepancias: truncamiento/paginación y coste de hidratación, resueltos con código y pruebas
Evidencia: 191 Vitest, 10 E2E, builds, Deno, preflight, PDF y revisión limpia
Resultado o decisión final: APTO_PARA_CIERRE_LOCAL; No-Go remoto
Quién decidió: Codex integra la evidencia; Marco conserva la autorización de ambientes
Próximo paso: ejecutar los gates externos con autorización y herramientas disponibles
```

## Gates externos no ejecutados

| Gate obligatorio | Estado y bloqueo actual |
|---|---|
| Recrear la base desde cero y compilar las seis migraciones | No ejecutado. Esta máquina no dispone de Docker, `psql` ni Supabase CLI; no se instalaron herramientas ni se usaron secretos. |
| Matriz de 31 puntos RLS/RPC/SQLSTATE, concurrencia, replay, `api.max_rows` real y `EXPLAIN` | No ejecutada contra PostgreSQL. La matriz completa permanece en [Supabase](../supabase/README.md). Las pruebas simuladas no la sustituyen. |
| Aplicar migraciones y desplegar Edge Functions en staging | No autorizado y no ejecutado; produciría escrituras remotas. |
| Desplegar Vercel Preview y ejecutar smoke con identidades reales | No autorizado y no ejecutado. Solo se aprobó un ambiente sintético local. |
| Safari/iOS y dispositivos reales | Pendiente de ambiente Preview accesible y dispositivo/navegador real. |
| Producción separada, backup/restauración, dominio/TLS, variables y Go | Pendiente de proyecto, credenciales, autorización y ventana operativa. |

No se leyó ni imprimió `frontend/.env.local` ni
`supabase/.temp/project-ref`. Tampoco se realizó commit, push, gasto, operación
destructiva, cambio de secretos o escritura remota.

## Conclusión

La implementación local de los Cortes 0 a 7 es apta para cierre y entrega a un
operador de staging. La plataforma completa aún no puede declararse lista para
producción: conserva un **No-Go remoto** hasta que PostgreSQL compile desde
cero, pasen los 31 gates con identidades reales, exista Preview verificable y
Marco autorice explícitamente cada operación externa.
