# Contrato de handoff del frontend

**Versión:** 2026-08-20 — implementado en simulación, pendiente de aprobación de Marco.

## Entidades

- **Cuenta:** id, usuario, nombre visible, roles, rol activo y estado. Desactivar revoca la sesión.
- **Actividad:** id, tipo operativo, orden administrativa, cuenta responsable, estado, versión,
  ubicación, avance cuando aplica, enlace, mensaje privado, autor y auditoría.
- **Versión de entrega:** campo, valor, cuenta, rol, fecha y motivo opcional.
- **Observación/rechazo:** motivo supervisor, fecha, respuesta, resolución y permiso de reenvío.
- **Comentario interno:** autor, rol, texto, fechas de creación/edición/eliminación.

## Permisos

- Solo Coordinación crea, asigna y edita datos administrativos.
- La cuenta responsable consulta y actualiza únicamente sus órdenes.
- Coordinación y Supervisión consultan todas.
- Solo Supervisión observa, rechaza y aprueba.
- Solo Coordinación cancela, con motivo, salvo una orden ya aprobada.
- Solo Coordinación elimina lógicamente órdenes no iniciadas.
- Solo el autor edita o elimina sus mensajes y comentarios.
- Toda autorización debe repetirse en el servidor; ocultar controles no basta.

## Estados

`Programada → En proceso → Por subir → Entregada → Aprobada`.

- `Entregada → Observada → Entregada` para correcciones menores.
- `Entregada → Rechazada → Entregada` cuando se permite reenviar.
- Un rechazo sin reenvío queda terminal hasta cancelación de Coordinación.
- Grabación/Locución requieren enlace; Edición/Creatividad requieren enlace y avance 100%.
- Aprobar vuelve a validar entrega y rechaza una versión obsoleta con `409`.

## Operaciones del backend

- Sesión con cuenta y rol activo validado contra los roles asignados.
- Listados por `responsibleAccountId`, rol, mes, tipo y estado.
- Creación idempotente de órdenes y actualizaciones con `version`/`updatedAt`.
- Transiciones atómicas con historial inmutable.
- Comentarios internos con autoría y eliminación lógica.
- Histórico de versiones de enlace, avance y mensaje privado.
- Enlace histórico persistente y restringido a HTTPS de OneDrive/SharePoint.

## Errores esperados

`401` sin sesión, `403` sin permiso, `404` inexistente, `409` versión/transición en conflicto y `422`
para datos inválidos. El cliente conserva borradores recuperables y no duplica reintentos.

Los stores y cookies actuales son adaptadores temporales. No deben migrarse contraseñas de demostración
ni confiarse permisos reales a datos controlados por el navegador.
