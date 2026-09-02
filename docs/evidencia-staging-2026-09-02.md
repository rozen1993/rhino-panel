# Evidencia de preparación de staging y Preview

**Fecha:** 2026-09-02 (America/Lima)

**Commit base:** `a081bbd`

**Destino:** Supabase `sistema-r`, Oregon (`us-west-2`) y Vercel Preview de
`rhino-panel`. Producción no fue modificada.

## Resultado confirmado

- Docker Desktop quedó operativo con PostgreSQL 17 local.
- `supabase db reset --local --no-seed` recreó la base desde cero y aplicó las
  seis migraciones versionadas, de `202608220001` a `202608310001`.
- El smoke reproducible `npm run verify:supabase:local` aprobó **21 controles**
  mediante GoTrue y PostgREST locales con JWT independientes para Admin, dos
  Operarios y Burson.
- Los controles cubrieron sesión de aplicación, RLS, planificación exclusiva
  de Admin, ejecución exclusiva del responsable, aislamiento entre Operarios,
  concesión y revocación del permiso de creación propia, idempotencia, SQLSTATE,
  canal Burson y baja/restauración desde Papelera.
- El ensayo remoto `db push --dry-run` identificó cinco migraciones pendientes;
  después de la autorización se aplicaron en el mismo orden. La lista remota
  coincide ahora con las seis migraciones locales.
- Las Edge Functions `admin-accounts` y `change-temporary-password` quedaron
  activas en su versión 1.
- `SISTEMA_R_USERNAME_DOMAIN` está configurado en Supabase. Solo se verificaron
  nombres de secretos, nunca valores.
- Staging conserva seis perfiles y un Admin activo. No se crearon cuentas ni se
  cambiaron contraseñas durante este bloque.
- Vercel CLI quedó enlazado al proyecto existente `rhino-panel`. Las siete
  variables obligatorias se configuraron solo para **Preview**; la clave
  publicable se almacenó como secreta y no se imprimió ni persistió en Git.

## Controles todavía pendientes antes del Go

Los 21 controles locales no sustituyen el gate completo de 31 puntos. Siguen
pendientes las carreras deterministas, conversaciones completas, clave temporal,
paginación sobre más de `api.max_rows`, planes `EXPLAIN`, Histórico concurrente,
compensaciones de Auth y el smoke final sobre el Preview desplegado. También se
deben comprobar las URL de Auth, encabezados, móvil real y Safari/iOS.

## Manejo de credenciales

No se registraron project refs completos, contraseñas, tokens, cookies,
`service_role`, claves secretas ni cuerpos de datos personales en este artefacto.
Las credenciales consultadas durante la automatización permanecieron únicamente
en memoria del proceso.
