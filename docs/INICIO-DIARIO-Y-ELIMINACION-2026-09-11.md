# Inicio diario, reinicio y eliminación explícita

## Alcance autorizado

Marco confirmó el 11/09/2026 que desea eliminar completamente los datos asociados
a una cuenta desactivada y los registros de papelera. Esta excepción no permite
usar datos reales como pruebas ni ejecutar borrados sin la confirmación del Admin.
Respaldo de código previo: `c325cbb`. Los dumps privados no forman parte de Git.

## Comportamiento

- Histórico interno abre la fecha actual de Lima y muestra las actividades de
  esa fecha en la categoría elegida. Sin registros muestra «No hay actividades
  el día de hoy.»; otras fechas siguen siendo navegables. En móvil hay un acceso
  a las actividades de hoy, sin abrir un modal automáticamente.
- Se mantienen el contrato visual, las tarjetas con «Ver detalles» y el regreso
  al listado, la tipografía y los colores existentes. En proceso conserva azul
  `#2563EB`. La guía frontend-design orientó la reutilización del diseño existente.
- Reiniciar crea un ID nuevo en Programada con la planificación original. La
  ejecución anterior pasa a papelera con sus evidencias intactas. No se trasladan
  material, opiniones, conversación ni publicaciones Aunor a la nueva actividad.
  La RPC anterior `reset_activity_v1` permanece por compatibilidad; la interfaz
  actual utiliza `restart_activity_v2`.
- Crear cuentas se denomina «+ Usuarios».
- Eliminar aparece únicamente en cuentas desactivadas distintas del Admin actual.
- Vaciar papelera elimina todos sus registros y dependencias, incluidos los de
  ejecuciones reiniciadas. Ninguna de estas acciones se ejecutó con datos reales
  durante el desarrollo.

## Confirmación y protección

Ambos borrados requieren sesión activa de Admin, vista previa de actividades y
recuento de registros, contraseña real del Admin y la frase
`ELIMINAR DEFINITIVAMENTE`. La vista previa incluye trabajos relacionados fuera
de la papelera; eliminar una cuenta puede afectar trabajos que creó o gestionó.
Si cambian los datos, se exige revisar una vista previa nueva.

La contraseña solo viaja en la petición; no se registra ni almacena. La verificación
usa una sesión temporal y cierra solo esa sesión. Se permiten cinco intentos por
Admin cada quince minutos. El cliente no puede llamar al ejecutor privilegiado.

La eliminación aplica al grafo de registros de la aplicación, sus evidencias e
historial. La cuenta se elimina mediante la API oficial de Auth, con un trigger
que ejecuta el borrado de aplicación en la misma transacción. Si Auth falla, se
revierte también el borrado de los trabajos. Los DELETE y TRUNCATE ordinarios
siguen bloqueados. Los bloqueos de concurrencia tienen espera limitada a 5 s.

No se borran archivos enlazados de OneDrive, copias de respaldo externas ni logs
administrados por el proveedor. No se promete sobrescritura física del disco ni
una reducción inmediata del indicador de almacenamiento. Los archivos propios
de Supabase Storage, si existieran, pueden impedir eliminar una cuenta; el flujo
no los destruye automáticamente.

Referencias de las APIs utilizadas:
[Auth deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser),
[verificación de contraseña](https://supabase.com/docs/reference/javascript/auth-signinwithpassword),
[cierre de sesión local](https://supabase.com/docs/reference/javascript/auth-signout).

## Verificación previa a publicación

- TypeScript y ESLint sin errores.
- 238 pruebas unitarias en 30 archivos.
- 28 pruebas Playwright, incluida navegación histórico/detalle y reinicio.
- Verificador SQL completo en base UUID desechable: reinicio, permisos, vista
  previa obsoleta, borrado de papelera y conservación de la nueva actividad.
- 19 escenarios con Auth/REST y Edge reales locales: contraseña incorrecta,
  denegación a operario/anónimo, limitación de intentos, eliminación de cuenta,
  rechazo de la sesión eliminada y fallo inyectado después del borrado de
  aplicación para verificar rollback íntegro.
- Respaldo privado remoto restaurado en base UUID desechable: 8 perfiles,
  8 usuarios Auth, 6 actividades, 15 migraciones previas. Solo se retiró la base
  de restauración de prueba; el respaldo original se conserva.

Migraciones nuevas: `202609110003_restart_activity.sql` y
`202609110004_explicit_erasure.sql`. No eliminan registros al aplicarse.
Función Edge nueva: `admin-erasure`, con verificación JWT habilitada.
