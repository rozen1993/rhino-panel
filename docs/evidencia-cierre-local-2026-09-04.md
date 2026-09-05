# Evidencia de cierre local de Sistema R

**Fecha:** 2026-09-04 (America/Lima)

**Punto de restauración original:** `0be6965`

**Rama actual:** `equipo`

**Estado del snapshot:** cierre local aprobado; publicación y aceptación remota
pendientes en ese momento.

> La publicación autorizada posterior quedó registrada por separado en
> [`evidencia-preview-rc1-2026-09-04.md`](evidencia-preview-rc1-2026-09-04.md).
> Este documento conserva la evidencia previa; sus pendientes no describen
> automáticamente el estado remoto actual.

## Resultado

Los Cortes 0 a 7 están implementados y verificados en el árbol local. Esto
incluye la autoridad exclusiva de Admin sobre planificación y administración,
la ejecución limitada al Operario responsable, el permiso individual y
revocable para crear actividades propias, las cuentas con clave temporal, el
canal externo Burson, la conversación privada, Papelera, el Histórico Admin
desde 2026 y las defensas de Preview/Producción.

El chat IA no se integró. Su único entregable es
`plan-chat-ia-reutilizable.pdf`: PDF 1.4 válido, 58 620 bytes y tres páginas.

## Gates ejecutados

| Gate | Resultado final |
|---|---|
| `npm run verify` | TypeScript, ESLint, 198/198 Vitest en 22 archivos y build Next.js 16.3.1 aprobados. |
| `npm run test:e2e` | 10/10 recorridos Playwright aprobados sobre el build de producción demo aislado. |
| Deno | Formato de siete archivos y tipos de ambas Edge Functions aprobados. |
| `npm run test:functions` | 20/20 pruebas aprobadas: dominio obligatorio, compensación de alta, recuperación paginada de usuarios Auth huérfanos, reset con reparación del username canónico, cambio obligatorio, igualdad/diferencia de huella y limpieza de metadata. |
| `supabase db reset --local --no-seed` | Siete migraciones compiladas desde una base PostgreSQL 17 vacía. |
| `npm run verify:supabase:local` | 51/51 controles reales de Auth/RLS/RPC; matriz oficial de 31 puntos cubierta y base limpia al terminar. |
| Rendimiento RLS, serie A | Operario masivo 5,406 ms; selectivo 2,594 ms; Admin 4,163 ms; owner sin RLS 1,989 ms sobre 11 055 jornadas. |
| Integridad | `git diff --check` sin errores. |

## Revisión independiente Claudex

Modo `execute`, pipeline `core`, perfil `o/max`; Codex fue el único escritor y
Claude Code revisó en modo de solo lectura.

La revisión prepublicación confirmó la equivalencia de visibilidad de
`202609030001_rls_visibility_performance.sql` y la ausencia de un helper
`SECURITY DEFINER` falsificable. Terminó `CHANGES_REQUIRED` por el fallback
silencioso del dominio interno, la falta de prueba del runtime real y la ausencia
de sondas remotas exactas.

El código ahora exige el dominio en frontend y Edge, repara el username de Auth
desde el perfil canónico durante un reset y fija `@supabase/server@1.4.1`. El
runbook exige catálogo efectivo, versiones, JWT, rechazo 401 y el recorrido real
de clave temporal. Después de esos cambios aprobaron 20 pruebas Deno, los 198
Vitest, 10 Playwright, el build y los 51 controles locales.

La pasada final Claudex terminó **APPROVED** para commit, push y publicación
controlada de staging/Preview. No encontró regresiones críticas ni altas. Sus
dos condiciones documentales —repetir las sondas en el checklist Go/No-Go y
corregir la codificación del bloque nuevo— quedaron aplicadas antes del commit.

## Snapshot previo a la publicación de RC1

Al registrar este cierre local, `HEAD` y `origin/equipo` permanecían en
`6d52d8f`; el Preview `Ready` documentado correspondía a ese commit y a las seis
primeras migraciones. La séptima migración, las versiones actuales de las Edge
Functions y el resto del árbol aprobado permanecían locales. La publicación de
RC1 debe conservar su propia evidencia posterior con el nuevo hash y los
estados remotos reales.

Durante este cierre local no se realizó commit, push, despliegue, cambio de
secretos ni escritura remota. Tampoco se inspeccionaron ni imprimieron valores
de `.env.local` o `supabase/.temp/project-ref`.

## Gates pendientes al registrar este snapshot

1. Autorizar y crear el commit de cierre; publicarlo en `equipo`.
2. Identificar staging, ejecutar `db push --dry-run`, aplicar únicamente la
   séptima migración y desplegar las dos Edge Functions actuales.
3. Generar el Preview de validación `RC1` del commit candidato y repetir
   catálogo, plan RLS y smoke HTTP.
4. Ejecutar el smoke autenticado con identidades temporales, incluida Burson, y
   limpiar exactamente hasta volver al baseline de seis perfiles.
5. Completar UAT por roles en escritorio, móvil real y Safari/iOS; consolidar
   el feedback y publicar `RC2…RCn` con los mismos gates hasta la aceptación.
6. Crear Producción en un proyecto Supabase separado, ensayar
   backup/restauración, configurar dominio/TLS/Auth/variables y registrar un
   Go/No-Go con rollback disponible.

Cada acción remota requiere autorización explícita según
[`runbook-preview-produccion.md`](runbook-preview-produccion.md).
