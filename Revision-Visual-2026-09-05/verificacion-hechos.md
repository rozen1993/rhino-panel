# Verificación de hechos decisivos por el anfitrión
No es una tercera derivación. Lecturas de código y capturas verifican afirmaciones contrastables; la comparación independiente recibe las respuestas originales.

1. annual-calendar.tsx, MiniMonth: matches[0] gobierna fondo y continuidad de rango. El badge de cantidad es aria-hidden, pero el botón contenedor YA tiene aria-label que enumera TODAS las actividades y el panel ofrece todas en choices. Por tanto, no está demostrado que una actividad sea inaccesible u ocultada al lector de pantalla. Lo demostrado es que la apariencia principal procede del primer registro. Prueba visual de solapamientos pendiente.
2. DetailPanel actual no muestra lugar ni identificador legible. HistoricalActivity no hereda place; frontend/lib/supabase/historical.ts tampoco selecciona ni mapea place. La actividad completa sí dispone de ese campo.
3. El Histórico actual está restringido a Admin y filtra por año desde 2026. Las nuevas categorías solicitadas ya existen. Añadir un filtro no exige por sí solo nuevas categorías de base de datos. Su implementación futura deberá ser consistente en demo/Supabase, contadores, selección y navegación anual.
4. Los cuatro colores de categoría, incluido el lima de Creatividad, aparecen en el diseño aprobado. No se propone corregir ese color basándose únicamente en una regla genérica de exclusividad cromática: Marco ordenó conservar paleta y excluyó ampliar Creatividad/Locución.
5. Un degradado por sí solo NO garantiza contraste AA con cualquier fotografía. La futura propuesta debe medir contraste sobre las imágenes efectivas o reservar una superficie suficientemente opaca al texto.
6. El Histórico operativo filtra registros con deletedAt / deleted_at. El seguimiento documental Aunor no puede depender de esa exclusión: una baja operativa no deberá borrar ni ocultar el vínculo y los antecedentes en la futura conciliación.
7. La barra inferior móvil actual contiene cinco entradas Admin. Las nuevas puertas Grabación/Edición no deben convertirse en dos entradas adicionales de navegación.
8. Ningún criterio de aceptación futuro (contraste, coincidencias, dispositivos físicos, RLS, aprobación comercial) se da por probado por estas capturas.

## Comprobación posterior a la comparación limpia
- Se confirmó en frontend/lib/supabase/database.types.ts:356 que los cuatro tipos vigentes incluyen Grabación/Edición. Esto respalda que las puertas/filtros no requieren crear una categoría nueva. NO certifica que cualquier implementación futura sea un único componente ni de coste conocido; el seguimiento contractual sí amplía el modelo.
- La comparación recomienda retirar aria-hidden del contador como si fuera una corrección de accesibilidad demostrada. Se matiza con el hecho 1: el nombre accesible del botón ya enumera todas las actividades. La recomendación final es anunciar pluralidad/cantidad con claridad y sin lectura duplicada, verificándolo con lector de pantalla; no se declara fallo demostrado por ese atributo aislado.
- La frase de la comparación «ninguna navegó» se refiere a los dos DERIVADORES en frío. Codex anfitrión SÍ navegó con Playwright y produjo las 37 capturas. Claude solo vio imágenes mediante Read.
- No se adopta un nuevo color de Creatividad ni un relleno bicolor como decisión cerrada: conservar paleta es orden expresa y la técnica de coincidencias debe validarse primero con datos aislados autorizados.
- Marco no ha aprobado ninguna de las propuestas. Todo el informe final es recomendación pendiente.

