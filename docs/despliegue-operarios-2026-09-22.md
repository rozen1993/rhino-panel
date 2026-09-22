# Publicación de permisos, modalidades e Histórico — 22/09/2026

## Alcance y destinos

Continuación autorizada por Marco de los tres cambios documentados en
`operarios-grabacion-historico-2026-09-21.md`. Implementación: `84ff307`.
Respaldo de código previo: `dd770d4`.

- Supabase existente: `fzbpqgjrdreefontqmnf`, con datos reales.
- GitHub: `rozen1993/rhino-panel`, producción en `master`.
- Vercel existente: `https://rhino-panel.vercel.app`.
- Producción anterior comprobada: `72b37eed31e4cefa24e1f289d160c5c62dc3032d`,
  despliegue GitHub `6473128328`.

No se modifican planes, infraestructura, contraseñas ni destinos de respaldo.
No se crean, reinician ni eliminan trabajos reales para verificar los cambios.

## Respaldo privado verificado

Destino local habitual, excluido de Git y protegido por ACL:
`%LOCALAPPDATA%/SistemaR/backups/live/20260922-003649-43a7201f140f4f48b648c92d5cf38c52`.

- Esquemas: `public`, `private`, `auth`, `supabase_migrations`.
- `schema.sql`: 237677 bytes; `data.sql`: 295932 bytes.
- Integridad SHA-256 contrastada con `COMPLETE.json`.
- Restauración completa aprobada en base UUID desechable: 7 perfiles,
  7 usuarios Auth, 8 actividades y 18 migraciones.
- Segunda restauración aislada: migración nueva aplicada correctamente,
  comparando conteos y huellas de todas las filas de 50 tablas antes y después.
  Los datos existentes permanecen iguales; solo se excluye de la comparación
  la nueva columna `recording_modes`.
- Ambas bases de comprobación se retiraron; los archivos privados se conservan.

Control remoto previo de solo lectura: 8 actividades (4 fuera de papelera),
7 perfiles, 7 usuarios Auth, 18 migraciones.

## Verificación previa

La suite inicial específica pasó 314 pruebas unitarias, 11 recorridos de
navegador y las pruebas PostgreSQL/RLS de autorización, concurrencia y
conservación de datos. Tipos, lint y build correctos.

La ampliación a todos los recorridos detectó un fixture antiguo que intentaba
crear una Grabación sin modalidad. Se actualizó para seleccionar Video, sin
relajar la validación del producto. Las 28 pruebas de funciones de cuentas y
contraseñas pasaron; auditoría de dependencias de producción: 0 vulnerabilidades.
La repetición completa de navegador terminó con 33 de 33 pruebas aprobadas,
incluidos Admin, Operario, Aunor, Histórico, móvil y cabeceras de seguridad.

## Publicación y recuperación

`db push --linked --dry-run` mostró exclusivamente
`202609210001_operator_planning_recording_history.sql`, sin seeds ni roles.
El envío a GitHub se comprobó previamente con `git push --dry-run`.

Tras pasar el conjunto de pruebas, aplicar esa migración transaccional y
publicar inmediatamente el frontend compatible. Los clientes antiguos deben
recargar antes de guardar planificación porque se retiran las RPC antiguas;
la ejecución y entrega no cambian. Verificar migración, permisos, conteos,
CI y despliegue correspondientes al SHA exacto enviado.

Un fallo se corrige hacia delante: no borrar columnas ni restaurar encima de
la base real automáticamente. Un commit de código anterior no basta para
revertir las nuevas reglas de RPC. El respaldo no sustituye los trabajos
posteriores que el equipo pueda registrar.

## Migración remota aplicada

Aplicada exclusivamente `202609210001_operator_planning_recording_history.sql`,
después del respaldo y las pruebas. Control remoto posterior de solo lectura:
19 migraciones, 7 perfiles, 7 usuarios Auth y 8 actividades (4 fuera de papelera),
sin cambios en los conteos. Ninguna grabación existente fue reclasificada.

Permisos comprobados en el catálogo remoto: RPC v3 disponibles para usuarios
autenticados y denegadas a anónimos; RPC anteriores de planificación y reinicio
interno sin acceso directo. Histórico compartido con SELECT autenticado,
sin SELECT anónimo. La vista de Aunor sigue sin columnas de responsable, autor
ni opinión del operario. La publicación del frontend se realiza a continuación
mediante la integración existente de GitHub y se verifica por SHA exacto.
