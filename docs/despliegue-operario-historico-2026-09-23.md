# Publicación de gestión propia e Histórico — 23/09/2026

## Alcance y autorización

Marco autorizó sincronizar con Vercel los cambios locales aprobados. Código:
`115c7a11c851aa2ee66dd1956bb3529978083250`. Respaldos de código previos:
`61f7297` y `a09fb6e`.

Destinos existentes: GitHub `rozen1993/rhino-panel`, rama de producción `master`;
Vercel `rhino-panel`, raíz `frontend`; Supabase `fzbpqgjrdreefontqmnf`.
No se contrataron servicios ni se cambiaron planes o infraestructura.

## Protección de datos

Respaldo privado del día, en el destino local habitual protegido por ACL:
`%LOCALAPPDATA%/SistemaR/backups/live/20260923-075709-a1e7c7bb6faa4556b9a0c49a121e3bb1`.
Esquemas exportados: `public`, `private`, `auth`, `supabase_migrations`.
Hashes SHA-256 contrastados con `COMPLETE.json`.

Restauración completa aprobada mediante `verify-backup.mjs` en la base UUID
`sr_restore_test_d7086beeabbc49ed86ffe69fe4cc644c`: 7 perfiles, 7 usuarios Auth,
9 actividades y 19 migraciones. Se retiró únicamente esa base de comprobación;
el respaldo se conserva fuera de Git. El intento anterior de respaldo del día,
con Docker apagado, falló antes de completarse y no se usó como respaldo válido.

## Migración y comprobaciones

El dry-run mostró exclusivamente
`202609220001_operator_own_activity_trash.sql`, sin seeds ni cambios de roles.
Se aplicó después de verificar el respaldo, antes de publicar el frontend.

Catálogo remoto: `soft_delete_own_activity_v1(uuid,integer,text)` disponible
para `authenticated`, sin ejecución para `anon` ni `service_role`. Sus controles
internos mantienen la autorización del Operario, autoría, asignación, permiso,
estado Programada y versión. Admin conserva la gestión exclusiva de Papelera.

Conteos antes/después: 9 actividades, 7 perfiles y 7 usuarios Auth. Migraciones:
19 → 20. Dry-run posterior: sin pendientes. No se ejecutó la baja, reinicio,
restauración ni eliminación definitiva de ningún trabajo real para probarlo.
Las pruebas completas de mutación se hicieron antes en datos desechables.

## Evidencia de publicación

- GitHub `master` recibió `115c7a1` mediante avance normal, sin force-push.
- CI del código: [ejecución 35864214075](https://github.com/rozen1993/rhino-panel/actions/runs/35864214075), resultado `success`.
- Vercel: `dpl_79oGYpx8Xf6jYSbS8mJsvPSt2KuW`, `READY`, Production, SHA exacto `115c7a1`.
- Artefacto: `https://rhino-panel-9x1sf6owq-marcos-projects-65572cc0.vercel.app`.
- Alias público: [acceso a DA VINCI](https://rhino-panel.vercel.app/acceso), HTTP 200.
- Navegador real contra el alias: login, nueva entrada de Histórico, enlaces de
  Grabación/Edición y calendario aprobados para Admin, Operario y Aunor; ausencia
  de «Ver todo el Histórico»; sin desbordamiento a 1440 y 390 px ni errores de
  página detectados. Solo navegación, sin escrituras de negocio.
- Una primera sonda esperaba el nombre antiguo del Operario en su tarjeta;
  se corrigió la sonda al nombre público vigente y se repitió con éxito.

## Credenciales y recuperación

En esta publicación se cambió únicamente la contraseña de Admin por la
acordada con Marco, usando Auth y sin guardarla en código, documentos o archivos.
Se verificó un inicio nuevo, el rol activo y la ausencia de cambio obligatorio.
Las demás cuentas no se alteraron; se comprobó acceso de Operario y Aunor.
Se cerraron las sesiones creadas para verificación. No se cambiaron las políticas
de contraseña ni se inició una rotación general de cuentas.

Frontend anterior recuperable: `dpl_C9geyg38Pji8dk96332Nqnb8SHmY`, SHA `b150ab4`.
La migración es aditiva y compatible con él. Un rollback no debe restaurar la
base encima de trabajos posteriores ni usar reset/down; corregir hacia delante.
El respaldo precede al cambio de contraseña de Admin: una restauración de Auth
requiere revisar expresamente también las credenciales y sesiones.

Este registro se sincroniza en un commit documental posterior al código
verificado; no modifica el comportamiento de la aplicación.
