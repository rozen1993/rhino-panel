# Estado Entregada — tres propuestas

Maquetas locales, sin modificar componentes, estados, datos ni despliegues.

- **01 · Verde sólido (recomendada):** fondo #216337, texto y check blancos. Peso comparable al estado En proceso, sin adoptar el lima de los botones de acción.
- **02 · Sello de verificación:** fondo #F0F7ED, texto #245F0B, contorno #6F975F y check circular verde. Alternativa ligera para listados densos.
- **03 · Placa técnica:** fondo #031D36, texto blanco, check y base #84D600; borde #8BA2B6 para diferenciarla sobre superficies oscuras.

Las tres conservan el nombre Entregada. Son indicadores, no botones: sin cursor de acción, animación o hover. El check indica el estado final de entrega; no añade aprobación del cliente ni aceptación contractual. No se modifica Programada, En proceso ni el marcaje Estándar/Especial.

La guía frontend-design se aplicó para conservar la tipografía, radios, azul técnico y jerarquía del sistema existente. Se muestran una ampliación, ejemplos a tamaño real, fondo oscuro y convivencia con otros estados. El contenido es ilustrativo, no registros reales.

## Archivos

- `00-comparativa.png`: las tres propuestas en una sola imagen.
- `01-escritorio.png`, `02-escritorio.png`, `03-escritorio.png`: detalle por alternativa.
- `01-movil.png`, `02-movil.png`, `03-movil.png`: adaptación a 390 px.
- `index.html`: visor local.

Generar con `node docs/propuestas-estado-entregada-2026-09-29/render.mjs` desde la raíz. El render solo permite solicitudes a archivos locales y comprueba ausencia de desbordamiento y errores JavaScript.

Marco eligió **01 · Verde sólido**. Se implementa en el componente compartido `StatusPill`: verde #216337, texto blanco, check del sistema, radio de 5 px y altura mínima de 28 px. Programada y En proceso se conservan. Las imágenes de esta carpeta siguen siendo las propuestas originales.
