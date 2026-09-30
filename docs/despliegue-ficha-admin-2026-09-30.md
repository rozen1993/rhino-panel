# Publicación de la ficha Admin compacta — 30/09/2026

Marco autorizó sincronizar la opción 01 con Vercel. Destinos existentes:
GitHub `rozen1993/rhino-panel`, rama `master`; Vercel `rhino-panel`, raíz
`frontend`; Supabase `fzbpqgjrdreefontqmnf`. Respaldo de código: `986674f`.

## Respaldo privado verificado

Destino local habitual, protegido por ACL y fuera de Git:
`%LOCALAPPDATA%/SistemaR/backups/live/20260930-093603-31634d386d8d48f4a10c921552e015bb`.

Exportación de `public`, `private`, `auth` y `supabase_migrations`, hashes SHA-256
contrastados con `COMPLETE.json`. Restauración completa aprobada en
`sr_restore_test_6fcb8443d2c24953a7f33e6bae2a9b64`: 7 perfiles, 7 usuarios Auth,
23 actividades y 22 migraciones. Solo se retiró la base UUID de comprobación;
el respaldo privado se conserva.

## Migración

Dry-run: exclusivamente `202609300001_admin_compact_management.sql`, sin seeds
ni cambios de roles. Aplicada antes de publicar frontend. Añade una operación
atómica que compone los flujos existentes de relación contractual y reemplazo;
no modifica registros de negocio durante la migración.

Verificación posterior: 23 actividades, 7 perfiles y 7 usuarios Auth, sin cambios;
22 → 23 migraciones. Digest agregado de las filas de actividades idéntico antes
y después: `4643507e95db1b2546fab6b832e18b02`. RPC disponible para `authenticated`,
sin ejecución para `anon` ni `service_role`; el control interno exige Admin activo.
Dry-run posterior sin migraciones pendientes.

## Pruebas previas

- 381 pruebas unitarias, TypeScript y ESLint aprobados.
- 46 pruebas de navegador y build de producción en modo demo aislado aprobados.
- SQL probado en bases UUID desechables: permisos, concurrencia por versiones,
  reintentos sin duplicación y rollback del conjunto ante una falla parcial.
- Capturas sintéticas: `docs/implementacion-ficha-admin-2026-09-30/`.

La publicación del frontend y su comprobación contra el alias público están
pendientes al crear este registro. No se ejecutarán guardados ni reemplazos
reales para probar la interfaz en producción.

## Recuperación

Frontend anterior: SHA `a47f2ceaeeb92862429b73ab915980e10431f8d8`, Vercel
`dpl_HniiL9w7ExQ7igmLS5eUZ6m2tnuN`. La migración es aditiva y compatible con él.
Un rollback de frontend no debe restaurar la base encima de trabajos posteriores
ni ejecutar reset/down. No se modificaron contraseñas, planes ni infraestructura.
