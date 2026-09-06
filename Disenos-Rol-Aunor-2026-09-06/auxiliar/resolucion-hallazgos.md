# Resolución de la revisión cruzada

Claude vio los 16 PNG del borrador 01 y tres capturas reales desde el lanzador. Sesión a626b24f-54f1-4a40-aa00-807a0f864106, completed. Señaló dos problemas principales: estado Entregada poco contrastado sobre fondo oscuro y enlaces redundantes del histórico dentro del panel Aunor.

## Cambios aceptados para borrador 02

- Entregada en cabecera navy usa lima legible de la paleta existente.
- Se conserva calendario, doce meses y panel, pero se retiran enlaces redundantes «Elegir histórico/Ver Edición» del panel Aunor. La categoría se elige en el selector ya visible.
- Servicios previstos: icono neutral de lista, no casillas marcadas.
- Botones Abrir hilo con altura de botón, no estirados a la fila.
- Categoría Grabación y condición Por relacionar vuelven a ser conceptos separados en la bandeja.
- Barra móvil Admin conserva las etiquetas Panel/Bajas del diseño real.
- Se incorpora GR-026 el 8 de septiembre al calendario ficticio, coherente con el panel; se mantienen las coincidencias de junio.
- Conversación Admin de la escena 06 armonizada al momento previo a registrar/publicar R-03.
- Se capturan ampliaciones de junio y de la parte superior del calendario móvil para revisar la legibilidad que el visor de Claude no pudo valorar en la imagen larga reducida.

## Ajuste adicional de fidelidad: borrador 03

Al contrastar directamente con el componente actual status-pill.tsx, Programada usa cian y símbolo ○, En proceso usa naranja y ◐, Entregada usa verde y ●. Se trasladan esas reglas a las maquetas, eliminando el violeta usado por error para Programada en los primeros borradores. El violeta sí existe en la aplicación para Locución, pero no corresponde a este estado.

## Sugerencias no adoptadas, con motivo

- Eliminar el naranja: no procede. Es el color actual de Edición y En proceso, documentado en frontend/app/globals.css, frontend/components/status-pill.tsx y frontend/components/annual-calendar.tsx. La barra de categoría y el estado son ejes distintos. El uso incorrecto de violeta para Programada sí se corrigió.
- Quitar OSITRAN por ser nombre real: no procede. Forma parte de la lista de servicios del contrato aportado (2.2). Los ejemplos de actividades son ficticios, las referencias de servicios no pretenden ser inventadas.
- Añadir pantallas vacías: mejora futura, fuera del inventario pedido para esta aprobación visual. No es un bloqueo de esta entrega; su diseño/prueba se conserva como pendiente de implementación.

La revisión de imágenes no prueba permisos, autorización, integridad de datos ni comportamiento real de los controles. Tampoco equivale a aprobación de Marco.
