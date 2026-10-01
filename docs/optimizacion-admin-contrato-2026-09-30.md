# Carga de Admin y Contrato — 30/09/2026

## Cambios

- Panel: se evita la consulta vacía al terminar cada lectura paginada. Caso de 23 actividades con jornadas: **4 → 2 peticiones de datos**. Las páginas limitadas por el servidor se siguen recorriendo; si falta el conteo, se conserva el recorrido hasta la página vacía. También beneficia ficha, papelera y lectores compartidos.
- Contrato y proyecciones compartidas con Aunor: autorización evaluada una vez por consulta, en lugar de repetir función y búsqueda de actividad por cada fila. Se conservan sesión vigente, perfil activo, cambio obligatorio de clave, roles y exclusión de papelera.
- Admin/Operario y Contrato muestran cabecera y navegación después de autorizar al usuario, mientras los datos se cargan dentro de un límite `Suspense`. Mismo diseño final; indicador accesible y sin animación si se solicita movimiento reducido.
- No se añadieron cachés públicos de información privada, servicios de pago ni cambios de región. No se redujo la frecuencia de actualización de datos.

## Evidencia

| Medición | Antes | Después |
|---|---:|---:|
| Consulta de actividades de contrato, PostgreSQL aislado | 160,805 ms | 2,361 ms |
| Consulta de jornadas de contrato, PostgreSQL aislado | 155,275 ms | 2,014 ms |
| Consulta de actividades, lectura remota | 15,909 ms | 1,686 ms |
| Consulta de jornadas, lectura remota | 16,289 ms | 1,573 ms |

Prueba aislada: 500 actividades sintéticas, 50 enviadas a papelera, más fixtures funcionales; mediana de cinco ejecuciones por consulta. Base y contenedor UUID eliminados al finalizar, sin tocar la base local de trabajo.

Lectura remota: una muestra `EXPLAIN ANALYZE` por consulta, transacción de solo lectura y permisos de una sesión Admin vigente; 17 filas visibles antes y después. No es una medición del tiempo completo del navegador ni incluye todas las peticiones PostgREST. La comparación aislada es la referencia controlada.

## Verificación y protección

- Respaldo Git previo: `f903dec`.
- Respaldo privado de esquema/datos, SHA-256 verificado y restauración real en otra base UUID: 23 actividades, 7 perfiles, 7 cuentas Auth, 24 migraciones antes del cambio.
- Única migración aplicada: `202609300003_contract_read_performance.sql`. Solo reemplaza cuatro vistas; no modifica filas ni permisos concedidos.
- 425 pruebas unitarias del conjunto general y 3 nuevas de carga progresiva; compilación y lint correctos.
- 51 pruebas de navegador correctas, incluidas las vistas de contrato de escritorio y móvil; capturas bajo `frontend/.verificacion/performance-admin-2026-09-30-new/` (no se publican en Git).
- SQL: comparación exacta de proyecciones antes/después para Admin, Aunor y Operarios; exclusión de papelera, cuentas desactivadas, claves pendientes, sesiones revocadas/vencidas; sin acceso anónimo ni escritura directa a las vistas.
- Durante la comprobación remota hubo ediciones de trabajo concurrentes registradas en auditoría. No se revirtieron ni se sustituyeron por el respaldo. No se afirma igualdad global de hashes mientras hay usuarios trabajando.

## Límites

La mejora reduce trabajo de la base y esperas de red evitables; no elimina la latencia de conexión, autenticación o arranque de funciones. Queda por medir la experiencia completa en el navegador del usuario con su sesión y conexión. No se activaron analíticas externas ni se cambiaron planes contratados.
