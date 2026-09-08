# Resolución de revisiones de código e imágenes

Claude completó la revisión backend y la revisión frontend a través del lanzador. Ambas respuestas completas se conservan junto a este archivo. No se les atribuyen pruebas ejecutadas ni revisión visual por leer código.

## Backend

- B1: al pasar a Entregada se oculta el motivo antiguo de no realización en la proyección actual. La publicación original permanece intacta. Probado en SQL.
- B2: guardia de cuenta activa única con SR009 y un índice único como última protección. Probados alta por RPC service_role y cambio de rol por RPC autenticado. Edge conserva compensación de Auth y traduce el error para Aunor.
- M3/M4: texto vacío y conversiones inválidas producen SR003 controlado. Probados.
- M5: correcciones lineales de acuerdos y reemplazos; originales y confirmaciones antiguas conservados, nuevos objetos sin confirmación heredada. Probados.
- M6/M7: lecturas de datos internos existentes rechazadas, tres RPC internos rechazan al exoperario reclasificado; las siete vistas deniegan a anon y vacían resultados para Operario, Burson y sesiones revocadas. Probados.
- M8: se conserva EXECUTE de `private.can_access_aunor_activity` para authenticated. Las funciones de una vista requieren permiso del consultante aun con security_invoker=false; quitarlo rompería la lectura. Pruebas reales pasan con la concesión restringida; no se concede a anon/service_role.
- Concurrencia real: dos conexiones PostgreSQL confirman el mismo objeto sin duplicar la confirmación. Incluye entrega y reemplazo; pruebas adicionales del cambio material A→B→A y bloqueo de confirmación antigua.

## Frontend

- D1: el calendario cliente mantiene estructura, meses y panel, con título secundario «Jornadas» y alcance «Solo las jornadas publicadas para Aunor». No se modifica la cabecera del Histórico interno. Detalle de actividad sin segundo h1.
- D2: evidencias de llamada y reemplazo usan campos y estados distintos; limpiar la evidencia de la llamada al publicar evita reutilización accidental.
- D3: fecha de llamada validada antes de serializar; mensaje visible si no es válida.
- D5: identificadores demo son slugs, NO necesariamente UUID como supuso el revisor. Se valida segmento seguro; Supabase sigue exigiendo UUID; se codifica el segmento antes de revalidar. RequestId exige UUID real en ambos modos.
- Correcciones de acuerdo/reemplazo disponibles en formularios Admin, enlazadas sin borrar originales. Enlaces del Admin van a fichas internas, no a rutas exclusivas del cliente.
- Avisos de mensajes: lectura por cuenta; actualización cada 30 segundos en pestaña visible y al recuperar foco. La versión del formulario de publicación se conserva separada de la lectura refrescada para detectar cambios concurrentes.

## Límites que no se ocultan

- D4: la simulación interna preexistente vive en localStorage del navegador; la nueva demostración externa vive en memoria del servidor local para permitir conversar entre contextos de prueba separados, sin modificar cookies ni datos existentes. El Admin aporta una proyección explícita al publicar en demo. No es un sistema de autenticación ni fuente autoritativa para producción. La planificación demo se sincroniza al publicar/actualizar; en Supabase se lee viva de PostgreSQL. Los permisos reales se prueban en SQL y server actions, nunca se deducen de la demo.
- D6/D7: cerrojo global y tabla de idempotencia conservados para este volumen. No se introduce tarea de purga ni se borra evidencia; retención y escalado quedan documentados para operación futura. Purgar sin ventana acordada podría perder garantías de reintento.
- No se ejecuta `supabase db reset` sugerido por el revisor: no está autorizado borrar o migrar la base existente. El verificador aplica la cadena completa exclusivamente a una DB UUID nueva y elimina solo esa DB.

Dos pruebas previas se adaptaron a cambios explícitamente aprobados: lista de cuatro roles (antes tres) y ubicación del código de colores extraído a annual-calendar-view. No se rebajan los umbrales de contraste ni el comportamiento de las pruebas del Histórico.

## Cierre visual y funcional

Claude leyó las capturas reales y las referencias aprobadas, no solo el código. Se conservan las respuestas completas `REVISION-FINAL-CLAUDE-01.json` y `REVISION-FINAL-CLAUDE-02.json`.

- Códigos GR/ED coherentes entre actividad, calendario, Lo acordado y original/sustituto: `ReplacementSummary` pasa la categoría a `aunorCode`. El fallback AC queda para objetos sin categoría disponible; las pruebas SQL mantienen ambos extremos del reemplazo dentro del ámbito visible.
- Los botones de material y detalle del calendario usan el verde existente (`--amber`) con texto oscuro; no se introduce otro color de marca.
- Selector de categoría disponible también en el calendario, con filtrado de sus actividades sin rediseñar los doce meses.
- Cinco capturas nativas adicionales de formularios a 390 px permiten leer etiquetas, ayudas y controles. Claude confirmó la legibilidad, cerrando la limitación de la primera captura móvil excesivamente larga.
- Claude señaló que la barra inferior cubría botones en dos recortes de imágenes. Después se ejecutó el recorrido completo de formularios Admin y confirmación Aunor a 390 px con clics normales, sin `force`; pasó. El recorte de una captura no se toma por sí solo como prueba de interacción correcta.
- El tono tenue de botones deshabilitados queda como observación visual no bloqueante; no se altera el diseño global aprobado.
- Se declaran para aprobación de Marco dos diferencias respecto de las maquetas: conversaciones Admin externa/interna apiladas (no pestañas), con cuatro pasos explícitos de gestión, y detalle móvil del calendario en el diálogo existente del Histórico (no en línea). Véase ENTREGA.md.

El preview final volvió a superar el acceso Aunor/Admin sin errores JavaScript. Las suites las ejecutó Codex; no se atribuye a Claude ejecución de pruebas. Revisión local terminada, sin sustituir la autorización de migraciones ni las pruebas futuras con Auth y Data API reales.
