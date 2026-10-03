# Propuestas DA VINCI — 01/10/2026

Abrir `index.html` para explorar las nueve opciones o `00-comparativa.png` para compararlas. Cada opción tiene un PNG completo de escritorio, otro `-movil.png` y un recorte `-detalle.png`.

Son maquetas HTML/CSS locales, con datos ilustrativos de las capturas del usuario y ejemplos adicionales. No representan una consulta de producción ni modifican la aplicación. No se han publicado en Vercel. Respaldo previo: `ae0f848`.

## Elecciones visuales

| Bloque | 01 (recomendada) | 02 | 03 |
|---|---|---|---|
| Calendario | Celdas de agenda: fecha y cantidad en una celda | Puntos de jornada: lectura ligera | Riel de producción: hoja anual continua |
| Panel | Diamante junto al título | Medallón discreto antes del título | Diamante alineado y riel fino |
| Carga | Estructura anticipada de la sección | Indicador centrado dentro de la plataforma | Transición de marca, preferiblemente solo al entrar |

El criterio de diseño mantiene azul marino, cian, lima, tipografía condensada en títulos y Segoe UI en cuerpo. Violeta solo distingue trabajos especiales; verde sigue significando Entregada. No se rediseña la navegación ni se confunde clasificación con estado.

## Reglas solicitadas, independientes de la elección

- Quitar el rombo sobre las fechas. La clasificación completa puede permanecer en las tarjetas del histórico.
- El mes es un contenedor: sin desplazamiento, sombra ni borde al pasar el cursor. Las fechas con actividades siguen siendo botones, con foco de teclado y zona táctil.
- Panel: sin etiqueta Estándar y sin etiqueta textual Especial. Solo los especiales llevan el icono elegido, con nombre accesible y explicación al enfocar/pasar el cursor.
- Estándar por defecto: Admin marca únicamente las especiales. Los registros sin clasificación deben tratarse como estándar y los especiales existentes deben conservarse. La implementación deberá alinear formularios, filtros, demo, acciones y base; no basta ocultar una etiqueta. No se amplían permisos del Operario para clasificar.
- Edición: ubicación Lima predeterminada. Corregir de forma trazable el registro mostrado como «variado»; no alterar su fecha de entrega, estado, responsable ni material. Los demás tipos conservan sus ubicaciones.
- Carga sin porcentajes inventados, demoras artificiales ni servicios externos. Respetar reducción de movimiento; conservar navegación cuando ya existe sesión autorizada. Antes de autorizar, usar una variante neutral sin nombre, rol ni datos privados.

## Hallazgos de código y trabajo pendiente

1. `frontend/components/annual-calendar-view.tsx`, `MiniMonth`: el hover actual proviene de `hover:-translate-y-0.5`, cambio de borde y sombra. El rombo es otro elemento absoluto junto al contador: de ahí la superposición de señales.
2. `activity-table.tsx`, `activity-card.tsx` y vista rápida de `activity-dashboard.tsx` renderizan la etiqueta de clasificación. Deben cambiar coordinadamente en escritorio y móvil, sin modificar la etiqueta del histórico.
3. `save_activity_plan_v4` conserva el lugar legado en ediciones existentes y deja vacío el lugar de ediciones nuevas. Por eso ocultar el campo del formulario no convierte automáticamente «variado» en Lima. La regla solicitada requiere corregir guardado y lecturas/proyecciones, más una corrección auditada de la fila real. Aún no aplicada.
4. `frontend/app/contrato/loading.tsx` muestra solo un párrafo durante la carga de ruta, antes del esqueleto interno. La opción elegida debe cubrir ambos momentos y adaptarse al contenido de cada sección.

Marco aprobó Calendario 01, Actividades 01 y Carga 02. La implementación local y las capturas de la aplicación están en [implementación aprobada](../implementacion-calendario-panel-carga-2026-10-01/README.md). Esta carpeta conserva las propuestas originales; no representa evidencia de publicación ni de cambios en datos reales.

Actualización posterior: Marco sustituyó Carga 02 por **Carga 03 — Transición DA VINCI**.
La implementación y capturas nuevas están en [Carga 03](../implementacion-carga-03-2026-10-01/README.md).
Calendario 01 y Actividades 01 se mantienen.

El 03/10 Marco sustituyó Carga 03 por **Carga 01 — Estructura anticipada**.
Implementación y capturas actuales: [Carga 01](../implementacion-carga-01-2026-10-03/README.md).
Se conserva la navegación durante la carga; las propuestas anteriores quedan como referencia histórica.

## Verificación de las maquetas

`node docs/propuestas-calendario-panel-carga-2026-10-01/render.mjs`

- Generación a 1440 y 390 px, sin desbordamiento horizontal ni errores JavaScript.
- Tráfico externo bloqueado; no se abre una sesión de la aplicación.
- Comprobación de meses estáticos, selección de fecha y diamante solo en filas especiales.
- En móvil se presenta abril como muestra de la vista mensual; esto no propone eliminar los otros meses del histórico.
- En junio el ejemplo incluye una actividad de tres jornadas y otra independiente: dos trabajos, cuatro fechas ocupadas. El conteo mensual no multiplica las jornadas.
