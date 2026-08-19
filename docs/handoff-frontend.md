# Contrato de handoff del frontend

**Versión:** 2026-08-19 — listo para revisión, pendiente de aprobación de Marco.

## Entidades y datos

- **Cuenta:** `id`, usuario, nombre visible, rol, iniciales y estado activo/inactivo. El backend debe impedir autenticación y renovar/revocar sesión al desactivar una cuenta.
- **Actividad:** identificador estable, tipo/rol propietario, título, descripción, fecha, responsable, estado, ubicación opcional según rol, avance cuando aplica, enlace de material, autor, fechas de creación/modificación e historial de estados.
- **Observación interna:** actividad, texto, autor supervisor, fecha, estado pendiente/respondida/resuelta, respuesta del colaborador y marcas de tiempo. Solo Supervisión crea y resuelve; el responsable responde.
- **Feedback AUNOR:** actividad, comentario del cliente, fecha, estado pendiente/respondido/descartado y respuesta de Rhino. Nunca cambia automáticamente el estado de la actividad ni llega directo al colaborador.
- **Solicitud Burson:** solicitud, fecha, material solicitado y campos de seguimiento/pendientes. Coordinación escribe; Burson solo consulta.

## Acciones y permisos

- Los cinco roles de trabajo crean y modifican sus actividades; salvo Coordinación, consultan únicamente las propias. Solo el autor puede editar o eliminar sus mensajes.
- Coordinación consulta el trabajo del equipo y administra Burson, pero no observa ni aprueba.
- Supervisión consulta todo, observa, responde a AUNOR, resuelve, aprueba, cancela y administra cuentas; no registra trabajo operativo.
- AUNOR consulta exclusivamente su vista mensual y comenta actividades visibles.
- Burson consulta exclusivamente su tablero en modo lectura.
- La API debe aplicar estos permisos en servidor; ocultar controles en UI no constituye autorización.

## Estados y transiciones

Estados visibles: `Programada`, `En proceso`, `Por subir`, `Entregada`, `Observada`, `Aprobada` y `Cancelada`. El backend debe devolver historial inmutable con actor y fecha en cada transición. Aprobar exige una actividad entregada; observar abre una observación; responder no la resuelve; cancelar y aprobar son cierres explícitos. Las reglas finales deben centralizarse en el dominio backend y devolverse como errores de conflicto cuando la versión cambió.

## Operaciones requeridas

- Listar actividades por rol, mes, tipo y estado; obtener detalle; crear, editar y eliminar según reglas.
- Guardar transiciones e historial; crear/responder/resolver observaciones.
- Crear/editar/eliminar comentarios propios de AUNOR, responder o descartar desde Supervisión.
- CRUD de Burson para Coordinación y lectura para Burson.
- Listar, crear, editar, activar y desactivar cuentas.
- Consultar resúmenes mensuales e historial paginado/filtrado.

## Errores esperados

La integración necesita distinguir: `401` sin sesión, `403` sin permiso, `404` recurso inexistente, `409` transición o versión en conflicto y `422` datos inválidos. La UI debe conservar los datos editados cuando sea recuperable, mostrar un mensaje claro y permitir reintento. En recursos eliminados o inaccesibles debe volver a una ruta segura.

## Idempotencia y concurrencia

Creaciones y transiciones sensibles deben aceptar una clave de idempotencia. Ediciones deben enviar versión o `updatedAt` y rechazar escrituras obsoletas con `409`. El cliente no debe duplicar envíos mientras una operación está pendiente y debe reconciliar la respuesta canónica del servidor.

## Sustitución de mocks

Los stores actuales del navegador son adaptadores temporales. La integración debe conservar sus contratos de vista, reemplazarlos por llamadas autenticadas y usar consultas con caché/invalidez por entidad. No se deben migrar al backend contraseñas de demostración ni confiar en las cookies de rol de prueba.
