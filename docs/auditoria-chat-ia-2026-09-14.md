# Auditoría del plan de Chat IA — DA VINCI

Fecha: 14 de septiembre de 2026. Estado: revisión documental; no implementación.

## 1. Dictamen y alcance

El PDF contiene una base aprovechable, pero **no es una especificación ejecutable segura para el proyecto actual**. Sus principales problemas son la identidad de las operaciones, el catálogo de permisos, la confirmación de cambios y la contabilidad del consumo. Cambiar de modelo no resuelve esos problemas de arquitectura.

La recomendación es reemplazar su uso como guía de implementación por el [nuevo plan técnico](plan-chat-ia-da-vinci-2026-09-14.md), conservando el original como antecedente. No se califica al autor ni se presume que un modelo más caro produzca mejores resultados para este caso.

Material revisado:

- [PDF original](plan-chat-ia-especificacion.pdf): 23 páginas físicas; su paginación impresa no coincide, por lo que se citan sus secciones.
- Código y migraciones versionadas hasta el respaldo `41d6f60`, posterior a `078c73a`.
- Contrato de producto, contrato visual, acciones de actividades, permisos, autenticación, Histórico, proyecciones y acciones Aunor, eliminación explícita y configuración local de despliegue.
- Documentación oficial de Supabase, Vercel, OpenRouter y OWASP consultada el 14/09/2026.
- Catálogo público de modelos y metadatos de endpoints de OpenRouter, mediante GET sin credenciales y sin inferencias. Se conserva una [selección del catálogo consultado](chat-ia-modelos-openrouter-2026-09-14.json).

No se consultaron registros de producción, saldo privado, configuración privada de proveedores ni contenido de `.env.local`. No se probaron modelos ni se midió latencia de inferencia. Los hallazgos son del plan frente al repositorio: no certifican que producción tenga exactamente ese esquema desplegado.

SHA-256 del PDF original: `776EBEEBB8E67112A7F51959294968D7088390C1BE3B9E43425369C3A7FF57D5`.

## 2. Lo que sí conviene conservar

- Herramientas tipadas y limitadas, en lugar de SQL libre generado por el modelo.
- Clave del proveedor solo en servidor, separación por rol y denegación por defecto.
- Intención de exigir confirmación y registrar resultados de operaciones.
- Uso de versiones e idempotencia, aunque el detalle necesita corrección por operación.
- Evaluación con preguntas representativas, despliegue gradual y banderas de activación.
- Pruebas en bases UUID desechables, nunca usando trabajo real como fixture.
- Separación conceptual entre el núcleo del asistente y el adaptador específico de DA VINCI.

## 3. Hallazgos priorizados

**Bloqueante**: impide habilitar el flujo afectado. **Alta**: necesaria antes de un piloto con datos reales. **Media**: reduce utilidad, claridad o mantenibilidad; debe quedar resuelta en el alcance.

| ID | Gravedad | Sección del PDF | Problema | Resolución requerida |
|---|---|---|---|---|
| H01 | Bloqueante | 2.2, 6, 10.1 | Escrituras con `supabaseAdmin` como si `auth.uid()` conservara al usuario final | Credencial de usuario para negocio; separar control técnico del chat |
| H02 | Bloqueante | 2.2, 8.1, 12 | Validación de sesión contradictoria y JWT en widget | Puente del mismo origen, cookies HttpOnly y validación pasiva de sesión |
| H03 | Bloqueante | 7.2, 11 | Admin recibe operaciones exclusivas del Operario | Matriz de capacidades vinculante en servidor y base |
| H04 | Bloqueante | 8.2, 10, 11 | Confirmación conversacional sin autorización ligada al cambio exacto | Propuesta inmutable, aprobación y ejecución verificables |
| H05 | Bloqueante | 9, 10.3 | Topes sin reserva atómica ni coste pendiente | Libro de consumo, reserva antes de llamar y límites de proveedor |
| H06 | Alta | 4.6, 7.2 | Payloads Aunor incompatibles con las RPC vigentes | Adaptadores probados contra migraciones actuales |
| H07 | Alta | 7.1, 7.3 | Función inexistente y filtros/columnas incorrectos | Consultas parametrizadas y delimitadas con pruebas |
| H08 | Alta | 7.3, 11 | Reintroducción de conversación externa retirada | Excluir `aunor_messages` y comandos retirados |
| H09 | Alta | 2.3, 8, 10.2 | Confianza en mensajes/roles del cliente y texto de herramientas | Historial autoritativo del servidor y contenido externo no confiable |
| H10 | Alta | 10.4, 12.3 | Memoria sin revalidación de visibilidad ni integración de borrado | Dependencias de fuentes, invalidación y política aprobada de retención |
| H11 | Alta | 11, 14, 15 | Controles y pruebas importantes pospuestos después de escrituras | Seguridad, consumo y pruebas negativas desde la primera fase |
| H12 | Alta | 2, 9, 18 | Infraestructura y presupuesto tratados como disponibles | Decisiones explícitas de alojamiento, privacidad y gasto |
| H13 | Media | 7, 11, 16 | Operario ausente; utilidad diaria poco desarrollada | Agenda propia, borradores, pendientes y cronogramas |
| H14 | Alta | 7.2, 11 | Reset antiguo y reinicio nuevo ofrecidos juntos; reintentos ambiguos | Un solo flujo de producto y recibos transaccionales |
| H15 | Media | 12, 13 | Widget desacoplado sin resolver diseño, foco y coste de carga | Panel nativo diferido, núcleo reusable y pruebas visuales |
| H16 | Media | 14.4, 16 | Mejoras porcentuales sin línea base y cronogramas sin contrato de extracción | Métricas observables, conjunto de evaluación y datos faltantes explícitos |

## 4. Evidencias y correcciones

### H01. Identidad y privilegios

El paso 8 de §2.2 dice que las escrituras Admin usarán `supabaseAdmin` y pasarán `auth.uid()` como actor; §6 vuelve a justificarlo porque las RPC leen `auth.uid()`. Son cosas diferentes: una credencial de servicio no representa por sí sola al Admin que conversa.

Las acciones actuales crean un cliente de servidor con la sesión del usuario. Además, [restart_activity_v2](../supabase/migrations/202609110003_restart_activity.sql) revoca ejecución a `service_role` y la concede a `authenticated` (líneas 34–35). La definición inicial de [aunor_mutate_v1](../supabase/migrations/202609060002_aunor_space.sql) sigue esa separación (líneas 841–842).

Corrección: las consultas y mutaciones de negocio deben ejecutarse bajo la identidad autenticada real. El modelo no recibe credenciales ni elige actor. El almacenamiento y consumo del chat necesitan un acceso técnico restringido, no una credencial con control sobre toda la plataforma. Supabase distingue expresamente permisos de objeto, RLS y credenciales que la omiten. [Referencia oficial](https://supabase.com/docs/guides/database/postgres/row-level-security).

Prueba de cierre: Admin no puede ejecutar avances exclusivos del Operario; un JWT ajeno o expirado no puede leer ni mutar; ningún secreto de servicio aparece en cliente o contexto del modelo.

### H02. Sesión y widget

§2.2 pretende llamar a `private.has_active_app_session()` vía RPC, mientras §6 reconoce que estos helpers privados no están expuestos. §8.1 sustituye esa comprobación por `register_app_session()`, que es una operación de registro, no una consulta pasiva.

La [migración de seguridad de cuentas](../supabase/migrations/202609100001_account_safety.sql), desde la línea 67, muestra que ese registro inserta en `app_sessions` y termina con `on conflict do nothing`: no es un comprobador inequívoco de vigencia de una sesión existente. La [configuración de cookies](../frontend/lib/supabase/cookie-options.ts) fija HttpOnly y describe el límite absoluto de sesión de 12 horas.

Corrección: no extraer JWT a atributos HTML ni cambiar cookies para acomodar el widget. Usar un endpoint del mismo origen y una comprobación pasiva de sesión antes de cualquier llamada cobrada, incluso para redactar un borrador sin consultar actividades. Si se añade una RPC de contexto, será nueva, mínima y probada; no se afirma que ya exista.

### H03. Facultades del Admin y del Operario

§7.2 asigna `advance_activity_v1` y `update_execution_v1` al Admin; §11 lo incluye en la segunda fase. Las [acciones de actividades](../frontend/app/actividades/actions.ts), líneas 181–237, las restringen a Operario. La base comprueba además responsabilidad, versión y condiciones del proceso.

Admin planifica, reasigna y restablece; no sustituye al responsable para entregar el trabajo. La IA no amplía esos permisos. Si se quisiera cambiar la regla de producto, necesitaría una decisión independiente; no forma parte de este plan.

### H04. Confirmación y concurrencia

Esperar «Sí» o «Confirmo» en el prompt no demuestra aprobación sobre una propuesta concreta. El riesgo aumenta si, como sugiere §11, se consulta la versión más reciente justo antes de mutar y se usa en lugar de la que el usuario revisó.

Corrección: el servidor guarda actor, sesión, operación, contenido canónico, versión esperada, alcance y caducidad. El botón confirma esa propuesta. Cambiar responsable, fecha, texto o versión invalida la aprobación. Ante conflicto, se muestra una nueva comparación; no se reintenta con la versión actual a escondidas. El modelo no puede llamar a «aprobar» ni «ejecutar».

La autorización debe aplicarse fuera del modelo, con funciones y privilegios mínimos. [OWASP: exceso de autonomía](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).

### H05. Presupuesto real

§9 propone US$5 diarios, US$50 mensuales, 50.000 tokens por solicitud y un control basado en el gasto ya registrado. Esto no respeta el techo inicial de US$9 ni cubre llamadas simultáneas, respuestas cortadas o reintentos que sí se cobran.

Corrección: reservar en una transacción el coste máximo antes de cada llamada; limitar entrada, salida, razonamiento, rondas y proveedor. Mantener el importe reservado si falta el recibo, en vez de asumir coste cero. El usuario del chat no puede liquidar su propio consumo. El plan incorpora un corte interno a US$8 y US$1 de margen, dentro del máximo total de US$9, pendiente de activación expresa.

El catálogo público permite estimar; no equivale a una cotización garantizada de todos los endpoints. Los endpoints revisados de DeepSeek V4.1 Flash difieren en precio y soporte de salidas estructuradas. El modelo lógico no basta: se debe seleccionar y verificar también el proveedor. [Enrutamiento oficial](https://openrouter.ai/docs/guides/routing/provider-selection).

### H06. Contratos Aunor

La versión vigente de [aunor_mutate_v1](../supabase/migrations/202609080001_retire_burson_external_chat.sql), líneas 331–346, valida nombres exactos y rechaza claves desconocidas. El PDF no puede usarse como copia de esas firmas.

| Comando | Claves aceptadas por la implementación revisada |
|---|---|
| `publish` | `expectedVersion`, `summary`, `serviceId`, `notPerformedReason` |
| `delivery` | `expectedActivityVersion`, `label` |
| `agreement` | `channel`, `contactedAt`, `requesterDeclared`, `body`, `evidenceLink`, `correctsId` |
| `replacement` | `substituteId`, `agreementId`, `reason`, `evidenceNote`, `evidenceLink`, `correctsId` |
| `confirm-delivery` | `objectId`, `version`, `acknowledged` |
| `confirm-replacement` | `objectId`, `acknowledged` |

Esta tabla enumera claves permitidas, no afirma que todas sean obligatorias. La publicación de entrega toma el enlace vigente de la actividad: el modelo no puede sustituirlo por una URL que invente. Confirmar material debe conservar la revisión explícita y el aviso de que no supone aprobación económica.

### H07. Consultas que no se pueden copiar literalmente

- `list_supabase_historical_activities` no aparece como RPC en las migraciones. Existe [listSupabaseHistoricalActivities](../frontend/lib/supabase/historical.ts), una función TypeScript que maneja solapamiento de jornadas, paginación y estabilidad de versiones.
- Reemplazos usan `original_activity_id` y `substitute_activity_id`; no un `activity_id` genérico. Lo confirma el [lector Aunor](../frontend/lib/supabase/aunor.ts).
- Filtros de fechas deben operar sobre jornadas, no sobre una columna supuesta. Para incluir una fecha se necesita `start_date <= fecha` y `end_date >= fecha`.
- Los ejemplos de nulos y filtros dinámicos deben traducirse a las operaciones correctas del cliente y validar cada argumento. No pasar expresiones PostgREST ni fragmentos de SQL suministrados por el modelo.

No conviene reutilizar sin más lectores que recuperan todas las filas: el asistente requiere proyecciones pequeñas y paginadas. Reutilizar reglas de negocio no significa enviar toda la respuesta existente al proveedor.

### H08. Conversación externa retirada

§7.3 y §11 proponen `my_messages`. La [migración de retirada](../supabase/migrations/202609080001_retire_burson_external_chat.sql) revoca acceso a `public.aunor_messages` (línea 276) y rechaza `message`/`read` (línea 316). [canMutateAunor](../frontend/lib/aunor.ts) también los excluye.

El nuevo asistente es un canal de ayuda, no la restauración de la conversación externa ni del rol Burson. Las conversaciones internas Admin–Operario son otro recurso, con permisos propios.

### H09. Cliente, fuentes e inyección

El contrato permite que el navegador mande mensajes con roles `system`, `tool` y resultados de herramientas. Aunque puede ser parte de una API genérica, aceptarlos como historial auténtico permitiría fingir una autorización o un dato consultado.

Corrección: aceptar solo el texto actual, identificadores opacos de conversación/adjunto y contexto de navegación validado. El servidor construye instrucciones e historial. Descripciones, mensajes, imágenes y PDF son datos no confiables; envolverlos en JSON no los vuelve seguros. El modelo no recibe herramientas de red, SQL, credenciales, cuentas ni destrucción.

### H10. Historial y datos reales

Guardar la conversación en `localStorage` como respaldo no resuelve el aislamiento en equipos compartidos. Una respuesta antigua puede conservar datos que el usuario ya no debe ver por cambio de rol, reasignación, baja o eliminación definitiva.

Además, la [eliminación explícita](../supabase/migrations/202609110004_explicit_erasure.sql) recorre relaciones y trata ciertos JSON existentes de forma específica. Añadir texto, resúmenes o UUID dentro de un nuevo JSON de chat **no garantiza** que el borrado actual lo alcance.

Corrección: dependencias normalizadas de todas las fuentes usadas por cada respuesta, borrador y resumen; invalidación de acceso y tratamiento explícito de derivados en el flujo de borrado. Si una respuesta mezcla datos de varios trabajos, puede ser necesario retirar toda esa respuesta. No borrar otros trabajos por una cascada mal diseñada. La retención propuesta para el chat requiere aprobación antes de activarse; no implica limpiar registros reales actuales.

La cuenta Aunor es única en el modelo vigente. Una cuenta compartida no permite privacidad ni atribución por persona. No prometer historial individual sin cambiar la identidad del producto.

### H11. Orden de seguridad y pruebas

§11 deja rate limiting, varias pruebas y transparencia de fuentes para una fase posterior a las escrituras. Deben existir antes de abrir el primer piloto, no añadirse después de que opere sobre información real.

Hay que probar límites concurrentes, sesión revocada, fuente retirada, propuestas caducadas, repetición de clics y respuestas incompletas. El conjunto de permisos debe respetar el guard de cuenta Aunor única: probar identidades y sesiones distintas sin crear dos cuentas Aunor activas simultáneas contra ese contrato.

### H12. Alojamiento, proveedores y autorización

El crédito de OpenRouter es independiente de los recursos de Vercel y Supabase. Marco declara más de US$9; no se verificó el saldo ni se autorizó gastarlo durante esta tarea.

Vercel Hobby es gratuito, pero se limita a uso personal no comercial. El uso descrito para trabajo de clientes requiere resolver esa condición antes de recomendar continuidad comercial en Hobby. Siete usuarios no constituyen una excepción. Exceder cuotas puede restringir el servicio, no comprar automáticamente un plan superior. [Hobby](https://vercel.com/docs/plans/hobby), [uso permitido](https://vercel.com/docs/limits/fair-use-guidelines).

Un gateway en Supabase no resuelve por sí solo la condición comercial del frontend alojado en Vercel. Tampoco hace gratuitas las consultas al modelo. La propuesta de privacidad debe verificar el endpoint real, no solo la marca del modelo. [Retención de proveedores](https://openrouter.ai/docs/guides/features/zdr).

### H13–H16. Utilidad, reinicio, experiencia y medición

- El primer beneficio debe medirse sobre cronogramas, búsquedas, pendientes y preparación de publicaciones, no sobre la cantidad de herramientas del catálogo.
- [Restablecer](../frontend/app/actividades/actions.ts), línea 239, usa `restart_activity_v2`: crea una actividad limpia y manda la anterior a Papelera. No exponer también el reset antiguo como alternativa equivalente. En el alcance propuesto, el asistente remite a la pantalla nativa para esa operación.
- No asumir idempotencia idéntica en todas las RPC. Crear tiene clave; replanificar/avanzar usa versión; Aunor usa `requestId` y comprobaciones propias. Una confirmación de chat necesita su recibo transaccional adicional.
- El [contrato visual vigente](../diseno/direccion-final-traducida/CONTRATO-VISUAL.md) sustituye al antiguo `sistema-diseno.md`. El panel no debe competir con el lateral del Histórico, ni recuperar siete estados históricos ni la marca anterior. La marca actual solicitada es DA VINCI.
- El contrato de producto anterior fijaba chat separado y primer alcance Admin/solo lectura. El nuevo plan propone una revisión documental de ese alcance; integrar un puente en el repositorio es una decisión futura explícita, no un cambio ya autorizado a la aplicación.
- Horarios, duración y equipos no son entidades estructuradas actuales. Una imagen puede contenerlos, pero deben quedar como indicaciones verificables, no convertirse en conflictos horarios o reservas de equipo ficticias.
- `safeMaterialUrl` en [external-link.ts](../frontend/lib/external-link.ts) acepta HTTPS sin credenciales, no solo dominios OneDrive/SharePoint. Esos enlaces son referencias: no existe autorización implícita para descargarlos, seguir redirecciones o enviar su contenido a un modelo.
- El objetivo de reducir 80% del trabajo no tiene medición inicial. Debe sustituirse por una comparación manual/asistida de tareas equivalentes, contabilizando el tiempo de corregir errores y revisar borradores.

## 5. Decisión recomendada

1. Conservar el PDF como antecedente; no copiar sus prompts, firmas o ejemplos a producción.
2. Empezar con Admin: consultas verificables y borradores, sin mutaciones automáticas.
3. Añadir Operario y Aunor después de probar aislamiento y utilidad con su información permitida.
4. Habilitar escrituras acotadas solo después de aprobar el protocolo de confirmación y pasar pruebas de concurrencia e idempotencia.
5. Resolver alojamiento comercial, proveedor/privacidad, presupuesto y retención antes del primer piloto con datos reales.

El [plan técnico](plan-chat-ia-da-vinci-2026-09-14.md) convierte estas correcciones en contratos, fases y criterios verificables. Esta auditoría no autoriza implementación, migraciones, despliegues, eliminación de datos ni consumo de créditos.
