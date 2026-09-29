# Cinco propuestas para el marcaje de actividades

29/09/2026. Solo propuestas: **no se modificaron los componentes de la aplicación ni los datos**. Las imágenes del formulario y del histórico son maquetas HTML/CSS con ejemplos ilustrativos.

## Elegir una alternativa

[Comparativa de las cinco en PNG](00-comparativa.png). También se puede abrir [el prototipo HTML](index.html) y probar la selección Estándar/Especial.

| Opción | Idea | Escritorio | Móvil |
| --- | --- | --- | --- |
| 1. Sello de producción — recomendada | Icono en celda propia, etiqueta compacta y legible. | [PNG](01-escritorio.png) | [PNG](01-movil.png) |
| 2. Cápsula sólida | Mayor contraste y presencia visual. | [PNG](02-escritorio.png) | [PNG](02-movil.png) |
| 3. Riel de clasificación | La más discreta, con una línea lateral. | [PNG](03-escritorio.png) | [PNG](03-movil.png) |
| 4. Marco técnico | Esquinas de encuadre, vinculadas al lenguaje audiovisual. | [PNG](04-escritorio.png) | [PNG](04-movil.png) |
| 5. Placa de archivo | Tipografía técnica en mayúsculas, apropiada para listados. | [PNG](05-escritorio.png) | [PNG](05-movil.png) |

Las opciones conservan azul marino, cian y verde de acción de DA VINCI; reservan violeta para Especial y gris azulado para Estándar. La distinción no depende solo del color: siempre tiene texto. Sin clasificar permanece neutro. Ninguna cambia estados, conteos contractuales ni permisos.

Se comprobó renderizado sin desbordamiento horizontal en escritorio de 1320 px y móvil de 390 px, así como selección única en el prototipo. Los archivos se generan con `node docs/propuestas-tags-2026-09-29/render.mjs` (requiere localhost:3000 para la comprobación final de acceso).

## Comprobación de Aunor en local

La [captura real del acceso local](acceso-local-aunor.png) muestra Aunor en la última fila, debajo de Luis Mendoza. Se comprobó también el inicio de sesión de demostración y la navegación del cliente hacia Contrato desde un contexto nuevo de navegador, sin modificar registros.

- Acceso: http://localhost:3000/acceso
- Usuario demo: `aunor`
- Contraseña demo: `aunor2026`

Esto no verifica el estado guardado en el navegador personal de Marco. La demo obtiene la lista de cuentas del almacenamiento local cuando existe, por lo que una lista antigua o una desactivación de prueba podría producir diferencias. También puede quedar fuera del primer pantallazo según el tamaño/zoom.

Si falta incluso al bajar al final, probar el mismo enlace en una ventana de incógnito permite comparar sin borrar datos locales. No se borraron cookies ni almacenamiento y no se recreó ninguna cuenta. Las credenciales anteriores son únicamente de demostración, no de producción.
