# Derivación Codex — lugares por jornada

Elaborada antes de recibir derivación de Claude. No compartir con el derivador; solo con comparador posterior.

## Supuestos

Planificación Admin conserva lugar y fechas después de crear; no cambia autoridad. Lugar global existente no se elimina. Cada fila de fechas puede tener lugar específico; dos filas con idénticas fechas y distinto lugar expresan varios sitios el mismo día, mientras el calendario sigue contando IDs de actividad únicos. No inferir horas ni itinerarios.

## Propuesta

DateSpan añade place opcional; activity_date_spans columna place text no nula default vacío con máximo 300, migración aditiva. Lugar efectivo por fila: el específico no vacío, si no el global; texto vacío representa herencia, no un lugar inventado. No backfill sobre datos reales. Formulario mantiene lugar general y añade Lugar de esta jornada (opcional) por fila; repetir fechas con lugares distintos es válido. DTO actividad/Burson/Histórico conserva metadatos sin colapsar fechas; fichas muestran fecha y lugar asociados.

Validación SQL y TypeScript rechaza lugar no string si presente y >300; fechas y límite100 sin cambios. Extender reemplazo atómico y no exponer escrituras directas. RPCs originales mantienen grants/autorización y versión; un nuevo contrato versionado (v2 o capability explícita verificada) debe evitar que frontend nuevo envíe metadatos a escritor v1 antiguo que los descartaría. Evitar fallback silencioso. Preferir capa de RPC v2 específica que herede las autorizaciones v1 y use escritor actualizado, con revokes explícitos antes de grants, frente a copiar grandes cuerpos y crear divergencias. Evaluar el aumento de carga contra una comprobación de capacidad sin mutación; no cambiar autoridades.

Conservar fingerprint p_spans original de RPC; la simulación ahora incluye place solo cuando presente/no vacío, sin añadir claves vacías a borradores legados que cambien replays. Asegurar que requestId no transforma un cambio de lugar en replay de la operación anterior. v5 sigue legible sin borrar almacenamiento del usuario.

## Alternativas

Lista global de lugares no vincula fechas; no cumple. Tabla relacionada a IDs de spans exige reconstruir enlaces porque IDs se reemplazan, y necesita RLS adicional sin beneficio para esta cardinalidad. JSON libre de ubicaciones pierde validación/legibilidad. Columna array por fila solo necesaria si no se permite repetir rango, restricción que no existe.

## Riesgos

API vieja ignora claves desconocidas, drift de idempotencia, pérdida DTO, versionado histórico, grants de funciones nuevas por defecto, perfiles/borradores incompatibles y confundir lugar planificado con ejecución. Doble fila mismo día no significa doble entregable ni doble conteo.

## Verificación

Migración exclusivamente en base efímera aislada si está disponible; no reset de BD existente. Crear/releer/replanificar multi-sede (incluido mismo día), preservar legado/global y execution, version conflict, place-only idempotency conflict, límites e invalid payload, escritura operario rechazada, RLS por rol/papelera y roundtrip todos los lectores. Unit + server actions + browser demo aislado a 390/768/1366/1920. No afirmar despliegue o RLS remoto por tests locales.

## Confianza

Media-alta sobre columna por jornada y conservación de autoridad; media sobre la envoltura versionada hasta comparación y verificación del SQL real. Requiere pruebas reales antes de declarar modelo completo.

