# Evidencia de preparación de staging y Preview

**Fecha:** 2026-09-02 (America/Lima)

**Rama y commit funcional:** `equipo` · `89907b1`

**Destino:** Supabase `sistema-r`, Oregon (`us-west-2`), y Vercel Preview de
`rhino-panel`. Producción no fue modificada.

## Resultado confirmado

- Docker Desktop quedó operativo con PostgreSQL 17 local.
- `supabase db reset --local --no-seed` recreó la base desde cero y aplicó las
  seis migraciones versionadas, de `202608220001` a `202608310001`.
- El smoke reproducible `npm run verify:supabase:local` aprobó **21 controles**
  mediante GoTrue y PostgREST locales con JWT independientes para Admin, dos
  Operarios y Burson. Al terminar, la base local quedó limpia.
- Los controles cubrieron sesión de aplicación, RLS, planificación exclusiva
  de Admin, ejecución exclusiva del responsable, aislamiento entre Operarios,
  concesión y revocación del permiso de creación propia, idempotencia, SQLSTATE,
  canal Burson y baja/restauración desde Papelera.
- `npm run verify` aprobó TypeScript, ESLint, **191 pruebas Vitest en 21
  archivos** y el build optimizado de Next.js 16.3.1.
- `npm run test:e2e` aprobó **10 de 10 recorridos Playwright**, incluidos roles,
  clave temporal, planificación/ejecución, Papelera, Histórico responsive y
  cabeceras de seguridad.
- El ensayo remoto `db push --dry-run` identificó cinco migraciones pendientes;
  después de la autorización se aplicaron en el mismo orden. La lista remota
  coincide ahora con las seis migraciones locales.
- Las Edge Functions `admin-accounts` y `change-temporary-password` quedaron
  activas en su versión 1.
- `SISTEMA_R_USERNAME_DOMAIN` está configurado en Supabase. Solo se verificaron
  nombres de secretos, nunca valores.
- Staging conserva seis perfiles y un Admin activo. No se crearon cuentas ni se
  cambiaron contraseñas durante este bloque.
- Las siete variables obligatorias se configuraron solo para Vercel Preview; la
  clave publicable se almacenó como secreta y no se imprimió ni persistió en
  Git.
- El Preview de la rama `equipo` quedó `Ready` y su build registró
  `Preflight de despliegue aprobado: preview → staging` antes de compilar.
- El origen estable de la rama es
  `https://rhino-panel-git-equipo-marcos-projects-65572cc0.vercel.app`.
- El acceso permanece protegido por Vercel. Se creó un enlace compartible
  revocable con vigencia de 14 días; su llave no se guardó en este documento.
- El smoke HTTP del Preview aprobó `/`, `/acceso`, el bloqueo de rutas privadas
  y `/robots.txt`. También confirmó CSP estructural, COOP, Permissions Policy,
  Referrer Policy, HSTS, `nosniff`, antiframing, ausencia de `X-Powered-By` y
  `X-Robots-Tag: noindex, nofollow`.

## Estado de uso

El Preview privado está disponible para pruebas guiadas del equipo. Esta
disponibilidad no equivale todavía a un Go de producción ni autoriza cargar
datos definitivos.

## Controles todavía pendientes antes del Go

- Ejecutar desde el Preview el smoke autenticado con el Admin real y dos
  Operarios temporales creados por `/cuentas`: cambio obligatorio de clave,
  aislamiento entre responsables y concesión/revocación del permiso individual.
- Limpiar esas identidades temporales de forma exacta y comprobar el retorno al
  baseline de seis perfiles.
- Confirmar en Supabase Auth el Site URL y los redirect URLs exactos del Preview,
  además de que el signup público permanezca desactivado.
- Completar el gate remoto de 31 puntos: carreras deterministas, conversaciones,
  paginación por encima de `api.max_rows`, planes `EXPLAIN`, Histórico
  concurrente y compensaciones de Auth.
- Probar al menos un móvil real y Safari/iOS antes del Go productivo.
- Crear y autorizar por separado la infraestructura de producción, incluidos
  backup y restauración ensayada. Preview y Producción no deben compartir base.

## Manejo de credenciales

No se registraron contraseñas, tokens, cookies, `service_role`, claves secretas
ni cuerpos de datos personales. Las credenciales consultadas durante la
automatización permanecieron únicamente en memoria del proceso. Un enlace
compartible anterior que apareció en salida técnica fue revocado antes de
entregar el enlace vigente.
