# Evidencia de preparación de staging y Preview

**Fecha:** 2026-09-02 (America/Lima)

**Rama y commit desplegado:** `equipo` · `6d52d8f`

**Destino:** Supabase `sistema-r`, Oregon (`us-west-2`), y Vercel Preview de
`rhino-panel`. Producción no fue modificada.

> Este documento conserva la evidencia del último despliegue remoto. El cierre
> local posterior está en
> [`evidencia-cierre-local-2026-09-04.md`](evidencia-cierre-local-2026-09-04.md)
> y todavía no está publicado en este Preview.

## Resultado confirmado

**Actualización local del 2026-09-04:** Supabase local aplica siete migraciones,
el smoke aprueba 51 controles y las pruebas de funciones aprueban 20 casos.
Staging y el Preview continúan deliberadamente en las seis migraciones y las
versiones remotas documentadas el 2026-09-02; producción no fue tocada.

- Docker Desktop quedó operativo con PostgreSQL 17 local.
- `supabase db reset --local --no-seed` recreó la base desde cero y aplicó las
  siete migraciones versionadas, de `202608220001` a `202609030001`.
- El smoke reproducible `npm run verify:supabase:local` aprobó **51 controles**
  mediante GoTrue y PostgREST locales con JWT independientes para Admin, dos
  Operarios y Burson. Al terminar, la base local quedó limpia.
- Los controles cubrieron sesión de aplicación, RLS, planificación exclusiva
  de Admin, ejecución exclusiva del responsable, aislamiento entre Operarios,
  concesión y revocación del permiso de creación propia, idempotencia, SQLSTATE,
  canal Burson, baja/restauración desde Papelera, ciclo de conversación privada,
  claves temporales, invariantes del roster y carreras de apertura, baja,
  transferencia, restauración, actividad y cuentas. También cubre los siete
  recursos con más de `api.max_rows`, inserciones intercaladas, Histórico real,
  `EXPLAIN` y baja/restauración entre fases. La repetición final del gate local
  midió 4,163 ms para Admin, 5,406 ms para una página Operario, 2,594 ms para
  veinte actividades y 1,989 ms para owner sin RLS. Un oráculo sin `LIMIT`
  confirmó exactamente 1 005 actividades/11 055 jornadas para el responsable,
  una/once para el otro Operario, cero para Burson y el total para Admin. La
  migración local no crea un helper privilegiado con contexto falsificable.
- 20 pruebas Deno con fallos inyectados aprobaron la configuración, compensación del alta, la
  recuperación paginada de usuarios Auth huérfanos y los estados recuperables
  fail-closed de reset, cambio obligatorio y limpieza de la huella temporal de
  las dos Edge Functions.
- `npm run verify` aprobó TypeScript, ESLint, **198 pruebas Vitest en 22
  archivos** y el build optimizado de Next.js 16.3.1.
- `npm run test:e2e` aprobó **10 de 10 recorridos Playwright**, incluidos roles,
  clave temporal, planificación/ejecución, Papelera, Histórico responsive y
  cabeceras de seguridad.
- El ensayo remoto `db push --dry-run` del 2026-09-02 identificó cinco
  migraciones pendientes; después de la autorización se aplicaron en el mismo
  orden. La lista remota coincide con las primeras seis migraciones; la séptima
  permanece local y no fue enviada a staging.
- Las Edge Functions `admin-accounts` y `change-temporary-password` quedaron
  activas en su versión 1.
- `SISTEMA_R_USERNAME_DOMAIN` está configurado en Supabase. Solo se verificaron
  nombres de secretos, nunca valores.
- Supabase Auth usa como Site URL y único redirect permitido el origen estable
  del Preview. El signup público y los accesos anónimos están desactivados.
- Staging conserva seis perfiles y un Admin activo. No se crearon cuentas ni se
  cambiaron contraseñas durante este bloque.
- Las siete variables obligatorias se configuraron solo para Vercel Preview; la
  clave publicable se almacenó como secreta y no se imprimió ni persistió en
  Git.
- El Preview de la rama `equipo` quedó `Ready` y su build registró
  `Preflight de despliegue aprobado: preview → staging` antes de compilar.
- El deployment inmutable vigente es
  `dpl_2QwNo6Pgt2oev8C47zdaaChodCmf`, con URL
  `https://rhino-panel-hrx8ysyxe-marcos-projects-65572cc0.vercel.app`. La salida
  de `vercel inspect --logs` confirmó la rama `equipo`, el commit `6d52d8f`, el
  preflight y el estado `Ready`.
- El origen estable de la rama es
  `https://rhino-panel-git-equipo-marcos-projects-65572cc0.vercel.app`.
- El artefacto Ready anterior recuperable es
  `dpl_5b7Um3QjMpPMpBpkBEbfnxBpPQSy`, con URL inmutable
  `https://rhino-panel-6zqcbscc6-marcos-projects-65572cc0.vercel.app`.
- El acceso permanece protegido por Vercel. Se creó un enlace compartible
  revocable el 2026-09-02 con vigencia de 14 días; su llave no se guardó en este
  documento. El enlace compartible anterior fue revocado.
- El smoke HTTP del Preview aprobó `/`, `/acceso`, el bloqueo de rutas privadas
  y `/robots.txt`. También confirmó CSP estructural, COOP, Permissions Policy,
  Referrer Policy, HSTS, `nosniff`, antiframing, ausencia de `X-Powered-By` y
  `X-Robots-Tag: noindex, nofollow`.

## Estado de uso

El Preview privado está disponible para pruebas guiadas del equipo. Esta
disponibilidad no equivale todavía a un Go de producción ni autoriza cargar
datos definitivos.

## Controles todavía pendientes antes del Go

- Ejecutar desde el Preview el smoke autenticado con el Admin real, dos
  Operarios temporales y una cuenta Burson temporal creados por `/cuentas`:
  cambio obligatorio de clave, aislamiento entre responsables,
  concesión/revocación del permiso individual y canal externo Burson.
- Limpiar esas tres identidades temporales de Auth y perfiles de forma exacta y
  comprobar el retorno al baseline de seis perfiles.
- Probar al menos un móvil real y Safari/iOS antes del Go productivo.
- Crear y autorizar por separado la infraestructura de producción, incluidos
  backup y restauración ensayada. Preview y Producción no deben compartir base.

## Manejo de credenciales

No se registraron contraseñas, tokens, cookies, `service_role`, claves secretas
ni cuerpos de datos personales. Las credenciales consultadas durante la
automatización permanecieron únicamente en memoria del proceso. Un enlace
compartible anterior que apareció en salida técnica fue revocado antes de
entregar el enlace vigente.
