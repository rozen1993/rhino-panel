# Estado

**Actualizado:** 2026-08-22

## Fase activa

El frontend conserva el modelo de tres roles y ahora tiene dos fuentes de datos
explícitas. `demo` mantiene la simulación aprobada; `supabase` activa el cimiento
real sin mezclar datos locales.

El primer corte Supabase implementa autenticación, perfil, sesión máxima de 12
horas, RLS, listado de actividades y el recorrido de una actividad ordinaria:
crear, editar, iniciar y entregar. Las jornadas discontinuas, el enlace HTTPS y
la auditoría persisten en PostgreSQL.

## Seguridad del corte

- Ninguna contraseña se guarda en tablas propias ni en el navegador.
- No hay signup público.
- Las cookies reales son HttpOnly y terminan al cerrar el navegador.
- Un perfil inactivo o una sesión revocada no supera RLS.
- Las escrituras directas están retiradas; las RPC derivan el actor del JWT.
- Hay control optimista, idempotencia con huella y auditoría atómica.
- Burson no puede leer la auditoría interna.

## Alcance pendiente

Administración real de cuentas, canal Burson, conversaciones, Histórico real,
carga inicial de 2026 y roster recordado por dispositivo se implementarán en
cortes posteriores. En modo Supabase sus pantallas no muestran fixtures.

## Staging

La configuración y migración están versionadas, pero aún no se aplicaron al
proyecto remoto ni se desplegaron en Vercel. El procedimiento y la prueba de
aceptación están en `../supabase/README.md`.

## Validación local

- TypeScript, ESLint, 33 pruebas Vitest y build de producción: aprobados.
- Build con variables equivalentes a Vercel Preview + Supabase: aprobado.
- Parser real de PostgreSQL sobre la migración: aprobado.
- Playwright demo: 3 recorridos aprobados.
- Ejecución de migración y matriz RLS real: pendiente del enlace a staging.

## Referencias

- `decision-backend-supabase-2026-08-22.md`
- `handoff-frontend.md`
- `../supabase/migrations/202608220001_backend_foundation.sql`
- `../diseno/direccion-final-traducida/CONTRATO-VISUAL.md`
