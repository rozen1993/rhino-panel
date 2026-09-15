# Aunor: consulta integral y entregas visibles durante 72 horas

Decisión de Marco, 14/09/2026. Respaldo de código anterior a los cambios:
`591a693` (`chore: respaldo antes de convertir Aunor en consulta integral`).
Este commit respalda el código; no es un respaldo de la base de datos.

## Contrato de comportamiento

- Aunor es cliente y **solo consulta**. No administra, planifica, cambia estados,
  reinicia, confirma entregas/sustituciones ni elimina información.
- Navegación: **Actividades**, **Histórico**, **Contrato**. Se mantienen contrato,
  servicios, referencias, acuerdos y relaciones original–sustituto.
- Ve todas las actividades no dadas de baja, sin requisito de publicación manual
  ni referencia contractual. Incluye los registros heredados que conserva Admin.
- No recibe responsable, identificadores de autor/asignación, opinión del operario,
  conversaciones internas ni auditoría. No se reutiliza una sesión de Admin ni se
  ocultan estos datos solamente con CSS: la vista SQL tiene columnas explícitas.
- Título, descripción/resumen, jornadas, lugares y material son contenido visible
  para el cliente. Los textos libres y enlaces no se anonimizan automáticamente:
  el equipo no debe escribir nombres de operarios ni notas privadas en ellos.

| Estado | Actividades | Histórico / ficha / contrato |
|---|---|---|
| Programada | Sí, sin caducidad | Sí |
| En proceso | Sí, sin caducidad | Sí |
| Entregada, menos de 72 h | Sí | Sí |
| Entregada, 72 h o más | No | Sí |

El plazo es `delivered_at + 72 horas`, no tres cambios de fecha ni 72 horas desde
una edición/publicación. En el instante exacto del vencimiento sale del panel.
La selección inicial incluye **todas las fechas** para no esconder trabajos aún
abiertos de meses anteriores. El usuario puede filtrar mes/año, estado, categoría
y texto. La selección temporal no borra ni modifica nada.

Las entregas antiguas sin `delivered_at` válido se conservan en Histórico/ficha;
no se inventa una fecha usando `updated_at` ni se hace un relleno retrospectivo.
Si aparecen casos reales así, requieren revisar su evidencia antes de corregirlos.

## Implementación

- `202609140001_aunor_read_only.sql`: amplía la proyección segura a actividades
  no dadas de baja, expone fecha de entrega/enlace y bloquea las escrituras de Aunor.
  Mantiene las confirmaciones antiguas; rechaza nuevos intentos y reintentos.
- La implementación previa de la RPC queda privada y sin permisos de ejecución
  para clientes. La entrada pública exige Admin y solo acepta las cuatro
  operaciones administrativas vigentes. Las políticas de tablas internas no se
  amplían para Aunor.
- `aunor-read-scope.ts` filtra el panel antes de serializarlo desde el servidor;
  Histórico y Contrato no reciben esa caducidad. El temporizador del navegador,
  basado en la hora recibida del servidor y tiempo transcurrido, actualiza la
  pantalla al vencer una entrega sin requerir recargarla.
- `aunor-dashboard.tsx` usa tarjetas, estados, navegación mensual e iconos del
  sistema existente. No incorpora otro tema ni biblioteca visual.
- `calendar-detail-panel.tsx` es el detalle compartido con Admin. En Aunor omite
  responsable, opinión y origen interno; recibe únicamente el modelo seguro.
  Conserva selección del día actual, aviso sin actividades, listado, detalle,
  regreso al listado, foco, panel móvil y navegación anual.
- `/aunor/historico` ofrece el mismo selector Grabación/Edición y calendario de
  Admin. `/aunor/calendario` redirige conservando el año. `/historico` y las rutas
  administrativas siguen restringidas.
- Las versiones de entrega y los resúmenes contractuales administrativos siguen
  disponibles como registros opcionales; no habilitan la visibilidad del trabajo.
- Se conserva la actualización por pantalla y la reutilización local del catálogo;
  no se añaden cron, Realtime, servicios de pago ni cambios de infraestructura remota.

Este addendum sustituye únicamente las reglas anteriores de Aunor sobre publicación
obligatoria y confirmaciones. Los documentos del 06/09 y 08/09 y el plan/auditoría
del chat IA deben interpretarse con esta actualización; el chat no se implementa aquí.

## Verificación

- TypeScript: correcto.
- ESLint: correcto. Build de producción aislado: correcto.
- Base UUID desechable: cadena de migraciones, proyección de actividades no
  publicadas, estados/material, ausencia de datos del operario, denegación de RPC,
  historial conservado, permisos de otros roles y regresión de reinicio/borrado.
  Base retirada por su propio verificador. No se utilizó la base de trabajo como fixture.
- Navegador: 13 pruebas aprobadas (8 de Aunor y 5 del panel histórico de Admin),
  con capturas locales, tamaños 320–1920 px y prueba de ampliación de texto.
- Unitarias: incluyen borde exacto de 72 h, fecha inválida, no extensión por
  edición, todos los estados, filtros, navegación listado/detalle y permisos.
- Suite general: 273 pruebas aprobadas de 273 (36 archivos).
- Integración con Auth y REST locales reales: 19 escenarios aprobados, incluida
  proyección automática por HTTP, ausencia de campos privados, denegación de
  confirmaciones y regresión de cuentas. Sus contenedores y base UUID fueron retirados.
- Se regeneró `docs/plan-chat-ia-reutilizable.pdf`, requerido por
  `current-contract.test.ts`, desde su HTML existente y sin modificar el plan.
  Sus tres páginas se revisaron visualmente. No se omitió la prueba ni se
  implementó el chat IA.

## Despliegue

La autorización de cierre es «terminarlo entonces» y «continua». La evidencia
previa, el respaldo privado verificado y el procedimiento de publicación están
en [el registro de despliegue](despliegue-aunor-2026-09-14.md).

La publicación requiere primero la migración compatible y después el despliegue
de la rama `master` mediante la integración existente GitHub-Vercel. Las
comprobaciones de producción no crean ni modifican trabajos reales.

Volver solo al commit anterior no revierte una migración de base de datos. Una
reversión debe coordinar ambos lados y conservar los datos posteriores al respaldo.
