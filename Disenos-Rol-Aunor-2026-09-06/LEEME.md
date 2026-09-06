# Espacio Aunor · propuestas para aprobación

Estado: 16 PNG listos, revisión visual cruzada completada sin bloqueantes. Pendientes de tu aprobación. Solo maquetas offline; no es una implementación.

Carpeta nueva e independiente de las propuestas anteriores. Los datos de las maquetas serán ficticios. No se modifican la aplicación, datos, cookies, goal ni el protocolo de Claudex.

Se mantienen las decisiones confirmadas: un acceso compartido Aunor; Admin responde y registra acuerdos/reemplazos; operarios fuera de la conversación externa; solicitudes por llamada; confirmaciones separadas de pagos; actividades “Por relacionar” visibles al cliente al pertenecer a Aunor.

Las cantidades, vigencia y equivalencias contractuales no se representarán mediante cifras inventadas. El calendario de ejemplo no define vigencia contractual.

## Cómo revisar

Abre GALERIA.html en Chrome. Cada escena tiene versión escritorio y móvil, enlace al PNG completo y descarga. Las imágenes móviles son de página completa: usa el zoom del navegador, no evalúes los textos únicamente desde las miniaturas.

## Inventario

| Escena | Qué muestra |
|---|---|
| 01 · Actividades | Planificación publicada, días/lugares, estados y avisos. |
| 02 · Entrega pendiente | Material E-021, conversación externa y confirmación explícita. |
| 03 · Entrega confirmada | Resultado atribuido a la cuenta Aunor, sin cambiar ejecución. |
| 04 · Lo acordado | Servicios, trabajos relacionados y Por relacionar. |
| 05 · Reemplazo | Original y sustituto, motivo, evidencia, llamada y confirmación R-03. |
| 06 · Admin | Respuesta al cliente y registro de reemplazo dentro del detalle. |
| 07 · Calendario | Doce meses, coincidencias y panel de detalle conservados. |
| 08 · Mensajes | Hilos externos por actividad y lectura de la cuenta compartida. |

Cada escena cuenta con PNG de escritorio (viewport 1366 px) y móvil (390 px). Los PNG tienen mayor resolución física para conservar texto al ampliar. La barra de navegación móvil está al pie de la captura larga para que no tape el contenido; esto no especifica un cambio a su comportamiento fijo en la aplicación.

## Momentos distintos del ejemplo

- 06: antes de publicar R-03. Llamada el 11 de junio; Admin registra el 19. El comentario no sustituye la confirmación explícita.
- 04/05: después de confirmar R-03 el 20 de junio.
- 02: material E-021 publicado el 22 de junio; se ilustra el paso previo al botón final, después de que el usuario marca la casilla. No representa una casilla premarcada automáticamente.
- 03: mismo material confirmado expresamente por Aunor el 22 de junio.

La lista de servicios procede del contrato; las actividades, códigos, fechas, lugares, mensajes y confirmaciones son ejemplos inventados para la maqueta. «No realizada» describe el motivo conservado del original, no diseña una reapertura ni modifica el bloqueo actual de entregas.

## Archivos

- png/: copias finales de los 16 PNG revisados.
- auxiliar/borrador-01, 02, 03/: renders conservados; no se sobrescriben entre sí.
- auxiliar/maquetas.cjs y maquetas.css: fuentes HTML/CSS aisladas.
- auxiliar/renderizar.cjs: render offline reproducible en un borrador nuevo numerado; necesita dependencias locales de frontend, pero no importa su aplicación ni servicios.
- auxiliar/ampliaciones-03/: capturas directas de elementos para inspección legible del calendario móvil.
- auxiliar/derivaciones.json, comparacion.json y revision-claude-*.json: evidencia de Claudex.
- VERIFICACION.json: validación de galería y hashes de entrega, al empaquetar.

## Próximo paso, solo con aprobación

Aprobar o corregir los PNG → especificar implementación y permisos → implementar y probar. Esta entrega se detiene en la aprobación visual. No autoriza por sí misma migraciones, cambios de estado, publicaciones ni despliegues.

Base: capturas reales de Revision-Visual-2026-09-05 y Implementacion-Historico-C-2026-09-05/verificacion-final, contrato visual vigente y lista de servicios de la cláusula 2.2.

Pendientes técnicos previos: se conservan; estas maquetas no validan permisos reales, migraciones, despliegues, pruebas autenticadas, aceptación del equipo ni producción. La migración de lugares por jornada sigue fuera de este trabajo.
