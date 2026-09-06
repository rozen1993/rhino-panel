# Sistema R — propuestas visuales para aprobación

Abre [ABRIR-DISENOS.html](ABRIR-DISENOS.html) en Chrome y pulsa cualquier imagen para ver el PNG completo.

La entrega vigente está en **png-aprobacion/**: 18 PNG, aproximadamente 13 MB. Las carpetas `png/`, `png-final/` y `auxiliar/borrador-01/` conservan versiones de trabajo de esta misma sesión; no son las propuestas finales. No se sobrescribieron capturas ni propuestas anteriores al encargo.

## Qué puedes aprobar

- **A · Tarjetas enfrentadas:** fotografías dentro de tarjetas claras, con la separación más cercana a la interfaz existente.
- **B · Díptico cinematográfico:** dos fotografías continuas con texto sobre fondo oscuro; corte vertical en escritorio y horizontal en móvil.
- **C · Diagonal Rhino:** fotografías con una costura diagonal; también conserva ese rasgo al apilarse en móvil.
- **Destinos:** el calendario anual actual de Grabación o Edición, filtrado, con sus doce meses, colores de categoría y detalle. No son calendarios nuevos.
- **Coincidencias:** una misma fecha muestra varias actividades; la lista identifica cada una por código estable, título, responsable, lugar y jornadas. Dos actividades pueden compartir título. El cian sigue significando Grabación; no se inventa un color de categoría para cada identidad.
- **Aunor:** referencias originales, trabajos vinculados o pendientes de vincular, cambios propuestos y evidencias. Ejecución, conformidad y aprobación económica tienen estados separados. El registro original no desaparece.

Mi preferencia es **A** si priorizas continuidad con lo aprobado; **C** si quieres dar más fuerza a la composición tipo VS sin cambiar el resto de la plataforma.

## PNG incluidos

| Archivos | Contenido |
| --- | --- |
| 00 | Comparativa A/B/C, escritorio y móvil |
| 01–06 | Las tres entradas, dos tamaños por variante |
| 07–10 | Grabación y Edición, escritorio y móvil con doce meses |
| 11, 12 y 15 | Coincidencias en escritorio, selector móvil y detalle móvil desplazado |
| 13–14 | Seguimiento Aunor, escritorio y móvil |
| 16–17 | Vistas móviles de ventana: Grabación inicial y Edición desplazada a mayo |

[Comparativa](png-aprobacion/00-comparativa-entradas.png) · [Coincidencias](png-aprobacion/11-coincidencias-escritorio.png) · [Aunor](png-aprobacion/13-aunor-escritorio.png)

## Cómo leer los ejemplos

Las fotografías son ilustraciones generadas, no fotografías de trabajos reales. Los códigos G-DEMO/E-DEMO/REF-DEMO, personas, lugares, fechas y actividades son ficticios y están rotulados en las maquetas.

No se transcribieron ni inventaron cantidades, importes, equivalencias contractuales o aprobaciones. «Entregada» describe ejecución del ejemplo, no conformidad, autorización de cobro o pago. Un trabajo sin referencia identificada tampoco se clasifica automáticamente como fuera del contrato.

Los PNG largos de móvil muestran el documento completo. Solo para exportarlos, la navegación aparece al pie de ese documento: no se propone cambiar su comportamiento fijo en la aplicación. Los PNG 12 y 15 muestran dos posiciones del mismo detalle desplazable.

## Fidelidad y preparación

Base: [recomendación existente](../Revision-Visual-2026-09-05/RECOMENDACION.md) y capturas reales de esa carpeta. No se repitió la auditoría.

La guía frontend-design se aplicó para respetar el lenguaje visual aprobado. Se reutilizaron copias aisladas del calendario, cabecera, navegación, componentes auxiliares y CSS compilado existentes; imagegen se utilizó únicamente para las fotografías. Los ajustes de contenido y composición viven exclusivamente en esta carpeta.

Los HTML auxiliares son maquetas estáticas sin conexión. Sus botones y enlaces de aplicación están inertes; solo la galería enlaza a archivos PNG. No se integraron estas pantallas en la plataforma ni se consultaron sus sesiones, cookies, datos o servicios.

## Verificación y revisión cruzada

- PNG válidos, imágenes cargadas, galería con 18 enlaces existentes.
- Cuatro destinos con doce meses; seis DOM de calendario, incluidas coincidencias, con doce meses.
- Sin desbordamiento horizontal, errores de página ni peticiones de red en la exportación comprobada.
- Catorce copias de componentes/utilidades/CSS coinciden byte por byte con sus originales.
- Escritorio: viewport 1440 px; móvil: 390 px. La comparativa es una lámina de 1920 px. Esto no acredita otros tamaños, interacción, permisos, RLS ni accesibilidad integral.

Evidencia automática: [entrega-aprobacion-verificacion.json](auxiliar/entrega-verificacion.json). Registro de Claudex: [CLAUDEX-ENTREGA.md](auxiliar/CLAUDEX-ENTREGA.md).

## Límite del encargo

No se modificó código de aplicación, datos, cookies, goal ni protocolo. No hubo commit ni despliegue. Se preservaron los cambios previos del repositorio. Creatividad y Locución no se amplían aquí.

**Siguiente paso: tu aprobación visual.** Estas imágenes no autorizan por sí solas implementación, cambios contractuales o despliegues.
