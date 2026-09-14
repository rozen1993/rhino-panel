# Plan técnico del asistente IA de DA VINCI

Versión 1.0 — 14 de septiembre de 2026.

**Estado: propuesta para aprobación e implementación futura. Solo documentación.** No hay chat construido, modelos probados, créditos consumidos, migraciones aplicadas ni cambios de despliegue como resultado de este documento.

Lecturas relacionadas: [auditoría del PDF](auditoria-chat-ia-2026-09-14.md), [PDF original conservado](plan-chat-ia-especificacion.pdf), [catálogo público de modelos consultado](chat-ia-modelos-openrouter-2026-09-14.json).

Lectura rápida para Marco: [qué construir](#1-decisión-ejecutiva), [capacidades por rol](#3-alcance-funcional-por-rol), [modelos y presupuesto](#10-modelos-y-presupuesto-de-openrouter), [fases y pruebas](#14-fases-y-puertas-de-aceptación) y [decisiones pendientes](#16-decisiones-pendientes-de-marco). El resto especifica cómo implementar sin saltarse esas condiciones.

## 1. Decisión ejecutiva

Construir un **asistente operativo**, no un agente autónomo ni una interfaz de SQL. Debe encontrar información permitida, convertir cronogramas en propuestas revisables y ayudar a seguir el trabajo sin inventar registros ni ampliar permisos.

Secuencia recomendada:

1. **Admin: consultar y preparar.** Agenda, búsquedas, pendientes, borradores y extracción de cronogramas. Ninguna escritura de negocio desde el chat.
2. **Operario y Aunor: consultar dentro de su alcance.** Cada cuenta ve únicamente información autorizada y vigente.
3. **Admin: crear y replanificar con aprobación vinculante.** Después, y por separado, publicación Aunor y ejecución del Operario mediante acciones permitidas.
4. **Ampliaciones opcionales.** Dictado, documentos autorizados, recordatorios e integraciones externas, sin incluirlas como requisitos del primer piloto.

No añadir inicialmente una base vectorial, Redis/Upstash, otro proyecto Supabase, navegación web autónoma, WhatsApp API ni un framework de agentes. Una segunda infraestructura no corrige un problema de permisos ni garantiza velocidad.

El saldo declarado por Marco es superior a US$9; se toma **US$9 como máximo total del piloto**, no como presupuesto mensual renovable ni autorización de gasto en esta tarea. Diseño recomendado: US$8 operables y US$1 de margen no liberado automáticamente.

La aprobación de este plan no equivale a aprobar todas sus ampliaciones ni a permitir enviar datos reales a terceros. Las decisiones pendientes están en §16.

## 2. Base real y límites de conocimiento

### 2.1 Estado contrastado con el repositorio

| Área | Evidencia actual | Consecuencia para el asistente |
|---|---|---|
| Aplicación | Next.js 16.3.4, React 19.2.8, TypeScript, Node >=22 en [package.json](../frontend/package.json) | Integración nativa posible; no introducir otro frontend para el MVP |
| Identidad | [Cookies HttpOnly](../frontend/lib/supabase/cookie-options.ts), cliente SSR y perfiles activos | El navegador no entrega JWT al widget ni al modelo |
| Roles activos | Admin, Operario y Aunor en [roles.ts](../frontend/lib/roles.ts) | Burson permanece legado, no se reactiva |
| Estados | Programada, En proceso, Entregada | Atraso es indicador; publicación y confirmación no son estados nuevos |
| Planificación | [Acciones y RPC existentes](../frontend/app/actividades/actions.ts) | Admin planifica; Operario responsable ejecuta |
| Jornadas | Fechas/rangos y lugares por jornada | Soportar días discontinuos; no asumir horario estructurado |
| Aunor | [Proyecciones y lecturas por escena](../frontend/lib/supabase/aunor.ts) | No consultar tablas internas para responder al cliente |
| Material | [Enlaces HTTPS sin credenciales](../frontend/lib/external-link.ts) | Tener un enlace no significa haber leído el archivo o visto el vídeo |
| Reinicio | [restart_activity_v2](../supabase/migrations/202609110003_restart_activity.sql) | Copia limpia y anterior a Papelera; no sustituir por el reset antiguo |
| Borrado | [Flujo explícito con contraseña y vista previa](../supabase/migrations/202609110004_explicit_erasure.sql) | La IA no recibe herramientas de destrucción ni contraseñas |
| Diseño | [Contrato visual vigente](../diseno/direccion-final-traducida/CONTRATO-VISUAL.md) y componentes actuales | Misma familia visual; marca DA VINCI; estado En proceso azul |
| Despliegue | [vercel.json](../frontend/vercel.json) declara región `pdx1`; Marco declara Hobby | No cambiar región ni plan sin decisión y medición |

No se verificaron paneles privados, configuración de Fluid Compute, tamaño actual de la base, cuotas remanentes, saldo exacto, proveedor de inferencia autorizado o equivalencia entre esquema local versionado y producción. Esas comprobaciones se reservan al preflight de implementación, con acceso autorizado y sin exponer secretos.

### 2.2 Conflictos documentales que no se deben heredar

El [contrato de producto anterior](contrato-producto-vigente-2026-08-28.md), §10, acotaba el chat a un plan PDF breve, separado y Admin/solo lectura. Marco ahora autorizó redactar una propuesta más amplia, **no implementarla**. Se propone mantener un núcleo reusable e incorporar un puente mínimo al frontend, pero ese cambio de integración queda pendiente de aprobación.

El antiguo [sistema de diseño](sistema-diseno.md) es histórico: no utilizar sus siete estados, colores antiguos o marca anterior como especificación vigente. Los cambios confirmados posteriores y el código actual deben contrastarse antes de implementar.

### 2.3 Lo que no existe y no se promete

- Inventario de cámaras, reserva de drones o disponibilidad estructurada de equipos.
- Horas de comienzo/fin y duración normalizadas suficientes para resolver conflictos horarios.
- Facturación, pagos, nómina o aprobación económica mediante confirmación Aunor.
- Lectura automática de OneDrive, SharePoint, correo o conversaciones de WhatsApp.
- Búsqueda en el contenido de vídeos, transcripción de grabaciones o acceso a contratos completos no incorporados expresamente.
- Historial individual por persona cuando varias personas comparten una cuenta.

## 3. Alcance funcional por rol

| Capacidad | Admin | Operario | Aunor | Fase |
|---|---|---|---|---|
| Agenda y resumen por fecha | Actividades visibles para Admin | Solo asignadas a su cuenta | Solo publicaciones visibles | F1 / F2 |
| Buscar y abrir detalles | Trabajo operativo e Histórico autorizado | Trabajo propio autorizado, no acceso nuevo al módulo Histórico | Proyecciones públicas del espacio Aunor | F1 / F2 |
| Pendientes y comprobaciones de integridad | Planificación, ejecución, publicación y confirmación diferenciadas | Sus pendientes de ejecución | Entregas/sustituciones publicadas pendientes de su revisión | F1 / F2 |
| Extraer cronogramas e imágenes | Propuestas editables | Fuera del primer alcance; solo creación propia si se habilita después | No planifica actividades | F1 |
| Preparar textos | Planificación y publicación | Actualización de su trabajo | Ayuda para comprender lo publicado | F1 / F2 |
| Crear/replanificar desde propuesta | Sí, tras confirmar | Crear solo propia con permiso; nunca replanificar | No | F3 / F4 |
| Actualizar enlace/opinión e iniciar/entregar | No | Responsable vigente, condiciones del proceso y confirmación | No | F4 |
| Publicar actividad/entrega, registrar acuerdo/sustitución | Sí, mediante contratos existentes y revisión | No | No | F4 |
| Confirmar entrega o sustitución | No en nombre de Aunor | No | Abrir revisión nativa y confirmar allí | F2; integrar el mismo control en F4 solo si se aprueba |
| Restablecer, bajas, restauración, cuentas y permisos | Enlace a la pantalla nativa | Sin nuevas facultades | Sin nuevas facultades | Fuera de herramientas IA |
| Eliminar cuentas o vaciar Papelera | Solo pantalla nativa protegida | No | No | Excluido del ejecutor IA |

Las capacidades se calculan en el servidor para cada solicitud. Ocultar botones o herramientas al modelo no reemplaza la validación del endpoint y de la base. Una cuenta inactiva, un rol retirado, una sesión revocada/expirada o `must_change_password=true` no puede utilizar inferencia ni recuperar conversaciones del chat.

No consultar cuentas, credenciales, papelera, auditoría completa o mensajes internos en el primer piloto. Si posteriormente se incorpora conversación Admin–Operario, será una herramienta independiente con participantes vigentes, exclusión de mensajes dados de baja y pruebas específicas. Aunor nunca accede a ella.

## 4. Experiencia y casos de uso prioritarios

### CU01. «¿Qué tenemos hoy?»

Resolver «hoy» en `America/Lima`, mostrar la fecha y consultar jornadas que la contienen, incluidas jornadas discontinuas. Agrupar por actividad, no duplicar tarjetas por cada tramo coincidente. Si no hay datos, decir «No hay actividades registradas para hoy dentro de tu acceso»; no inferir que nadie trabaja.

Mostrar título, estado registrado, lugar y enlace a detalle. Responsable solo cuando la proyección autorizada lo incluya. El modelo no inventa el nombre en la vista Aunor, cuya proyección actual no ofrece el mismo conjunto de campos que la vista Admin.

### CU02. «Carga este cronograma»

En F1 significa **extraer y preparar, no guardar actividades**. El usuario pega texto o adjunta una imagen. Se obtiene una tabla editable de propuestas con fuente y preguntas pendientes. El botón dice «Revisar propuesta», no «Actividades creadas».

El ejemplo real compartido para el viernes 11/09/2026 sirve como caso de aceptación de producto, no como fixture de producción:

- Johan: evento «Viva la Salud», jornada completa. No inventar lugar u horas.
- Jean: oficinas Aunor, Nuevo Chimbote, 10:00–11:30 aproximado, cápsula con Grecia y tomas de apoyo.
- Jean: Bosque San Antonio, inicio ambiguo 11:45/12:00, invitación, apoyo y dron. No convertir 12:00 en hora de finalización.
- «John de Aunor» es un contacto mencionado, no otro responsable al que asignar automáticamente.
- Cámara, prompter, micrófonos y dron son indicaciones, no reservas confirmadas de inventario.

La segunda imagen con peajes y público objetivo no identifica por sí sola actividad audiovisual, responsable o entregable. El asistente pregunta esos datos antes de convertir cada fila en trabajo. Distingue «agenda de un evento al que podríamos cubrir» de «orden de grabación ya confirmada».

Pruebas automatizadas: recrear ejemplos equivalentes con nombres y textos sintéticos; las imágenes reales no se envían al proveedor durante esta planificación.

### CU03. «¿Qué falta para compartirlo con Aunor?»

Separar: estado de ejecución, enlace registrado, publicación de la actividad, publicación de una versión de entrega y confirmación del objeto vigente. No tratar una entrega antigua confirmada como confirmación de una versión nueva. No declarar «material revisado» por tener URL.

### CU04. «Reprograma la actividad para el lunes»

F1: preparar una propuesta y señalar la fecha exacta del lunes. F3: localizar inequívocamente la actividad, mostrar antes/después de fechas, lugares y responsable, conservar la versión revisada y exigir botón de confirmación. Si hay títulos repetidos, preguntar cuál antes de preparar una acción.

### CU05. «Ya terminé»

Para Operario en F2: explicar el flujo y abrir la actividad. En F4: verificar responsabilidad, estado, enlace y restricciones, preparar el siguiente paso permitido y confirmar. No saltar Programada → Entregada de forma encubierta ni atribuir ejecución al Admin.

### CU06. «Elimina todo esto»

No ejecutar. Explicar el flujo nativo de Admin y, si tiene acceso, ofrecer enlace a la pantalla apropiada. No pedir contraseña en texto, no enviar credenciales al proveedor y no automatizar el botón de destrucción.

### 4.1 Contrato de extracción

Cada fila propuesta conserva:

- Identificador de borrador, origen y número de página/fila o fragmento; no confiar en el nombre del archivo como fecha definitiva.
- Tipo del catálogo, título, descripción, responsable candidato y jornadas con lugar.
- Valores «confirmados por la fuente», «interpretación propuesta» y «faltantes» separados. La confianza numérica del modelo no es garantía.
- Horas, intervalos ambiguos, público objetivo y equipos como notas de planificación revisables, sin inventar columnas actuales.
- Advertencias de posible duplicado y coincidencias de jornadas. Una coincidencia de día no prueba incompatibilidad horaria.

Validar contra [activity-validation.ts](../frontend/lib/activity-validation.ts): título de 2–180 caracteres, descripción de 2–5000, lugares hasta 300, tipos cerrados, fechas válidas desde 2026-01-01 y jornadas compatibles. El límite del chat puede ser menor que el de la base: máximo 10 propuestas por lote en el piloto.

Una coincidencia aproximada de nombre nunca asigna por sí sola una cuenta. Resolver al identificador de un Operario activo mediante la lista autorizada y confirmar ambigüedades. No crear usuarios para resolver nombres desconocidos.

En F1 las propuestas solo se revisan/copían; cualquier paso a un formulario que guarde será manual y explícito. En F3, creación por fila con recibo propio. Si un lote guarda 2 filas y falla la tercera, mostrar 2 creadas/1 pendiente; no prometer una transacción de lote que la implementación no tenga ni «revertir» borrando trabajo real.

## 5. Arquitectura propuesta

### 5.1 Camino recomendado

```text
Panel nativo DA VINCI — carga al abrir
             │ mismo origen; cookies HttpOnly; texto actual
             ▼
Puente servidor (BFF) — autenticación, capacidades, CSRF, límites
             │
             ├── Núcleo de conversación y validación
             │       └── Adaptador OpenRouter → endpoint permitido
             │
             ├── Adaptador DA VINCI → Supabase con JWT del usuario
             │       └── consultas acotadas / RPC existentes, según fase
             │
             └── Control privado del chat → consumo, contexto, propuestas
                     └── acceso técnico restringido, sin privilegios de negocio
```

Separar código reusable de infraestructura desplegada. El núcleo puede mantenerse en un paquete privado separado; no necesita un gateway remoto, un iframe ni un paquete público para comenzar. La aplicación host necesita un puente mínimo para su autenticación y adaptadores específicos.

El contrato anterior pedía separación del chat: **la opción de paquete + puente requiere aprobación explícita**. Si Marco exige repositorio y gateway completamente independientes, diseñar después autenticación servidor-a-servidor, identidad delegada, red y presupuesto; no improvisar un JWT en HTML para evitar esa decisión.

### 5.2 Dos accesos distintos a Supabase

**Datos del producto:** `createSupabaseServerClient` y sesión real del solicitante. El modelo no selecciona tablas, actor, rol, token o credencial. Aunor utiliza las proyecciones autorizadas con sus filtros; no suponer que `security_barrier` por sí solo autoriza una vista ni modificar sus grants para facilitar el chat.

**Control del chat:** proponer un rol PostgreSQL técnico `chat_runtime`, sin `BYPASSRLS`, sin pertenencia a `service_role`, sin lectura/escritura de tablas de negocio y sin administración Auth. Solo puede ejecutar funciones privadas acotadas de consumo, historial y propuestas. Las funciones comprueban actor/sesión contra registros vigentes; esos valores los establece el BFF, nunca el cuerpo del usuario ni el modelo.

Conexión a través del pooler transaccional, con credencial exclusivamente de servidor, TLS, consultas parametrizadas, tiempo límite y máximo inicial de 1 conexión por instancia. No mantener transacciones ni locks abiertos durante la llamada al modelo. La compatibilidad del rol y pooler debe probarse en una base desechable antes de elegir esta opción. [Conexiones de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Este acceso adicional evita que un navegador pueda falsificar consumo, aprobar propuestas o escribir mensajes de sistema. Si no puede restringirse de forma comprobable, se bloquea el piloto: no se sustituye por la clave global de servicio. Crear ese rol y sus funciones sería una migración futura con respaldo verificado, no una acción de esta entrega.

### 5.3 Sesión pasiva y entrada de solicitudes

Proponer `chat_context_v1()` —nombre nuevo, no existente— accesible con JWT del usuario, que solo devuelva identidad/capacidades mínimas tras validar perfil activo, rol permitido, cambio de clave y `private.has_active_app_session()`. No registrar ni extender sesiones desde el chat.

Validar al comenzar la solicitud, al ejecutar cada herramienta, antes de entregar información sensible y antes de cualquier escritura. Si la sesión vence durante una inferencia, contabilizar el posible coste pero no devolver datos protegidos ni ejecutar cambios.

Rutas propuestas, aún no creadas:

| Ruta | Entrada admitida | Salida / restricción |
|---|---|---|
| `POST /api/chat/turn` | `threadId?`, `clientRequestId`, `text`, contexto de ruta validado, referencias a adjuntos propios | Eventos de progreso y respuesta validada; no JWT en cuerpo |
| `POST /api/chat/extract` | Imagen o páginas procesadas, límites de §9 y consentimiento | Propuestas, fuentes y dudas; sin operaciones de producto |
| `GET /api/chat/threads/:id` | Identificador opaco de conversación propia | Revalida todas las fuentes antes de devolver contenido |
| `POST /api/chat/proposals/:id/confirm` | Identificador y versión/hash revisados, protección CSRF | Solo F3/F4; no invocable por herramienta del modelo |
| `GET /api/chat/operations/:id` | Identificador de operación propia | Recibo existente; no vuelve a ejecutar |

Origen permitido exacto, cookies seguras, validación de Origin/Fetch Metadata y mecanismo CSRF para acciones. No CORS `*`. La protección de Server Actions no se debe dar por heredada en nuevos Route Handlers. Limitar bytes y campos antes de parsear, rechazar roles `system`/`tool`, resultados de herramientas, actor, precio, modelo o `approved=true` enviados por el cliente.

## 6. Herramientas y respuestas verificables

### 6.1 Catálogo inicial pequeño

Los nombres siguientes son propuestas de adaptadores nuevos, no RPC que ya existan.

| Herramienta | Restricción | Fuente / resultado |
|---|---|---|
| `get_day_agenda` | Fecha validada y ámbito del actor | Jornadas coincidentes y actividades únicas |
| `search_activities` | Texto literal, tipo/estado/fechas cerrados; 20 resultados máximo por página | Proyección mínima de actividades autorizadas |
| `get_activity_detail` | Una referencia resoluble dentro del acceso | Campos explícitos, jornadas, versión y enlace autorizado |
| `get_operational_summary` | Admin, intervalo máximo inicial de 31 días | Conteos calculados en servidor; estados separados de publicación |
| `get_publication_followup` | Admin; Aunor con proyección reducida | Publicaciones, entregas vigentes y confirmaciones |
| `get_aunor_context` | Admin/Aunor, objeto concreto | Acuerdos/sustituciones/proyección de servicios autorizada |
| `resolve_operator` | Admin; Operario solo su identidad | Candidatos activos y mínimos, no catálogo de cuentas/credenciales |
| `get_product_help` | Fragmentos de documentación vigente clasificados por rol | Ayuda citada, sin cargar todo `docs` ni secretos |

Las herramientas no aceptan SQL, nombres de tabla, columnas arbitrarias, expresiones `.or`, URL libre para descargar ni credenciales. Los identificadores referidos por el modelo se resuelven y autorizan de nuevo en servidor. Las proyecciones varían por rol; no traer campos internos para filtrarlos después en el prompt.

Intervalo predeterminado: hoy; ampliación explícita a semana/mes. Histórico anual solo para Admin, con agregación paginada o consulta específica que conserve reglas de solapamiento y consistencia de [historical.ts](../frontend/lib/supabase/historical.ts). No reutilizar un lector de todo el año y enviar todos sus textos al LLM.

Si hay más resultados que el límite, devolver `hasMore`/cursor y explicarlo. Un conjunto truncado no puede presentarse como total. Conteos exactos mediante consulta determinista y permisos, no aritmética sobre los primeros 20 elementos del modelo. No sustituir un error de consulta por «cero actividades».

### 6.2 Formato de respuesta

Separar cuatro elementos: respuesta breve; hechos con fuentes; sugerencias/interpretaciones; acción propuesta o enlace nativo. Fuentes construidas por el servidor con tipo de objeto, ID, versión, fecha de consulta y ruta interna segura. El modelo solo puede citar alias suministrados; se rechazan citas inexistentes.

No mostrar UUID largos en las tarjetas salvo que se abra información técnica. Para títulos repetidos, distinguir por fecha, responsable autorizado y referencia corta.

Ejemplo de contrato conceptual:

```text
answer: texto validado en español
facts: [{ text, sourceRefs[] }]
suggestions: [{ text, basis: inference | product_help }]
sources: [{ alias, objectType, objectId, version, retrievedAt, internalHref }]
proposal: null | { proposalId, summary, validationIssues[] }
completeness: complete | partial | unavailable
```

El JSON estructurado facilita validación, no garantiza veracidad. Para conteos, estado, fecha, responsable y resultado de escritura, preferir tarjetas renderizadas desde datos tipados del servidor; el modelo redacta la explicación, no altera esos valores.

SSE puede mostrar «Consultando agenda», «Preparando propuesta» y «Validando fuentes». Para evitar filtrar contenido no validado, retener el texto sensible hasta validar estructura y acceso; no retransmitir tokens crudos del proveedor como HTML. Sanitizar Markdown, sin HTML activo, imágenes remotas automáticas ni enlaces inventados. La operación termina únicamente al recibir el evento `done`; una desconexión no significa éxito.

## 7. Escrituras seguras: contrato para F3/F4

### 7.1 Máquina de estados de la propuesta

```text
borrador → validada → pendiente de confirmación → ejecutando → ejecutada
                       │                        └→ fallida / resultado incierto
                       └→ cancelada / caducada / invalidada por cambios
```

1. El modelo propone datos; el servidor valida permisos, campos y fuentes.
2. Guardar propuesta propia con `actorId`, sesión, tipo de operación, IDs, payload canónico, versiones, hash, dependencias, fecha y caducidad. Caducidad inicial propuesta: 5 minutos para una aprobación, no para el registro de trabajo.
3. La interfaz muestra exactamente esos datos y sus diferencias. Editarlos crea otra revisión e invalida cualquier aprobación anterior.
4. El clic explícito confirma la revisión mostrada; un «sí» ambiguo en texto pide usar el botón. La IA no tiene una herramienta que simule ese clic.
5. El ejecutor revalida sesión, capacidades, acceso, estado, versión y hash dentro de la operación autorizada.
6. Ejecución y recibo deben ser atómicos. Repetir el clic o recuperar una solicitud devuelve el recibo, no duplica el cambio.
7. Responder con resultado de la base y enlaces, nunca con una frase del modelo que afirme haber guardado sin recibo.

### 7.2 Integración con transacciones existentes

No todas las RPC actuales ofrecen el mismo contrato. Crear usa clave de idempotencia; replanificar y avanzar comprueban versión; Aunor utiliza `requestId`. Mantener esas garantías y añadir el enlace de propuesta/recibo.

Proponer un wrapper transaccional `chat_execute_proposal_v1(proposalId, proposalVersion)` con JWT del usuario. No permite payload nuevo; recupera el aprobado, valida propiedad/caducidad y dispatch cerrado hacia RPC existentes en la misma transacción. Mantiene `auth.uid()` real, tiene `search_path` fijo y solo grants necesarios. Su permiso SQL no sustituye las comprobaciones internas.

El registro aprobado solo puede prepararlo el servidor técnico restringido. El usuario no puede insertar una propuesta «aprobada» por API de tablas. El wrapper realiza la confirmación explícita y consumo único de esa propuesta desde el endpoint protegido. El rol técnico del chat no recibe permiso para ejecutar mutaciones de negocio.

Prueba obligatoria: simular caída después del commit y antes de responder. La consulta de recibo debe recuperar el resultado. Si no puede acreditarse qué pasó, mostrar «Verificando resultado» y bloquear reintento ciego. No renovar una clave ni reemplazar `expectedVersion` por la última para forzar éxito.

### 7.3 Mapa de operaciones futuras

| Operación | Integración de negocio existente | Condición adicional |
|---|---|---|
| Planificar | `plan_activity_v2` | Admin, responsable activo, clave estable por propuesta |
| Replanificar | `replan_activity_v2` | Admin, comparación de planificación y versión revisada |
| Crear propia | `create_own_activity_v2` | Operario con permiso; responsable forzado por la base |
| Actualizar ejecución | `update_execution_v1` | Responsable, versión, HTTPS, bloqueo por conversación |
| Avanzar estado | `advance_activity_v1` | Solo siguiente transición; condiciones vigentes de entrega |
| Publicación/entrega/acuerdo/sustitución | `aunor_mutate_v1` | Comando y claves exactas del código, requestId estable |

No poner en el dispatch reset, restart, baja, restauración, cuentas, permisos o erasure. Se mantienen en UI nativa. No dar por creado un nuevo evento en `audit_events` desde la respuesta del modelo: el evento de negocio lo genera su transacción; el recibo del chat enlaza con esa operación y registra origen técnico sin copiar texto sensible innecesario.

Para confirmaciones Aunor, la primera versión solo abre el flujo nativo. Cualquier futura integración visual reutiliza revisión, versión y `acknowledged` explícito; nunca decide por el usuario que vio el material ni aprueba pagos.

## 8. Privacidad, memoria y ciclo de vida

### 8.1 Qué sale hacia OpenRouter

Solo el fragmento necesario: pregunta actual, instrucciones mínimas, contexto reciente revalidado y resultados autorizados reducidos. Sustituir identificadores internos por alias cuando sea posible. No enviar tokens, claves, contraseñas, correo de acceso, historial completo de cuentas, dumps o documentos sin consentimiento. No cargar automáticamente todo el repositorio ni toda la base.

Antes del piloto real, Marco aprueba categorías de datos y endpoints concretos. Recomendación: `provider.zdr=true`, `data_collection="deny"`, proveedores permitidos explícitos y `require_parameters=true`; no rebajar privacidad si no hay un endpoint disponible. Mantener desactivados plugins de búsqueda, OCR de terceros y almacenamiento de prompts opcional hasta revisión independiente. ZDR del enrutamiento de inferencia no cubre automáticamente otros plugins. [ZDR](https://openrouter.ai/docs/guides/features/zdr), [política de datos](https://openrouter.ai/docs/guides/privacy/data-collection).

No afirmar que ZDR equivale a inexistencia de metadatos, cachés o cualquier obligación de retención. Verificar condiciones del endpoint y de las categorías de datos; nunca elegir jurisdicción o tratamiento de información de clientes por defecto sin aprobación.

El consentimiento de un Admin no sustituye los permisos que correspondan sobre información de clientes o terceros. Mientras no se confirme que puede compartirse, la evaluación utiliza datos sintéticos o anonimizados de forma revisada, no una copia de producción con nombres parcialmente ocultos.

### 8.2 Almacenamiento mínimo propuesto

No se crean estas tablas en esta tarea. Prefijo y nombres sujetos a revisión de migración.

| Entidad privada | Contenido mínimo | Etapa |
|---|---|---|
| `chat_budget_state` | Tope del piloto, gasto conciliado, reservas, ventanas de límite y desactivación | F0 técnica |
| `chat_usage` | Solicitud, intento, actor protegido, estado, reserva, coste real, modelo/endpoint y recibo del proveedor | F0 técnica |
| `chat_threads` | Propietario, sesión/rol de origen, versión de política, fechas, cierre | F1 |
| `chat_entries` | Texto canónico limitado, tipo, estado; sin cadenas internas de razonamiento | F1 |
| `chat_source_dependencies` | Relaciones normalizadas entrada/propuesta ↔ actividad/publicación/entrega/acuerdo/archivo | F1 |
| `chat_proposals` | Campos revisados, versiones/hash, estado y caducidad | F3; borradores F1 pueden ser entradas tipadas |
| `chat_operation_receipts` | Propuesta única, resultado y vínculos a registros creados/modificados | F3 |

No acceso directo de `anon`/`authenticated` a tablas de control; funciones privadas restringidas y endpoints que comprueban propiedad. El servidor es autoritativo de roles de mensajes y resultados. No usar variables de módulo o memoria de una sola instancia como contador global o almacenamiento duradero en serverless.

Propuesta de retención pendiente de aprobación: conversación de piloto vinculada a sesión, recuperable solo durante esa sesión y hasta 24 horas de almacenamiento; no un archivo permanente. Recepción de nuevas entradas limitada a 200 KiB por conversación y 20 entradas recientes para contexto, además del límite de tokens. Si se necesita un borrador de trabajo durable, guardarlo expresamente en el flujo aprobado, no depender de una conversación efímera.

Ninguna limpieza automática de contenido real se habilita sin aprobación de esta política. Si no se aprueba retención, no activar historial persistente con datos reales. Metadatos de uso pueden proponerse por 90 días; el total acumulado del piloto no se reinicia al borrar historial. Los recibos de cambios sobre trabajo real se conservan mientras sean necesarios para su trazabilidad y se incluyen en el flujo explícito de eliminación correspondiente.

### 8.3 Revalidación y eliminación

- Al recuperar conversación o construir contexto, comprobar que la cuenta mantiene rol/sesión y acceso a **todas** las fuentes de cada entrada. Si no, ocultar esa entrada, invalidar resúmenes derivados y no enviarla al modelo.
- Un cambio de rol invalida el hilo completo para reutilización automática. Una reasignación, baja, modificación de publicación o versión requiere revisar los derivados afectados.
- No usar caché global de respuestas privadas. No persistir chat ni JWT en `localStorage`; limpiar estado en logout y no permitir que un service worker almacene respuestas privadas.
- Las dependencias se registran para mensajes, borradores y resúmenes completos, no solo para las citas visibles: una síntesis también contiene datos derivados.
- Integrar esas relaciones en la vista previa y ejecución de erasure. Una FK o un UUID dentro de JSON no basta. El algoritmo actual busca algunos derivados de forma específica y requiere ampliación controlada.
- Una respuesta que mezcla fuentes puede necesitar eliminarse entera al borrar una fuente. Nunca eliminar otra actividad para «limpiar» el chat. Los agregados anónimos de gasto no deben conservar datos de trabajo o identidad y deben impedir recuperar presupuesto mediante borrado de cuenta.
- Contenido ya entregado a un usuario o proveedor no puede «desverse». No prometer borrado de archivos enlazados, respaldos externos o sistemas de terceros fuera del alcance autorizado.

Cuenta Aunor compartida: optar inicialmente por conversación de sesión, sin prometer identidad personal. Si se exige historial privado por persona o atribución individual, aprobar primero cuentas individuales y su cambio de producto.

### 8.4 Tamaño de la base

No guardar imágenes/base64 ni vídeos en PostgreSQL. Con 7 personas, 10 turnos diarios y 20 días son 1.400 turnos: a 8 KiB de texto/metadatos por turno serían aproximadamente 11 MiB antes de índices, versiones y otros gastos. Es un ejemplo, no una medición del consumo real.

Proponer techo de almacenamiento de chat de 20 MiB para el piloto y alertas al 50/75/90%. Medir tablas e índices, no únicamente longitud del texto. Si se llega al techo, detener nuevas conversaciones persistentes y ofrecer ayuda sin IA; no purgar trabajo real. El presupuesto de almacenamiento se valida contra espacio realmente disponible antes de activar.

Revisar también backups y logs de la nueva capa: no prometer que el plazo de retención de una tabla borra inmediatamente copias externas. La documentación al usuario debe distinguir contenido activo, metadatos y respaldos, sin cambiar los destinos de respaldo existentes durante la implementación del chat.

## 9. Imágenes y PDF sin abrir una nueva vía de riesgo

F1 comienza con texto e imágenes estáticas JPEG/PNG/WebP. PDF se incorpora en F1b: extracción local de texto o render de páginas seleccionadas dentro de un componente aislado, preservando número de página. No ejecutar scripts del PDF, macros, archivos embebidos o vínculos. Un PDF escaneado necesita visión; extraer una cadena vacía no significa que no tenga actividades.

Límites iniciales propuestos: una imagen por extracción, hasta 2 MiB binarios y 4 megapíxeles decodificados; payload serializado total menor de 3,5 MB. Para PDF, hasta 5 páginas seleccionadas, respetando los mismos límites por solicitud y sin procesamiento masivo automático. Archivos cifrados, dañados o fuera de límites se rechazan con una alternativa de copiar texto/seleccionar páginas.

Validar firma/MIME real, dimensiones, tamaño descomprimido, orientación y límites de procesamiento tanto como permita la plataforma. Quitar metadatos innecesarios. La vista previa muestra qué se enviará; si reducir resolución vuelve ilegible el texto, pedir recorte o mejor imagen en lugar de inventar.

No descargar URLs arbitrarias aportadas por el modelo o el usuario: bloquea por diseño SSRF, acceso a redes privadas y seguimiento de enlaces de documentos. Para el piloto, el archivo se transmite durante la solicitud y no se conserva en Storage. La base puede conservar un hash y la transcripción aprobada según retención, no los bytes. Una futura carga temporal a Storage requiere bucket privado, autorización, caducidad y política aprobada de borrado.

El límite de payload de funciones Vercel es 4,5 MB; base64 aumenta el tamaño y los archivos no deben enviarse como si el límite fuera solo el binario original. [Límites de funciones](https://vercel.com/docs/functions/limitations).

Procesamiento de imágenes mediante el modelo solo si puede establecerse un coste máximo por dimensiones/páginas/modalidad/endpoint. Si no existe una cota verificable, bloquear el envío bajo el presupuesto estricto y ofrecer texto. Desactivar OCR/plugins automáticos de pago: no inferir que están incluidos en la tarifa por tokens. [Entradas PDF de OpenRouter](https://openrouter.ai/docs/guides/overview/multimodal/pdfs).

## 10. Modelos y presupuesto de OpenRouter

### 10.1 Comparación pública, no benchmark

Catálogo consultado el 14/09/2026. Tarifas base de texto en US$ por millón de tokens, sin asumir descuento por caché ni franjas promocionales. Se conserva el JSON con precios adicionales y parámetros anunciados. No se usó una clave de Marco ni el endpoint de inferencia.

| Modelo / ID | Entrada | Salida | Imágenes anunciadas | Papel propuesto |
|---|---:|---:|---|---|
| `google/gemini-2.5-flash-lite` | 0,10 | 0,40 | Sí | Línea base económica para consultas y extracción sencilla |
| `qwen/qwen3.8-flash` | 0,15 | 0,47 | Sí | Contrincante económico actual para evaluar español, tablas y herramientas |
| `google/gemini-3.1-flash-lite` | 0,25 | 1,50 | Sí | Candidato adicional si mejora la extracción/fiabilidad de forma medida |
| `deepseek/deepseek-v4.1-flash` | 0,30 | 1,20 | Sí | Comparador de calidad; no descartarlo por ser autor del PDF original |
| `deepseek/deepseek-v3.2` | 0,269 | 0,40 | No | Referencia textual, no candidato único para imágenes |
| `google/gemini-3.8-flash` | 0,75 | 3,75 | Sí | Evaluación opcional de casos difíciles; no predeterminado del piloto |

Todos anuncian herramientas y salidas estructuradas en el catálogo del modelo; esto **no garantiza** esa combinación en cada proveedor. Ejemplo observado: ciertos endpoints de V4.1 Flash no anuncian salidas estructuradas; otros sí. Fijar modelo, endpoint permitido, parámetros y privacidad. No usar `:free`, `auto`, `:batch`, rutas experimentales ni fallback sin restricciones para esconder problemas de disponibilidad.

Fuentes: [catálogo público](https://openrouter.ai/api/v1/models), [Gemini 2.5 Flash-Lite](https://openrouter.ai/google/gemini-2.5-flash-lite), [Qwen 3.8 Flash](https://openrouter.ai/qwen/qwen3.8-flash), [DeepSeek V4.1 Flash](https://openrouter.ai/deepseek/deepseek-v4.1-flash), [Gemini 3.8 Flash](https://openrouter.ai/google/gemini-3.8-flash).

Selección propuesta: evaluar primero Gemini 2.5 Flash-Lite y Qwen 3.8 Flash con el mismo conjunto de tareas, después V4.1 Flash como comparador. Usar el más económico **que pase los criterios de seguridad y calidad**, no el más nuevo por defecto. Si ninguno pasa, mantener solo ayuda determinista/formularios hasta revisar presupuesto o alcance.

No fijar ganador hasta medir con datos sintéticos y endpoints compatibles con privacidad. El modelo no decide cambiar a uno más caro. Si falla la validación, pedir aclaración o permitir un único intento de reparación dentro del límite total; no iniciar una cadena de agentes.

### 10.2 Escenario económico reproducible

Supuesto ilustrativo: cada llamada usa 4.000 tokens de entrada y 800 de salida; cada turno necesita **dos** llamadas; 7 personas × 10 turnos/día × 20 días = 1.400 turnos. Entrada incluye instrucciones, herramientas, historial y resultados. No es una predicción de uso real ni incluye imágenes, razonamiento extra, plugins o reintentos.

`coste_llamada = (tokens_entrada × precio_entrada + tokens_salida × precio_salida) / 1.000.000`

| Modelo | Una llamada | Un turno de dos llamadas | 1.400 turnos |
|---|---:|---:|---:|
| Gemini 2.5 Flash-Lite | US$0,000720 | US$0,001440 | US$2,0160 |
| Qwen 3.8 Flash | US$0,000976 | US$0,001952 | US$2,7328 |
| Gemini 3.1 Flash-Lite | US$0,002200 | US$0,004400 | US$6,1600 |
| DeepSeek V4.1 Flash | US$0,002160 | US$0,004320 | US$6,0480 |
| DeepSeek V3.2 | US$0,001396 | US$0,002792 | US$3,9088 |
| Gemini 3.8 Flash | US$0,006000 | US$0,012000 | US$16,8000 |

Con conversaciones más largas o varios intentos, el saldo dura menos. Estos números justifican probar alternativas económicas; no justifican prometer un mes, un número de usuarios ilimitado o calidad equivalente.

### 10.3 Límites de piloto propuestos

| Control | Valor inicial |
|---|---|
| Techo total autorizado para futura activación | US$9, no renovable |
| Corte interno de nuevas reservas | US$8 incluyendo evaluación y piloto |
| Margen retenido | US$1; no se libera automáticamente |
| Subpresupuestos | Hasta US$2 para evaluación y US$6 para uso piloto |
| Límite diario compartido | US$0,75, día civil de America/Lima |
| Reserva máxima por turno ordinario | US$0,03 |
| Reserva máxima por extracción | US$0,08, solo con cota multimodal validada |
| Llamadas de modelo por turno | 3 en total, incluidos reparaciones/reintentos |
| Herramientas de lectura | 4 ejecuciones por turno; sin ciclos de escritura |
| Entrada por llamada | 12.000 tokens ordinaria; 24.000 extracción como máximo, si cabe en presupuesto |
| Salida por llamada | 1.200 tokens totales facturables; mayor extracción requiere nueva decisión |
| Concurrencia | 1 turno activo por cuenta, 2 globales |
| Frecuencia inicial | 6 turnos/minuto por cuenta; cuota diaria y global prevalecen |
| Alertas | 50%, 75%, 90% del techo interno, y bloqueo al agotarse |

Son máximos, no cantidades que el modelo deba consumir. Si una extracción excede salida, dividir en lotes revisables; no subir el límite silenciosamente. El límite de salida debe cubrir razonamiento si el endpoint lo factura: desactivarlo o fijar una cota verificable. Si el proveedor no permite acotarlo, no habilitarlo en el piloto estricto.

### 10.4 Algoritmo de presupuesto, reintentos y conciliación

1. Comprobar sesión/capacidad, límites de solicitudes, turno único y bandera de activación.
2. Resolver endpoint permitido, tarifas máximas y modalidades. Catálogo de precios cacheado de forma no sensible, con caducidad máxima propuesta de 24 horas; fallo al revalidar una tarifa necesaria → no llamar.
3. Calcular cota conservadora del input completo serializado, herramientas, salida/razonamiento y modalidad. Usar tokenizador compatible o cota documentada por bytes/overhead; no una estimación optimista de «caracteres/4». No contar descuentos hipotéticos.
4. Antes de **cada** intento, reservar en transacción y bajo lock corto: `gastado + reservas_pendientes + nueva_reserva <= min(techo_piloto, techo_diario, subpresupuesto)` considerando cada saldo por separado. Comparar importes con decimal de precisión fija, no flotantes.
5. Escribir intento `reserved`/`dispatched` antes del envío. El actor del navegador no puede cambiar precio, coste, estado ni reserva. No mantener el lock durante la inferencia.
6. Configurar `provider.only`, `allow_fallbacks=false`, `require_parameters=true`, ZDR y `max_price` acordes al endpoint. Restringir entradas y salida; ningún plugin de coste adicional. Si no hay endpoint compatible, informar indisponibilidad.
7. Conciliar con `usage.cost`, tokens e identificador de generación. Guardar recibo y liberar solo la diferencia confirmada. [Contabilidad de OpenRouter](https://openrouter.ai/docs/cookbook/administration/usage-accounting).
8. En timeout, desconexión o coste desconocido, conservar toda la reserva y consultar el recibo cuando sea posible. Una reserva vencida no se libera automáticamente si la llamada pudo haber salido. Cancelar no garantiza coste cero.
9. Un segundo intento requiere otra reserva y consume uno de los 3 intentos; no asumir que el primero fallido fue gratuito. Si no se sabe su resultado, no reintentar ciegamente.
10. Si el coste informado supera la reserva, activar corte de emergencia, usar el margen y detener inferencias hasta corregir la cota. El hard cap es una condición a demostrar antes de habilitar un endpoint, no una promesa basada en multiplicar promedios.

Recomendación adicional: clave dedicada del piloto con límite total de US$9 y sin reinicio automático (`limit_reset=null`), creada por el propietario cuando apruebe activación. La documentación de OpenRouter permite límites y control de claves; no debe ser la única defensa ante concurrencia. No guardar una clave de administración de OpenRouter en el runtime del chat. [Gestión oficial de claves](https://openrouter.ai/docs/guides/overview/auth/management-api-keys).

Verificar manualmente que no hay recarga automática, que esa clave no la usan otras aplicaciones y que otras claves no consumen el saldo compartido que se pretende reservar. Este plan no cambia esos ajustes. Si el saldo cae por uso externo, el asistente puede detenerse antes; nunca usa otra clave, BYOK o cobro alternativo para continuar.

## 11. Vercel Hobby, rendimiento y degradación

### 11.1 Viabilidad técnica no equivale a permiso comercial

Hobby incluye actualmente 4 horas de CPU activa, 360 GB-hora de memoria aprovisionada y un millón de invocaciones de funciones. Son cuotas compartidas con el resto del proyecto/cuenta, no recursos reservados al chat. Superarlas puede restringir el servicio; Hobby no se convierte automáticamente en un plan de pago. Verificar los valores vigentes al implementar. [Plan Hobby](https://vercel.com/docs/plans/hobby).

Vercel limita Hobby a uso personal no comercial. La gestión descrita de trabajo real para clientes parece comercial y requiere resolver esa condición, aunque solo entren siete personas. Opciones a decidir: un plan de Vercel que lo permita, otro alojamiento compatible tras estudiar la migración, o desarrollo local/entorno de pruebas autorizado mientras se decide. **No recomendar continuar comercialmente en Hobby como solución definitiva.** [Condiciones de uso](https://vercel.com/docs/limits/fair-use-guidelines).

Mover únicamente el gateway a Supabase no corrige el permiso de uso del frontend en Vercel. Tampoco elimina cuotas: las Edge Functions tienen sus propios límites. [Límites de Supabase Functions](https://supabase.com/docs/guides/functions/limits). No se propone contratar nada durante la planificación.

### 11.2 Diseño para no perjudicar la plataforma

- Chat cerrado: ningún request de inferencia, lectura de workspace ni descarga de librerías de PDF/visión. Carga diferida al abrir y precarga solo por intención si una medición la justifica.
- No volver a descargar todo Aunor con cada turno. Consultas por objeto/intervalo, campos explícitos y presupuesto de filas.
- No sondeos continuos, tareas programadas ni inferencias automáticas al visitar páginas. Resúmenes bajo petición.
- Respuestas y conversaciones privadas con `Cache-Control: private, no-store`; nada en caché CDN compartida. Solo documentación pública y metadatos de modelos pueden cachearse globalmente.
- Plazo de aplicación propuesto: 45 segundos por turno normal, 60 por extracción, compatible con el runtime realmente configurado. Abortar tareas posteriores al plazo y contabilizar solicitudes ya enviadas.
- SSE sobre HTTP para progreso; sin servidor WebSocket persistente ni trabajos ilimitados en segundo plano.
- Las esperas al proveedor no equivalen a CPU activa, pero la memoria puede seguir ocupada. No vender streaming como consumo nulo. [Uso y cómputo de Vercel](https://vercel.com/docs/functions/usage-and-pricing).
- Medir desde Perú: apertura del panel, validación/auth, consulta DB, cola, modelo, validación de salida y tiempo hasta respuesta útil. Distinguir indicador de carga de dato realmente disponible.

Ejemplo de escala, no medición: 1.400 turnos con 15 segundos de función a 2 GiB serían aproximadamente 11,7 GiB-hora sin compartir instancias. El consumo real depende de concurrencia, memoria configurada, extracciones y resto de la plataforma. No sirve para garantizar que siete personas nunca agotarán cuotas.

### 11.3 Estados de fallo y alternativa útil

| Situación | Comportamiento |
|---|---|
| Sin datos | Mensaje específico con fecha/alcance, no inventar tareas |
| Permiso/sesión inválido | Detener, no consultar proveedor ni devolver contexto antiguo |
| Modelo indisponible / 429 / timeout | Mensaje claro, contador conciliado y búsqueda/formulario nativo |
| Presupuesto agotado | Deshabilitar inferencia; mantener toda la plataforma operativa |
| Datos parciales | Indicar límite/cursor o error; no declarar total completo |
| Propuesta conflictiva | Nueva revisión, sin guardar ni sobreescribir cambios del equipo |
| Fallo del chat | Aislamiento mediante error boundary; no bloquear Aunor, Histórico o actividades |

## 12. Diseño de interfaz y accesibilidad

No rediseñar navegación, Histórico ni fichas. Reutilizar [Button](../frontend/components/button.tsx), [FormField](../frontend/components/form-field.tsx), [StatusPill](../frontend/components/status-pill.tsx) y el shell vigente. Colores actuales: noche `#021326`, cian `#11B7C9`, lima `#84D600`, tinta `#10233F`, superficie `#F4F7F8`; En proceso `#2563EB` con texto blanco. No convertir cada burbuja en una tarjeta saturada.

Escritorio: entrada discreta «Asistente IA», panel superpuesto de aproximadamente 420–480 px con ancho limitado al viewport. Si coincide con detalle lateral del Histórico, no comprimir ambos: mantener el contexto detrás y permitir cerrar/volver. Abrir una fuente conserva filtros, fecha seleccionada y desplazamiento; no duplicar la navegación principal.

Móvil: diálogo casi a pantalla completa con cierre visible, entrada sobre teclado virtual, áreas seguras y sin tapar controles de la plataforma cuando está cerrado. Adjuntar solo desde la fase correspondiente, con aviso de procesamiento externo.

Contenido inicial por rol: hasta tres accesos rápidos («Mi agenda de hoy», «Pendientes», «Preparar cronograma» cuando proceda). Respuestas breves y fuentes plegables. Borradores con tarjetas de revisión y diferencias, no bloques extensos de JSON. Botón lima reservado a la acción explícita de guardar/confirmar cuando exista; «Enviar pregunta» no debe confundirse con «Crear actividad».

Teclado: foco inicial correcto, retorno al disparador al cerrar, Escape, gestión de foco del diálogo, estados de carga anunciados sin leer cada token, etiquetas de botones y errores vinculados. «En proceso» no se distingue solo por color. Objetivo de pruebas: 390, 768, 1366 y 1920 px, zoom 200% y lector de pantalla. Son criterios del nuevo componente, no certificación de accesibilidad de toda la plataforma.

No generar ni aplicar nuevas maquetas a la aplicación durante esta fase documental. La aprobación visual forma parte de F1 antes de integrar.

## 13. Backlog y puntos de integración futuros

Los nombres de archivos/rutas siguientes son orientativos. No existen por efecto de este plan.

| Paquete de trabajo | Ubicación propuesta / existente | Resultado verificable |
|---|---|---|
| Contratos de chat | Núcleo reusable privado: schemas, policy, orchestration, provider | Sin dependencias de React ni IDs/secretos de DA VINCI |
| Adaptador del producto | Futuro `frontend/lib/chat/server/` | Proyecciones y acciones acotadas bajo identidad real |
| Puente HTTP | Futuro `frontend/app/api/chat/` | Sesión, CSRF, límites, control de solicitudes y SSE |
| UI | Futuro `frontend/components/chat/` y punto del shell autorizado | Carga diferida y diseño aprobado, sin alterar pantallas existentes |
| Contexto y consumo | Nueva migración privada bajo `supabase/migrations/` | Rol restringido, funciones de control y presupuesto atómico |
| Fuentes e historial | Migración privada y adaptador de acceso | Propiedad, dependencias, revalidación y retención aprobada |
| Propuestas/recibos | Migración posterior y wrapper transaccional | Ninguna escritura sin aprobación exacta |
| Erasure de derivados | Ampliación explícita del manifest/preview existentes | Eliminar datos de chat relacionados sin afectar otros trabajos |
| Pruebas | Tests de núcleo, `frontend/__tests__/`, e2e e integración UUID | Seguridad, coste, UX y regresión reproducibles |
| Observabilidad | Métricas estructuradas sin prompts sensibles | Diagnóstico por requestId y panel de gasto para propietario |

No invocar una Server Action como si fuera una API genérica de agente sin revisar su contexto. Extraer helpers comunes solo si evita duplicar validaciones y mantiene intacto el comportamiento existente. Tipos de base regenerados únicamente cuando se implementen migraciones aprobadas.

Dependencias nuevas propuestas: ninguna hasta decidir paquete de validación/runtime y lector PDF. Preferir fetch nativo y contratos simples; evaluar tamaño, licencia y mantenimiento antes de añadir SDK. No crear una dependencia de un servicio de observabilidad pagado para obtener métricas básicas.

## 14. Fases y puertas de aceptación

| Fase | Entregable | Puerta para avanzar |
|---|---|---|
| F0 — Decisiones y fundamento | Arquitectura aprobada, amenazas, permisos, presupuesto y pruebas con proveedor simulado | Alojamiento/privacidad/retención resueltos para cualquier piloto real; cero bypass |
| F0b — Evaluación de modelos | Conjunto sintético y comparación de 2–3 candidatos con hasta US$2 | Autorización expresa para gastar; controles de consumo ya probados |
| F1 — Admin lectura y borradores | Agenda, búsqueda, pendientes, texto/imágenes y UI diferida | Datos con fuentes, ninguna escritura de negocio, calidad y diseño aprobados |
| F1b — PDF acotado | Extracción de páginas y revisión editable | Límites, privacidad y coste multimodal demostrados; si no, queda fuera |
| F2 — Equipo lector | Operario propio y Aunor publicado; enlaces de revisión nativa | Matriz de aislamiento y revalidación de memoria completa |
| F3 — Planificación confirmada | Crear/replanificar Admin con propuesta y recibo | Concurrencia, idempotencia, conflictos y recuperación de commit probados |
| F4 — Acciones adicionales | Ejecución Operario y publicación Aunor, por comando aprobado | Pruebas de cada RPC/rol y confirmaciones visuales; no aprobación global implícita |
| F5 — Opcionales | Voz, documentos autorizados o integraciones | Nueva decisión de alcance, privacidad, coste y operación |

No comprometer calendario fijo antes de F0. Construir y probar una fase completa antes de acumular herramientas. Tener un modelo que responde texto no cumple F1; tener el botón de confirmar no cumple F3.

### 14.1 Conjunto de evaluación

Propuesta de 60 casos sintéticos versionados, con respuestas/acciones esperadas por código o revisión humana:

- 12 de consultas, conteos, fechas de Lima, rangos discontinuos y cambio de año.
- 12 de permisos y revocaciones entre Admin, Operarios distintos, Aunor y perfiles inactivos/temporales.
- 10 de cronogramas: nombres similares, fechas incompletas, turnos ambiguos, texto pequeño y PDF escaneado.
- 8 de prompt injection en textos, documentos y resultados; roles/confirmaciones falsificados.
- 10 de escrituras simuladas: conflicto, doble clic, propuesta caducada y caída después de commit.
- 8 de límites, coste, reconexión, proveedor fallido y accesibilidad/error del componente.

No todos necesitan una llamada de modelo: permisos, presupuesto y transacciones se prueban principalmente de forma determinista. Seleccionar 20 casos representativos por candidato para la primera comparación; dos repeticiones, misma configuración, coste máximo reservado y parada al alcanzar el subpresupuesto. Conservar IDs de modelo/endpoint y tarifas de esa ejecución.

Una sola cuenta Aunor activa por base, respetando el guard vigente. Probar sesiones distintas y acceso cruzado sin desactivar el guard para facilitar fixtures. Nunca usar usuarios, actividades ni contraseñas de producción en tests.

### 14.2 Criterios medibles

| Área | Criterio antes de habilitar |
|---|---|
| Autorización | 100% de casos negativos deterministas rechazados; cero registros ajenos en respuesta, prompt, logs o caché |
| Escrituras | Cero cambios de negocio sin propuesta exacta confirmada; doble solicitud produce un solo efecto |
| Coste | Pruebas de 7 solicitudes simultáneas no exceden reserva/techo; todo intento enviado contabilizado o retenido |
| Hechos críticos | Fechas/estados/conteos/responsables del conjunto coinciden con la fuente; casos ambiguos piden aclaración |
| Extracción | >=95% de campos explícitos correctamente extraídos en el conjunto; 100% de ambigüedades críticas etiquetadas; revisión humana obligatoria |
| Calidad operativa | >=90% de tareas de consulta del conjunto resueltas sin corrección de contenido; ninguna respuesta sin fuentes presentada como dato verificado |
| Chat cerrado | Cero inferencias y cero cargas de datos por el chat; sin descarga inicial del parser PDF/model SDK |
| Regresión de carga | Comparación antes/después reproducible; objetivo <=10% de variación p95 en rutas existentes, con suficiente repetición y entorno equivalente |
| Interacción | Objetivo de apertura p95 <=200 ms una vez disponible el módulo; primera apertura medida aparte; respuesta útil textual p95 <=10 s como objetivo a validar, no garantía |
| Recuperación | Fallo de IA no bloquea trabajo nativo; cancelar no duplica ni oculta coste; resultado incierto se resuelve por recibo |
| Diseño | Sin solapamientos ni saltos del layout en 390–1920 px; foco y teclado comprobados |

Las métricas son objetivos de aceptación, **no resultados obtenidos**. Si la latencia no alcanza el objetivo, medir qué tramo falla antes de comprar servicios. Evaluar ahorro de tiempo con una tarea manual equivalente, contando revisión y correcciones; no prometer 80% por adelantado.

### 14.3 Pruebas de integración y regresión

Bases UUID desechables creadas exclusivamente por la prueba; bloqueos preventivos si la URL apunta al proyecto real o a la base local del usuario. No ejecutar scripts existentes solo por llamarse «verify»: revisar previamente sus destinos, efectos y limpieza.

Probar directamente las RPC y funciones de control con identidades distintas, no solo la UI. Incluir JSON adicional, firmas inválidas, source IDs ajenos, filtros malformados, duplicados en diferentes pestañas, cambio de responsable durante inferencia, erasure de una fuente compartida y caída del proveedor después de producir tokens facturables.

Pruebas UI con red simulada por defecto; nunca llamadas pagadas dentro de cada CI. Las comparaciones reales de modelos son manualmente autorizadas y contabilizadas. Futuro gate de código: `npm run verify`, e2e existentes y nuevos, más integración de DB desechable. **No se ejecutan esos comandos como parte de esta entrega documental.**

## 15. Operación y despliegue futuro

1. Respaldo privado verificado antes de cualquier migración remota; Git no sustituye una copia de la base. Verificar restauración en destino desechable, sin publicar dumps.
2. Migraciones aditivas con grants mínimos, revisión de referencias/erasure y tipos. No alterar registros reales para probar.
3. Banderas independientes: chat global, extracción, roles permitidos y comandos de escritura. Todas desactivadas por defecto en producción hasta aprobar cada fase.
4. Activación inicial para cuenta Admin autorizada; después grupo de prueba y Aunor solo al pasar aislamiento. La lista la define el propietario, no la IA.
5. Prueba de humo real inicialmente de solo lectura. Escrituras de ensayo únicamente en entorno desechable; las primeras escrituras reales deben ser trabajo solicitado por un usuario, no fixtures ocultos.
6. Métricas sin prompts: IDs de solicitud, tiempos por tramo, error normalizado, modelo/endpoint, coste/reserva, número de fuentes y resultado de operación. Acceso a métricas limitado; no copiar tokens de autorización ni SQL crudo a logs.
7. Corte de emergencia: deshabilitar inferencia y comandos, cerrar propuestas pendientes y conciliar intentos. Mantener recibos y trabajos creados. No hacer rollback de datos con Git ni borrar actividades para «volver al estado anterior».
8. Revisión de modelos cuando cambien tarifas/endpoint o aparezcan fallos. No ejecutar un golden set pagado semanal indefinidamente sin asignación presupuestaria.

## 16. Decisiones pendientes de Marco

| Decisión | Recomendación | Qué bloquea si falta |
|---|---|---|
| Arquitectura y separación | Núcleo reusable privado + puente mínimo del mismo origen | Implementación del host/gateway |
| Alojamiento comercial | Resolver condiciones de Hobby; no contratar automáticamente | Recomendación de despliegue comercial |
| Datos que pueden salir y endpoints | Contexto mínimo, proveedores expresamente permitidos y ZDR | Toda inferencia con datos reales |
| Gasto efectivo | Autorizar por separado F0b (hasta US$2) y piloto dentro del máximo US$9 | Cualquier llamada pagada |
| Retención y borrado de chat | Sesión/24 h de contenido, límites de tamaño y dependencias de erasure | Persistencia de conversaciones reales |
| Cuenta compartida Aunor | Empezar sin historial por persona; cambiar identidad si se requiere atribución | Promesas de privacidad individual |
| Entrada de archivos | Primero imágenes; PDF solo cuando pase límites de coste y seguridad | Extracción multimodal real |
| Escrituras | Aprobar F3 y cada grupo de F4 después de pruebas | Ejecutor de mutaciones |
| Presentación visual | Validar panel de escritorio/móvil dentro del diseño vigente | Integración visible para el equipo |

No hace falta resolver todo para revisar este documento o desarrollar contratos y tests con proveedor simulado. Sí es obligatorio resolver los bloqueos correspondientes antes de cada activación.

## 17. Fuera del primer alcance y posibles ampliaciones

1. **Dictado de instrucciones:** útil en rodaje, pero requiere permiso de micrófono, evaluación de transcripción y coste separado. No grabación continua.
2. **Documentos de ayuda/contrato autorizados:** corpus pequeño, versionado y citado. No indexar toda la base ni todos los archivos del repositorio; buscar por permisos antes de ampliar a búsqueda vectorial.
3. **Recordatorios:** empezar con un resumen bajo demanda. Notificaciones externas/scheduler necesitan consentimiento, destinatarios, frecuencia y deduplicación.
4. **Integraciones de calendario, WhatsApp o OneDrive:** nuevo proyecto de integración con permisos y tarifas revisadas; no se incluye por haber mencionado esas marcas.
5. **Planificación con horas y equipos:** requiere primero modelar horarios, duración, traslados y disponibilidad en el producto; la IA no puede resolverlo con datos ausentes.
6. **Analítica operativa:** tendencias y tiempos solo cuando existan eventos suficientes y definiciones acordadas; no puntuar o sancionar personas mediante inferencias del modelo.

## 18. Trazabilidad y cierre de esta entrega

Las secciones 5–8 resuelven H01–H04 y H06–H10 de la auditoría; §10 resuelve H05/H12; §11–§15 abordan H11/H15/H16; §3–§4 y §7 resuelven H13/H14. Los cambios de alcance y autorizaciones quedan en §16.

Respaldo previo existente: `41d6f60`, local. El PDF original se conserva sin modificar. Esta entrega añade únicamente auditoría, plan y selección pública del catálogo en `docs`. No crea claves ni consume saldo, no toca código/configuración/datos, no migra, no hace push y no despliega.

El siguiente paso permitido, cuando Marco lo solicite, será resolver las decisiones de F0 y preparar una implementación acotada con proveedor simulado. El plan no concede por sí mismo permiso para activar IA sobre datos reales.
