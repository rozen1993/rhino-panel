# Ejecución de la auditoría — 10 de septiembre de 2026

Referencia histórica: `AUDITORIA-INTEGRAL-2026-09-10.md`. Este documento no sustituye los hallazgos originales.

## Respaldo

- Commit anterior a las correcciones: `d3c2223`.
- Respaldo SQL privado fuera de Git: `C:/Users/MARCO/AppData/Local/SistemaR/backups/audit-20260910-d3c2223`.
- Incluye esquemas y datos de public, private, auth y supabase_migrations; contiene información sensible y no debe adjuntarse a incidencias ni subirse al repositorio.
- SHA256 schema.sql: `329E49F74D46A7383D5393B01211C97BA44574315FBF88A163C60912ECA019D4`.
- SHA256 data.sql: `3D1BC14512BC07ADE8096BF44B2C8E269347F51F8A677E4CB7B41D70167711E7`.
- Restauración SQL probada en base desechable: 7 perfiles, 7 usuarios Auth, 3 actividades y 12 migraciones. La base temporal fue eliminada; los archivos del respaldo se conservaron. Esto no equivale a recuperación integral del servicio Auth, archivos externos o configuración de proveedores.
- Repetición: desde frontend, `node scripts/verify-backup.mjs <directorio-privado>`; requiere Docker y el contenedor local existente.

## Correcciones implementadas

| Hallazgo | Cambio | Límite de la verificación |
| --- | --- | --- |
| A01 | Next 16.3.4, sharp 0.35.4, Vitest 4.1.11 y js-yaml 4.3.2 | npm audit sin vulnerabilidades al ejecutar; no garantiza ausencia de avisos futuros |
| A02 | SELECT únicamente de id y username de profiles para service_role | Permisos remotos comprobados; pendiente recorrido Auth completo con cuenta de prueba |
| A03 | Exclusión por cuenta durante escritura Auth, finalización SQL y limpieza | Pruebas de concurrencia simulada; fallos ambiguos conservan bloqueo y requieren reconciliación |
| A04 | Frontera de seguridad basada en creación de auth.sessions | SQL aislado rechaza sesión anterior no registrada y acepta nueva; pendiente prueba integrada con Auth real |
| A05 | Administrador no puede restablecer su propia contraseña mediante reset administrativo | Prueba de función; recuperación del único administrador requiere intervención técnica |
| A06 | Retirado script CJS redundante; verificador público actualizado | Lint y comprobaciones de navegador |
| A07 | Verificador SQL usa base UUID desechable; verificador antiguo queda bloqueado | Suite SQL ejecutada sin reiniciar la base local del usuario |
| A08 | Paginación por cursor hasta página vacía en Aunor | Pruebas de límite pequeño y eliminación; no es instantánea transaccional entre páginas |
| A09 | Advertencia y enlace cuando un reemplazo conserva un acuerdo corregido | Prueba UI; se conserva evidencia histórica y no se inventa una nueva regla de bloqueo |
| A10 | Recarga explícita de publicación vigente sin descartar borrador al sondear | Prueba UI de cambio de versión, preservación y aceptación explícita |

Verificaciones: 229 pruebas unitarias, 28 de funciones, 22 recorridos Playwright, typecheck, lint y verificación SQL aislada. Los recorridos de demostración no sustituyen aceptación de roles contra Auth real.

## Reconciliación de operaciones de contraseña

La tabla privada `credential_operations` no tiene vencimiento automático: una escritura Auth puede terminar después de un timeout. No borrar bloqueos por antigüedad ni reintentar restablecimientos a ciegas.

1. El operador autorizado identifica cuenta, operation_id y momento del incidente mediante consultas privadas; no registra contraseñas, tokens ni huellas en incidencias.
2. Suspende nuevas operaciones de credenciales para esa cuenta y comprueba en registros que la invocación y sus solicitudes externas finalizaron. Si no puede descartarse una escritura tardía, conserva el bloqueo y escala al proveedor.
3. Compara estado Auth, must_change_password, metadatos temporales, sesiones y auditoría. Decide si completar la finalización pendiente o iniciar un restablecimiento controlado; nunca deduce éxito solamente del código HTTP.
4. Solo tras reconciliar esos estados libera la pareja exacta profile_id/operation_id mediante `end_credential_operation_v1` con autoridad de servicio y registra la intervención. No ejecuta un DELETE masivo.
5. Comprueba inicio de sesión nuevo, cambio obligatorio cuando corresponda y rechazo de sesiones anteriores. Las herramientas administrativas externas también deben respetar este bloqueo.

La recuperación del único administrador no se automatiza con un autorrestablecimiento: requiere operador autorizado y canal privado para entregar credenciales. Este procedimiento necesita un simulacro integrado antes de declararse recuperación operativa completa.

## Despliegue del piloto

- Supabase compartido: `fzbpqgjrdreefontqmnf`; migración `202609100001` aplicada.
- admin-accounts versión 4 y change-temporary-password versión 3 activas, verify_jwt=true.
- Confirmado: permisos de columnas concedidos, anon no puede adquirir bloqueo, cero operaciones pendientes al verificar.
- No se cambiaron contraseñas ni se crearon publicaciones del equipo durante esta ejecución.
- Vercel `dpl_6XLR1oyWe33CethnpNmNzsaVQBaa` en estado Ready, alias `https://rhino-panel.vercel.app`. Comprobadas las siete tarjetas, apertura y cierre del formulario y ausencia de desbordamiento en 1440 y 390 px. Ambas funciones devolvieron 401 sin autenticación.

## Pendientes reales

- Separar entorno definitivo de producción del piloto compartido: decidir propietario, proyecto y costes antes de aprovisionar.
- Pruebas integradas Auth/Edge de cambio obligatorio, reset, revocación y recuperación con cuentas desechables; simulacro del único administrador.
- Aceptación del equipo en dispositivos reales, incluyendo Aunor. Aunor tiene servicios configurados pero ninguna publicación; hace falta contenido aprobado para probar ese circuito.
- Activar CI en el remoto y protección de rama. El workflow está preparado localmente; no afirmar ejecuciones de GitHub sin publicarlo y observarlas.
- Incorporar verificación SQL al CI, monitoreo/alertas y política de respaldos periódicos con almacenamiento protegido independiente de esta PC.
- Optimizar la carga completa y sondeo periódico de Aunor si crece el volumen; los cursores corrigen omisiones, no reducen por sí solos el volumen total.
- No considerar terminado el proyecto ni aprobada producción solamente por estas pruebas automatizadas.
