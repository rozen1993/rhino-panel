# Fotografías para Aunor · propuestas visuales

Fecha: 19 de octubre de 2026. Alcance: propuesta local para elegir diseño; no implementa una pestaña real ni modifica datos, cuentas, permisos o despliegues.

Abrir `index.html` y usar el selector superior. PNG de escritorio y móvil incluidos en esta carpeta.

| Opción | Nombre de pestaña | Organización | Ventaja |
| --- | --- | --- | --- |
| 01 — recomendada | Fotos para redes | Álbum por actividad, portada, miniaturas y acceso a su selección | Es claro qué trabajo originó cada foto y permite descargar su selección junta. |
| 02 | Galería social | Fotos en cuadrícula, con actividad y fecha al pie | Facilita elegir una imagen por su contenido visual. |
| 03 | Selección editorial | Listado de actividades y foto grande con miniaturas | Facilita revisar el encuadre y elegir una toma de la actividad. |

## Criterio visual

Se reutilizan los colores y familias tipográficas del producto: azul noche `#021326`, tinta `#10233f`, papel `#f4f7f8`, cian `#11b7c9`, petróleo `#124b57` y verde lima `#84d600`. Cabecera, barra lateral y selección de navegación respetan el sistema existente. Tipografía de títulos Bahnschrift SemiCondensed/Arial Narrow; texto Segoe UI y etiquetas Consolas. Se reserva el protagonismo a las fotografías y el petróleo a las acciones de descarga.

La opción 01 hace reconocible una selección corta con portada y tira de miniaturas; la 02 permite explorar fotos de actividades diferentes; la 03 funciona como una mesa de selección de una actividad. Los tres diseños ocultan los nombres del personal y conservan acceso a Actividades, Histórico y Contrato.

## Flujo propuesto para una futura implementación

1. El operario adjunta 2–3 fotografías seleccionadas a la actividad correspondiente, en un apartado específico para redes.
2. Aunor encuentra ese material en la nueva pestaña, asociado a la fecha y el título de la actividad, sin ver al operario responsable.
3. Puede ampliar cada imagen y descargarla en calidad original; la descarga conjunta de una actividad es una opción propuesta.
4. Las fotos permanecen consultables por mes y actividad. No se publicarían automáticamente en Instagram ni se conectan cuentas sociales en estas propuestas.

La cantidad de fotos disponibles es distinta del estado de la actividad: no se declara una actividad entregada solo por subir estas fotos. Los formatos, la compresión de miniaturas, el almacenamiento privado y sus límites se definirán en la implementación aprobada. No se presupone almacenamiento ilimitado ni se crea infraestructura de pago.

La propuesta contempla el flujo principal de Aunor; el formulario de carga del operario y una posible revisión de Admin no están implementados. La unificación del panel Aunor/Admin descrita en la conversación es una decisión separada de este comparador.

## Ejemplos y recursos

Actividades, fechas y conteos son ficticios. Las tres imágenes fueron creadas mediante la herramienta integrada `image_gen` para esta propuesta, no son entregas reales ni representan fotografías documentales de AUNOR. Algunas miniaturas repiten recortes de la misma imagen para mostrar la composición; no son nuevas tomas ni una función de recorte automático del producto.

Recursos guardados en `assets/seguridad.png`, `assets/puente.png` y `assets/voluntariado.png`. Prompts utilizados en `prompts.md`. No se usaron servicios externos de almacenamiento ni se consultó la base de datos.

Los controles de descarga muestran una explicación de la futura acción; el visor y el filtro de búsqueda funcionan con los ejemplos locales. Renderizar de nuevo con `node docs/propuestas-fotos-aunor-2026-10-19/render.mjs` desde la raíz. `verificacion.json` registra los controles realizados.
