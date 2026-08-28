# Estado

**Actualizado:** 2026-08-23

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

La migración `202608220001_backend_foundation.sql` se aplicó al proyecto remoto
`sistema-r` y el historial local/remoto coincide. El registro público está
cerrado. Auth y `public.profiles` contienen un Admin y cinco Operarios activos;
Eduardo es el único Operario especial. El frontend local ya tiene valores
públicos de staging en un `.env.local` ignorado por Git y compiló correctamente
en modo Supabase. El acceso real de Admin y la navegación protegida fueron
aprobados manualmente. La cuenta Burson, el recorrido completo de un Operario,
la matriz RLS y el Preview de Vercel siguen pendientes.

## Validación local

- TypeScript, ESLint, 33 pruebas Vitest y build de producción: aprobados.
- Build con variables equivalentes a Vercel Preview + Supabase: aprobado.
- Build con el `.env.local` real de staging: aprobado.
- Login real de Admin y navegación autenticada: aprobados manualmente.
- Parser real de PostgreSQL sobre la migración: aprobado.
- Playwright demo: 3 recorridos aprobados.
- Ejecución remota de la migración: aprobada.
- Matriz RLS y recorrido real desde el frontend: pendientes.

## Referencias

- `decision-backend-supabase-2026-08-22.md`
- `bitacora-aprendizaje-backend-supabase.md`
- `handoff-frontend.md`
- `../supabase/migrations/202608220001_backend_foundation.sql`
- `../diseno/direccion-final-traducida/CONTRATO-VISUAL.md`
