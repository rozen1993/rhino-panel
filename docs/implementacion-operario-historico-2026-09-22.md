# Operario e Histórico — implementación local

Rama: `feat/cambios-locales-2026-09-22`.
Respaldos previos: `61f7297` (código) y `a09fb6e` (propuestas aprobadas).
No hay push, despliegue, migración remota ni cambio de contraseña de Admin.

## Qué cambia

- Modalidades de Grabación: opciones equivalentes con icono, casilla y selección
  cian suave. Se conserva la selección múltiple obligatoria, sin preselecciones.
- Las modalidades se muestran en la cabecera de la ficha, no entre sus acciones.
- Gestión propia: Editar y Eliminar centrados, mismo tamaño y peso visual.
  Eliminar pide motivo y confirmación antes de enviar a Papelera. En móvil se
  identifica la actividad antes de mostrar sus controles.
- Histórico: propuesta D, dos franjas panorámicas para Grabación y Edición;
  sin VS ni enlace «Ver todo el Histórico». La entrada es compartida por Admin,
  Operario y Aunor; el calendario y las reglas de privacidad no se modifican.

Las URLs históricas antiguas con `tipo=todos` o solo `anio` conservan su
compatibilidad, sin una entrada nueva en la interfaz. No se han eliminado datos
de Creatividad, Locución ni otras categorías.

## Reglas de eliminación propia

El Operario debe estar activo, con contraseña habilitada y permiso de creación
vigente. La actividad debe estar Programada, haber sido creada por esa cuenta
como Operario, seguir asignada a ella y no encontrarse ya en Papelera.
El servidor obtiene la identidad de la sesión; no confía en un actor enviado
por el navegador. Verifica la versión y vuelve a comprobar los permisos bajo
bloqueos para evitar carreras con revocaciones, reasignaciones o inicio.

Solo se actualizan los metadatos de baja, versión y fecha, y se añade un evento
de auditoría con motivo y autor. Se conservan jornadas, material, opinión,
modalidades, conversación e historial. Después de confirmar se vuelve a
Actividades; no a la Papelera. Admin conserva exclusivamente su gestión y
restauración. El vaciado definitivo existente no se ha modificado ni ejecutado.

## Verificación local

- TypeScript y lint.
- Pruebas unitarias de autoridad, Server Actions, interfaz, modalidades y datos.
- Navegador Chromium aislado con datos ficticios: crear/editar/iniciar, baja
  propia, cancelación/foco/teclado, recuperación por Admin, calendarios y Aunor.
- Pruebas SQL: `node frontend/scripts/verify-operator-planning.mjs`. Crea una
  base UUID nueva dentro del contenedor local; aplica la cadena de migraciones,
  comprueba RPC/RLS, concurrencia, preservación y restauración, y retira solo
  esa base. No reinicia ni siembra la base local del usuario.

Resultado: **343 pruebas unitarias aprobadas (40 archivos)** y **36 pruebas
de navegador aprobadas**, sobre el build local de producción con modo demo
aislado. TypeScript, lint y `git diff --check` sin errores. La prueba del diálogo
se repitió tras ajustar el ciclo de foco por teclado: 14/14 pruebas del componente.

El verificador SQL aprobó la cadena de migraciones, los rechazos por autor,
responsable, estado, cuenta inactiva, clave pendiente, permiso y versión;
también las carreras con revocación, reasignación e inicio, la auditoría atómica,
preservación íntegra y restauración exclusiva de Admin. La base UUID usada en
la ejecución aprobada fue `sr_operator_test_65f40e361fed4cc9a08e2d8c10b64d98`;
el verificador confirmó su retirada. Ninguna base de trabajo recibió migraciones.

La revisión visual comprobó las modalidades y acciones en escritorio/móvil,
el diálogo, y el Histórico entre 320 y 1920 px, incluido texto ampliado al 200 %.
El diseño mantiene las tipografías, superficies, colores y navegación del sistema;
la guía frontend-design orientó la jerarquía y el traslado de la propuesta D.

Capturas de la aplicación local (datos ficticios, no maquetas):

- [Modalidades](implementacion-operario-historico-2026-09-22/01-modalidades-escritorio.png).
- [Acciones centradas](implementacion-operario-historico-2026-09-22/02-acciones-escritorio.png).
- [Confirmación en escritorio](implementacion-operario-historico-2026-09-22/03-confirmacion-escritorio.png).
- [Confirmación en móvil](implementacion-operario-historico-2026-09-22/04-confirmacion-movil.png).
- [Histórico panorámico](implementacion-operario-historico-2026-09-22/05-historico-escritorio.png).

Las capturas extensas de móvil y el resto de evidencias de ejecución permanecen
en `frontend/.verificacion/playwright-existing-results/` (ignoradas por Git).

## Pendiente para la publicación final (no ejecutar aún)

1. Autorización de Marco para sincronizar/publicar esta ronda.
2. Respaldo privado verificado de la base remota antes de cualquier migración.
3. Aplicar `202609220001_operator_own_activity_trash.sql` al destino autorizado
   y verificar la RPC antes de publicar el frontend. Sin ella, la acción devuelve
   un aviso y no usa un canal alternativo para escribir.
4. Cambiar exclusivamente la contraseña real de Admin según lo acordado, fuera
   de Git y de estos documentos. Mantener la separación de las credenciales.
5. Verificar despliegue y permisos reales mediante comprobaciones no destructivas;
   no eliminar trabajos reales como prueba.

Un commit respalda el código y las propuestas; no es un respaldo de la base de
datos. Para deshacer esta ronda en local, revertir únicamente sus commits y
preservar los cambios ajenos. No usar resets amplios ni eliminar información real.
