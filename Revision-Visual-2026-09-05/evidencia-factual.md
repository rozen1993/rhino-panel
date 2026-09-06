# Evidencia factual de la revisión
Fecha: 2026-09-05. Entorno: http://localhost:3000, demostración aislada. Esta evidencia no certifica Preview, Producción ni Auth/RLS reales.

## Cobertura
37 capturas PNG reales, 8.6 MB decimales en total. Detalle de cada archivo, ruta, actor, viewport y textos en inventario-capturas.json.
- Acceso: directorio demo escritorio.
- Admin escritorio/móvil: panel vacío y con actividad, formulario de planificación sin envío, Cuentas sin acciones, Papelera vacía, ficha de actividad entregada e Histórico.
- Operario Carlos: panel vacío/con actividad y ficha de Edición, escritorio/móvil.
- Operaria Ana con creación propia autorizada: panel vacío/con actividad y formulario propio sin envío, escritorio/móvil.
- Operario especial Luis: ficha de encargo Burson, escritorio/móvil.
- Burson: lista/formulario de encargos y ficha propia, escritorio/móvil. El formulario móvil permanece inicialmente plegado.

## Histórico
- Escritorio conserva los doce meses en cuatro columnas y tres filas; panel de detalle derecho.
- Móvil: meses apilados, navegación inferior y detalle en panel superpuesto desde abajo.
- Se seleccionó Grabación de días discontinuos y Edición de rango continuo; hay captura de ambos detalles de escritorio.
- Archivo canónico para modal móvil: admin-historico-detalle-mobile-viewport.png (390×844).
- La captura fullPage del modal también se conserva como evidencia bruta, pero no debe usarse para juzgar colocación de elementos fijos.
- El código MiniMonth ya reúne todas las actividades por fecha y muestra contador cuando hay más de una. El fondo/rango de la fecha toma matches[0]; el panel ofrece selector de todas las coincidencias.
- NO se observó este último estado en funcionamiento: la semilla no contiene solapamientos y no se crearon registros artificiales.
- Histórico conserva piso 2026, selecciona por año y se restringe a Admin.
- HistoricalActivity no incluye lugar; la actividad completa sí lo incluye. El panel histórico no muestra identificador visible ni lugar.
- Se manejan fechas/jornadas, no horarios. No se ha verificado ni se presume una agenda por horas.

## Roles: observación visual, no prueba de seguridad
Las fichas respetan cabecera azul técnica, títulos condensados, tarjetas blancas, cian y acciones lima.
- Admin muestra Cuentas, Histórico, Papelera y controles de planificación.
- Carlos ve planificación protegida y no ve acceso de creación propia.
- Ana ve permiso individual y formulario de creación propia.
- Luis se identifica como operario especial con vínculo Burson.
- Burson tiene navegación solo a sus encargos; en la ficha no aparecen controles de ejecución ni trazabilidad interna.
Las fichas comparadas contienen actividades/estados distintos; no atribuir cualquier diferencia de botones exclusivamente a permisos.

## Observaciones menores para futura prueba de usabilidad
- En Burson móvil algunos rótulos de contadores se abrevian con puntos suspensivos.
- En escritorio algunos textos de búsqueda/selectores se cortan dentro del control.
- Marca móvil con botón de regreso puede truncarse.
- En capturas fullPage las barras fijas aparecen sobre contenido intermedio. La captura por sí sola no prueba inaccesibilidad; haría falta prueba real de desplazamiento.
No se detectó overflow horizontal DOM ni pageerror en la pasada registrada. No equivale a auditoría completa de accesibilidad.

## Límites y protección
Contextos Playwright nuevos no persistentes; no se conectó al perfil Chrome del usuario, ni se importaron/sobrescribieron sus cookies, localStorage o datos. Sin env/secretos del usuario. Se permitieron solo lecturas locales y acceso demo; no hubo envío de formularios de negocio. No se abrieron materiales externos.
No revisados: coincidencias reales; creación/edición/baja/restauración/contraseñas; estados de error de formularios; móvil físico/tablet/Safari/iOS; Supabase/Preview/producción; nuevas pantallas Aunor (no existen en estas capturas); nuevas propuestas visuales (no generadas).

## Claude
Prueba realizada dentro del lanzador Claudex o/max/core, no en la sesión interactiva del usuario. Versión 2.1.226. Sin herramientas Chrome en esa invocación; Read sí abrió y describió la captura real. Se aplica fallback autorizado de mismas capturas para ambos modelos. Evidencia: claude-capacidad-visual.json.

