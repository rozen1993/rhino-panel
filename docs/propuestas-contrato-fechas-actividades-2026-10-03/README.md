# DA VINCI · Contrato, fechas y consulta de actividades

Revisión del 3 de octubre de 2026. **Propuestas para aprobación, no cambios publicados.**

[Abrir galería local](index.html). Todas las cantidades, actividades, personas y horas de las maquetas son ejemplos ficticios. No son una copia ni un informe de datos reales.

## 1. Un mismo contrato para Admin y Aunor

- [Vista Admin · PNG](png/contrato-admin-1600.png)
- [Vista Aunor · PNG](png/contrato-aunor-1600.png)
- [Aunor en móvil · PNG](png/contrato-aunor-390.png)

Ambos componentes ya reutilizan el cálculo contractual, pero presentan la información de manera diferente: `frontend/components/admin-contract-center.tsx` y `frontend/components/aunor-contract.tsx`. La propuesta es compartir la presentación: mismo periodo seleccionado, pestañas mensual/anual, orden de servicios, tarjetas X/Y y consulta de trabajos asociados.

La diferencia debe ser el permiso, no el contrato. Admin conserva configuración de periodos, metas y revisión de excepciones. Aunor solo consulta: no recibe controles de modificación, nombres de operarios ni información interna. Ocultar esos datos con CSS no es suficiente; deben quedar fuera de la respuesta autorizada del servidor.

Las seis tarjetas de muestra ilustran la distribución. No se propone retirar ningún servicio, reemplazo documentado ni compromiso anual. Se conservan las reglas de cómputo, las asignaciones explícitas y los periodos pendientes de revisión. La clasificación especial no duplica automáticamente el cómputo contractual.

### Un aviso que sí informe

Sustituir el aviso de `admin-contract-center.tsx:169` por **Última actualización del contrato**:

> Se incorporó una entrega a Coberturas audiovisuales · octubre 2026.
> 03 oct. 2026 · 10:42 · Hora de Lima.

Ejemplo ilustrativo, no actualización real verificada. El aviso debe mostrar qué cambió, el servicio afectado y cuándo se registró el cambio, dentro del periodo consultado. La fecha del cambio no altera la fecha contractual del trabajo: una entrega histórica de abril registrada hoy sigue contando en abril.

No usar `Date.now()`, la hora de refresco ni simplemente la actividad más reciente. El modelo leído por esta pantalla no ofrece un evento único que cubra todos los cambios pertinentes. Ya existen eventos de metas (`private.aunor_contract_period_events`, con `recorded_at`), publicaciones y auditoría; se necesita una proyección autorizada que reúna los cambios relevantes, sin entregar auditorías privadas al cliente.

Debe contemplar vinculación y desvinculación, entrega y reapertura, sustituciones, bajas que afecten el conteo y cambios de metas. Para antecedentes sin evidencia suficiente: **Sin actualizaciones registradas para este periodo**, sin inventar fechas. Los eventos de bajas no deben volver a exponer contenido eliminado. Una lectura compacta debe evitar descargar todo el historial para mostrar una sola actualización.

## 2. Tres propuestas para elegir día y mes

Son reemplazos de los selectores de formularios y consulta de periodos, no del calendario anual del histórico.

| Opción | Visual | Ventaja y compromiso |
| --- | --- | --- |
| **01 · Selector compacto — recomendada** | [PNG](png/fechas-01-1600.png) | Panel junto al campo, doce meses o cuadrícula de días, año visible y acceso al periodo actual. Familiar, reutilizable y ocupa poco espacio cerrado. |
| 02 · Navegación por periodo | [PNG](png/fechas-02-1600.png) | Meses consecutivos a mano y acceso directo a otra fecha. Cómodo para comparar meses; ocupa más espacio permanente. |
| 03 · Fecha por segmentos | [PNG](png/fechas-03-1600.png) | Día, mes y año separados. Ágil para cargar trabajos históricos; menos contexto visual que un calendario de días. |

También hay versiones de 390 px de ancho en `png/`. Se preservan azul marino, cian, verde de acción, bordes y jerarquía tipográfica de la plataforma.

Implementación posterior: componente común con modos día/mes, límites configurables, años bisiestos, teclado, Escape, retorno del foco y etiquetas accesibles. Guardar fechas civiles sin convertirlas accidentalmente al día anterior por UTC. Grabación, locución y creatividad mantienen fecha de realización; edición, fecha de entrega. No añadir hover a los bloques del calendario anual.

## 3. Una mejora de la idea actual y tres alternativas

### 01 · Panel que te acompaña — recomendada

[PNG inicial](png/actividades-01-1600.png) · [PNG tras desplazarse](png/actividades-01-desplazamiento-1600.png) · [Detalle móvil](png/actividades-01-detalle-390.png)

Toda la fila selecciona la actividad; el título también es un botón accesible por teclado. El resumen acompaña el desplazamiento, queda debajo del encabezado y mantiene el acceso a la ficha. En móvil se abre una hoja inferior.

Hay una causa concreta del problema actual: `activity-dashboard.tsx:162` aplica `sticky` a la tarjeta, pero su `aside` contenedor (`:355`) no lo aplica y limita su recorrido. Se debe posicionar el contenedor lateral, ajustar la separación respecto al encabezado y limitar su altura al espacio disponible. Una ficha larga puede desplazarse internamente, con sus acciones accesibles.

Conserva el patrón conocido y cambia menos la plataforma. Su coste es reservar ancho para el resumen. En pantallas intermedias debe cambiar al patrón móvil antes de comprimir excesivamente la tabla.

### 02 · Panel lateral bajo demanda

[PNG escritorio](png/actividades-02-1600.png) · [PNG móvil](png/actividades-02-390.png)

La lista utiliza todo el ancho. Al pulsar una fila aparece un panel lateral con el resumen, ficha completa y navegación anterior/siguiente. Cerrar devuelve el foco y mantiene la posición de la lista. En móvil se convierte en hoja inferior.

Es la mejor alternativa si se quiere recuperar espacio. A cambio, mientras está abierto cubre parte de la lista. En producción requiere foco contenido e interacción de fondo bloqueada de forma accesible.

### 03 · Resumen dentro de la fila

[PNG](png/actividades-03-1600.png)

El resumen se despliega inmediatamente debajo de la actividad seleccionada. Solo uno abierto. No existe una columna de detalle que buscar.

Es directo y conserva el contexto, pero desplaza las filas posteriores y aumenta la altura de la tabla. Al cambiar de fila hay que conservar visible el título seleccionado.

### 04 · Explorador de actividades

[PNG escritorio](png/actividades-04-1600.png) · [PNG móvil](png/actividades-04-390.png)

Lista compacta a la izquierda y ficha resumida a la derecha, con desplazamientos independientes y navegación anterior/siguiente. En móvil: lista, detalle y botón de regreso.

Adecuado para revisar muchas actividades seguidas. Es el cambio más profundo: se pierde la comparación tabular simultánea de varias columnas.

En todas las opciones se conserva el diamante discreto para especiales y el estado entregada en verde sólido. Pulsar un enlace de material o seleccionar texto no debe disparar otra acción. No se amplía la visibilidad de datos de ningún rol.

## 4. Rendimiento: evidencia y plan

Se revisaron código y nueve peticiones autenticadas de lectura al despliegue actual, tres por ruta. Se consumió el HTML completo; estas mediciones **no ejecutan JavaScript ni miden LCP o el tiempo completo de navegación del navegador**. Las sesiones temporales de diagnóstico se cerraron al terminar. No se alteraron actividades, metas o entregas.

| Ruta | Mediana hasta cabeceras | Mediana HTML completo | Rango HTML completo | HTML aproximado |
| --- | ---: | ---: | ---: | ---: |
| Admin `/actividades` | 950 ms | 1.135 ms | 732–1.770 ms | 65 KiB |
| Admin `/contrato` | 601 ms | 782 ms | 753–1.216 ms | 58 KiB |
| Aunor `/aunor/contrato` | 673 ms | 861 ms | 788–951 ms | 66 KiB |

Las nueve respuestas fueron HTTP 200 y contenían encabezado y estructura de carga. Esto no sustituye una prueba de navegación intermedia. La muestra es pequeña y no permite calcular un p95 fiable, demostrar una mejora ni atribuir la demora a una única causa.

### Prioridades

1. **Medir la espera por etapa.** Separar autenticación, perfil, consultas, cálculo y renderizado; medir navegación real y respuesta caliente/fría. Parte considerable de la espera observada ocurre antes de recibir cabeceras, así que una animación diferente no la soluciona.
2. **Leer menos datos por pantalla.** El contrato aún obtiene actividades de múltiples meses y colecciones asociadas. Proponer un resumen por servicio/periodo autorizado y cargar el detalle al abrirlo. No filtrar ingenuamente por fecha de creación: deben respetarse fechas de trabajo, asignaciones explícitas, sustituciones, excepciones y metas anuales. Las pruebas deben demostrar paridad exacta de X/Y.
3. **Evitar cálculos repetidos.** `contract-progress.ts` y `contract-calendar.ts` recorren actividades, jornadas y periodos repetidamente por servicio. Crear índices y agregaciones una vez por conjunto recibido. Medir antes y después; con pocos registros puede no ser el cuello de botella principal.
4. **Refrescar solo lo necesario.** `use-aunor-workspace.ts` ya evita consultas al estar oculta la pestaña y reutiliza servicios temporalmente. Aun así, refresca el conjunto completo periódicamente. Evaluar una revisión compacta y recargar solo si cambió; invalidar inmediatamente tras escrituras propias. No compartir cachés privadas entre roles ni mostrar datos revocados.
5. **Revisar consultas y distancia de infraestructura.** Medir planes antes de crear índices. La configuración local usa `pdx1`; se observó `gru1::pdx1` en respuestas. La región de Supabase no quedó verificada, por lo que no se afirma que esté mal configurada ni se propone moverla a ciegas. [Regiones de funciones Vercel](https://vercel.com/docs/functions/configuring-functions/region) y [optimización de consultas Supabase](https://supabase.com/docs/guides/database/query-optimization).
6. **Preservar la página durante las transiciones.** Mantener encabezado y navegación, estructura anticipada solo dentro de la sección y posición de la lista. No reintroducir `app/contrato/loading.tsx` por encima de la estructura compartida. Probar fotogramas intermedios con latencia controlada, no solo la pantalla final.

### Lo que ya existe y no hay que rehacer

- Consultas independientes en paralelo, paginación y detección de conjuntos incompletos.
- Caché de rol por petición y precarga por intención en enlaces.
- Lectura diferida de parte del detalle y auditoría.
- Optimización de validación de rol en vistas contractuales de la migración `202609300003_contract_read_performance.sql`.

Revisar redundancias de autenticación entre proxy y página solo con mediciones; no quitar validaciones de sesión, rotación de contraseña o cuenta desactivada para ganar velocidad.

**No hay evidencia suficiente para recomendar comprar una base de datos o cambiar de plan ahora.** Primero reducir trabajo, medir y verificar consistencia. No se ha contratado infraestructura ni solicitado cambios de pago. Menos transferencia y lecturas también ayuda a cuidar los límites actuales; no se garantiza disponibilidad ilimitada.

## 5. Orden de implementación después de elegir

1. Respaldo de código antes de tocar la aplicación, revisión del árbol de trabajo y pruebas base.
2. Vista común de contrato y aviso basado en evidencia real. Respaldo privado verificado antes de cualquier migración remota; pruebas SQL en base UUID desechable.
3. Selector de fecha elegido y variante de consulta de actividades elegida, sin modificar datos de negocio.
4. Optimización por etapas con comparación de resultados y tiempos; no una refactorización masiva sin medición.
5. Pruebas de permisos, fechas, conteos, reemplazos, periodos mensuales/anuales, móvil, teclado y transiciones lentas. Publicación solamente cuando corresponda a la autorización del usuario.

## Verificación de estas maquetas

`node docs/propuestas-contrato-fechas-actividades-2026-10-03/render.mjs`

Se generaron 20 PNG. Comprobados anchos de 1600, 390 y 320 px sin desbordamiento horizontal, permanencia del panel tras desplazarse, cierre con Escape y retorno de foco del panel lateral, selección de un solo resumen inline y ausencia de controles Admin/operarios en la maqueta Aunor. Capturas con solicitudes externas bloqueadas y sin errores JavaScript.

Son prototipos HTML/CSS con interacción parcial, no componentes de producción: no envían formularios ni abren material real. Los controles de año, atajos de fecha, pestañas y acciones de gestión ilustran el diseño; su lógica completa, validación y pruebas accesibles corresponden a la implementación. Los PNG móviles muestran un viewport, no toda la página desplazable.

Los archivos nuevos están únicamente en esta carpeta. No se modificó código de la aplicación, no se hicieron migraciones, commits, push ni despliegues en esta entrega.
