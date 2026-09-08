# Resolución técnica antes de implementar

Derivación Codex guardada antes de invocar a Claude. Claude completó la derivación en sesión `35f41850-b24b-40a9-8e82-f0ece2fe2bc4`; la respuesta completa se recuperó del journal del lanzador, no se reconstruyó desde fragmentos. Comparación en sesión limpia sin herramientas `dbf167cd-78af-48fc-88f2-a7119b7429cd`.

## Decisiones

- Cuarto rol `aunor`, identidad colectiva; como máximo una cuenta activa. No se provisiona cuenta Auth real aquí.
- Allowlist Admin/Operario en mensajes internos y auditoría. No ampliar RLS de actividades internas.
- Proyección pública explícita, con helper compartido de publicación/sesión/rol/cliente/no borrado/no Burson. Escrituras únicamente RPC autenticadas y autorizadas de nuevo en PostgreSQL.
- Publicación con revisiones conservadas; relación contractual independiente de pertenencia a Aunor. Estado/jornadas vivos bajo publicación explícita. Admin revisa el contenido que hace visible.
- Entregas y reemplazos identificados e inmutables. Una entrega nueva no hereda la confirmación anterior. No cambiar `update_execution_v1` ni `thread_opened_at`. Las modificaciones de material invalidan técnicamente el objeto confirmable anterior, sin reabrir el estado operativo.
- Mensajes externos append-only, correcciones enlazadas. Marcadores de lectura por cuenta y secuencia ordenada; los PNG aprobados incluyen avisos de mensajes nuevos.
- Catálogo inicial: nombres abreviados de los doce servicios aportados, referencia cláusula 2.2. Semilla de referencia en la nueva migración, sin cantidades, vigencias o equivalencias. No añadir administración de contratos no solicitada.
- No implementar despublicación voluntaria: fue una posibilidad técnica introducida durante la derivación, no una función pedida ni aprobada. No borrar confirmaciones. La baja interna ya existente conserva sus reglas; toda lectura cliente excluye actividades en papelera.

## Precisiones sobre la comparación

La comparación señaló como preguntas el alta del catálogo y la despublicación. Se resuelven sin ampliar el alcance: la orden ya autoriza usar la lista disponible, y no solicita despublicación. No se añaden pantallas ni nuevos permisos de producto.

La afirmación de que Aunor leería automáticamente auditoría al añadir el enum es demasiado amplia: el helper vigente de visibilidad mantiene `ELSE false`. El endurecimiento sigue siendo necesario como defensa explícita; el riesgo reproducible inmediato está especialmente en editar/borrar mensajes antiguos propios tras reclasificar un perfil.

Docker no estaba operativo en la comprobación inicial. Las pruebas SQL deberán ejecutarse en una base nueva desechable; si no se puede disponer de ese entorno se informará como prueba pendiente, nunca como aprobada.
