# Actualización de staging — 9 de septiembre de 2026

## Resultado

- Código publicado: `0a1f76e522824d1409c1e422f76b4d896902cdf9`, rama `equipo`, sincronizada con GitHub.
- Preview READY: https://rhino-panel-git-equipo-marcos-projects-65572cc0.vercel.app
- Deployment: `dpl_66xyy6MnazgmvSniq81cfrwP6EiE`, fuente GitHub/equipo, target null (Preview).
- Producción y rama master no modificadas. Goal y protocolo no modificados.

## Respaldo previo

Dump privado fuera del repositorio, con acceso restringido al usuario de Windows:
`C:\Users\MARCO\AppData\Local\SistemaR\backups\staging-20260909-5163091e2a854406989150307aae6a0a`.

- schema.sql: 98 235 bytes. SHA256 `C953B5DD38730F759B8D69DB899C15FA17665FBF23C2A40D11A048F70B3980BB`.
- data.sql: 120 989 bytes. SHA256 `1778D03B9F983402187842FA93A739AC29DDB64772D54A97E0A00BE25D122629`.
- Esquema public/private; datos public/private/auth/supabase_migrations. Contiene información sensible: no subir a GitHub.
- Se comprobó finalización y contenido estructural del dump, NO una restauración completa. No sustituye la prueba de recuperación pendiente.

## Base y servicio de staging

Proyecto Supabase `fzbpqgjrdreefontqmnf`.
Aplicadas, tras dry-run, las migraciones 202609050001, 202609060001, 202609060002 y 202609080001. Once migraciones locales/remotas coinciden.
`admin-accounts` desplegada ACTIVE versión 3, verificación JWT habilitada. Servicio de cambio de contraseña sin cambios.

Comparación agregada antes/después con baseline.sql:

| Comprobación | Resultado |
| --- | --- |
| Cuentas Auth / perfiles | 6 / 6, sin cambio |
| Admins activos | 1, sin cambio |
| Actividades / auditorías | 3 / 3, sin cambio |
| Hash de actividades | 8817b6646d9f52b55cd7fe0af4d3248c, sin cambio |
| Hash de jornadas, excluyendo campo nuevo place | 10ca50ac70b09164cded2e04ecffea97, sin cambio |
| Hash de perfiles, excluyendo vínculo Burson y updated_at | 4f1c5f6991cd553cf101bfafabef08eb, sin cambio |
| Operarios vinculados a Burson | 1 → 0, cambio previsto |
| Cuentas Burson activas | 0 antes y después |

No se crearon cuentas ni se cambiaron contraseñas existentes durante esta publicación.

## Despliegue y comprobaciones HTTP

El intento CLI local `dpl_9asDwWWACfWfgZuxMDdbJm6Mci6j` falló correctamente en preflight porque no recibió VERCEL_BRANCH_URL y no coincidía la dirección canónica. No se relajó la validación ni se cambiaron variables para saltarla.

La creación desde la fuente GitHub real, usando deployment-request.json, pasó preflight `preview → staging`, compilación y TypeScript. La API omite target para Preview; no acepta el literal preview en este endpoint. Referencia: https://vercel.com/docs/rest-api/deployments/create-a-new-deployment

Comprobaciones con acceso autorizado de la CLI a la protección de Vercel, sin sesión de la aplicación:

- `/acceso`: HTTP 200.
- `/aunor/contrato`: HTTP 307 hacia `/acceso`.
- `/burson`: HTTP 307 sin sesión. Esto confirma el control de sesión, no acredita por sí solo el 404 de la ruta retirada para un usuario autenticado.
- No se deshabilitó la protección del Preview ni se tocaron cookies del navegador del usuario.

Dos muestras remotas de TTFB de acceso: 1,056 s y 0,920 s. Incluyen red y protección; no equivalen a mediciones de interacción ni prueban que desapareció todo el lag. Véase la comparación local en ../retirada-burson-chat-2026-09-08/RENDIMIENTO.md.

## Pruebas previas y pendientes

Antes de publicar: 222 pruebas unitarias, 24 de Edge Functions, 15 de navegador y verificación SQL aislada aprobadas, además de lint, TypeScript y build. Evidencias en ../retirada-burson-chat-2026-09-08/.

Pendiente: recorrido completo en este Preview con autenticación real de cada rol y verificación de confirmaciones/aislamiento en remoto. Las pruebas locales no sustituyen esa comprobación. Pendiente también prueba completa de restauración y aprobación previa a producción. Se conservan los demás pendientes técnicos documentados; esta publicación no declara terminado el goal ni habilita producción.
