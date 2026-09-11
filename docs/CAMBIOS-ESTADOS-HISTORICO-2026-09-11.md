# Estados e Histórico — 11 de septiembre de 2026

Respaldo de código previo: `629cbdb`. Se conserva el diseño existente: estructura de navegación, tipografía, calendario 1/2/4 columnas, tarjetas y estilos de botones. La propuesta generada como imagen no se usó como reemplazo de la interfaz.

## Comportamiento

- Admin dispone de «Restablecer a Programada» en la ficha de una actividad En proceso o Entregada. Exige motivo y confirmación, comprueba permisos en servidor y base, y rechaza versiones antiguas. No permite adelantar libremente estados.
- Conserva material, opinión, comentarios, planificación, publicaciones y evidencia. El estado vuelve a Programada y la fecha activa de entrega se limpia; estado y fecha anteriores quedan en auditoría. La conversación y sus restricciones existentes no se borran ni se reinician. No se crea una actividad duplicada.
- En proceso usa violeta en insignias, bordes de tarjetas/filas y contador del panel. No se cambian los colores de categorías del calendario.
- Al seleccionar un día con varias actividades, el Histórico interno muestra una lista de tarjetas con descripción y «Ver detalles». El detalle sustituye a la lista; «Volver a las actividades del día» mantiene selección de día/año. Seleccionar otro día vuelve a su lista. Se mantiene el diálogo móvil y cierre con Escape.
- No hay opción de vaciar papelera. Las bajas siguen siendo recuperables.

## Datos reales y seguridad

Antes de migrar se exportaron los esquemas public, private, auth y supabase_migrations a una carpeta privada fuera del repositorio:
`C:/Users/MARCO/AppData/Local/SistemaR/backups/live/20260911-010548-a2d11bb4321448c3b2de684adc7184dd`.
La restauración SQL aislada recuperó 8 perfiles/usuarios, 6 actividades y 13 migraciones. Solo se eliminó la base temporal de verificación.

La migración pendiente de conservación `202609110001` se prueba junto a `202609110002` (restablecimiento): bloquea DELETE físico y TRUNCATE de registros de negocio, protege auditorías y conserva versiones privadas. El reemplazo transaccional de jornadas sigue permitido, registrando las versiones retiradas. No captura contraseñas Auth. El historial no es un respaldo externo y un propietario de base puede desactivar sus protecciones; su tamaño necesita seguimiento.

El script de respaldo se corrigió para aplicar permisos de carpeta sin solicitar privilegio de auditoría de Windows. No se ha instalado una tarea de respaldos periódicos ni contratado almacenamiento externo. Los dumps son privados y no deben subirse a GitHub. Un commit respalda código, no datos.

## Verificación

- Pruebas unitarias de conservación, restricciones y navegación lista/detalle; Server Action comprueba rol y parámetros antes de RPC.
- Verificador SQL utiliza únicamente una base UUID nueva. Prueba restablecimiento, permisos, conflicto de versión, material conservado, historial privado y rechazo de eliminación física.
- La prueba integrada Auth/REST comprueba además el restablecimiento por HTTP, conservación de confirmaciones Aunor como evidencia histórica y nueva ejecución por el operario. Ninguna cuenta del equipo se utiliza para estas pruebas.
- Las pruebas de navegador utilizan datos de demostración locales, no registros reales. Incluyen restablecimiento conservador, Histórico en escritorio/móvil y navegación de regreso.

No se ejecuta un restablecimiento real como prueba de despliegue. El primer uso real debe responder a una decisión de Admin sobre una actividad concreta.

Resultado local: 232 pruebas unitarias, 28 de funciones, 23 de navegador y 17 escenarios integrados Auth/REST aprobados; typecheck, lint, compilación y SQL aislado aprobados. Las migraciones `202609110001` y `202609110002` se aplicaron después de verificar la restauración del respaldo. La aplicación de las migraciones no restableció ni eliminó actividades existentes.
