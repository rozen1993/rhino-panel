# Sistema R — recomendación visual para aprobación
**Claudex o/max · decide · core · 5 de septiembre de 2026**

Estado: revisión terminada; recomendación pendiente de Marco. No se implementó ni se generaron diseños nuevos.

## Recomendación central
Ampliar el diseño aprobado, no sustituirlo. Dos entradas fotográficas Grabación/Edición abren el mismo Histórico anual filtrado. La trazabilidad Aunor se añade como seguimiento documental relacionado con las actividades, no como una nota que reemplace el contrato.

## 1. Evidencia y límites
Codex anfitrión navegó con Playwright/Chrome en contextos de demostración nuevos y no persistentes. Se guardaron **37 PNG reales** (~8.6 MB) en esta carpeta, sin conectarse al perfil Chrome del usuario ni modificar sus cookies o pruebas.

El lanzador real de Claudex ejecutó Claude Code 2.1.226 con o/max/core. No expuso herramientas Chrome; sí abrió y describió imágenes mediante Read. Se utilizó la alternativa autorizada: mismas capturas reales para ambos.

Secuencia: paquete neutral → derivación Codex en agente sin historial → derivación Claude sin recibir la primera → comparación Claude en tercera sesión neutral, sin herramientas. Ambos derivadores abrieron las mismas 15 capturas obligatorias. Las salidas de Claude terminaron correctamente y con structured_output válido. La comparación no se presentó como prueba de navegación.

| Revisado | Escritorio y móvil |
|---|---|
| Admin | Panel vacío/con actividad, planificación sin envío, Cuentas sin acciones, Papelera vacía, ficha e Histórico |
| Operario Carlos | Panel y ficha de Edición; sin acceso visible de creación propia |
| Operaria Ana autorizada | Panel y formulario propio sin envío |
| Operario especial Luis | Ficha de encargo Burson |
| Burson | Encargos y detalle propios |

Histórico: doce meses, selección de Grabación discontinua, rango de Edición, detalle derecho en escritorio y hoja inferior móvil. Referencias: [escritorio](admin-historico-desktop.png), [Edición](admin-historico-edicion-desktop.png), [móvil](admin-historico-mobile-viewport.png), [detalle móvil](admin-historico-detalle-mobile-viewport.png).

**No comprobado visualmente:** coincidencias, porque la semilla aislada no contiene ninguna. Se revisó su código, sin crear datos. Tampoco se probaron mutaciones, altas/bajas/contraseñas, aprobaciones, datos voluminosos, Auth/RLS remoto, dispositivos físicos, tablet ni Safari/iOS. Capturas móviles largas pueden superponer barras fijas: eso no demuestra inaccesibilidad.

## 2. Qué se conserva
- Cabecera, marca, diagonales técnicas, navegación y permisos por rol.
- Tipografías actuales, cian, naranja, lima, violeta, fondos claros, tarjetas y botones existentes.
- Calendario anual desde 2026, doce meses, selector de año y panel de detalle.
- Estados de ejecución y separación Admin–Operario–Burson.
- Registros existentes de Creatividad/Locución: quedan fuera de las nuevas piezas, no se eliminan ni se vuelven inaccesibles.
- Planificación Admin, creación propia por permiso individual, ejecución del responsable, encargos Burson y pendientes técnicos anteriores.

## 3. Qué se añade y en qué orden

### P0 — aprobar alcance y piezas antes de implementar
Elegir una dirección de entrada y aprobar las reglas de identidad/Aunor. Después preparar PNG comparables sobre las capturas actuales. Cualquier dato sintético para ilustrar coincidencias se etiquetará y requerirá autorización separada; no se agregará a las pruebas del usuario.

### P1 — entrada y consulta del Histórico
- Pantalla de entrada dentro del contenedor actual de Histórico: dos fotos de igual importancia, Grabación y Edición, enfrentadas tipo VS.
- Cada una conduce a la misma vista anual con categoría y año visibles; cambia el filtro, no el calendario.
- Fotos solo en la entrada: no mantenerlas sobre el calendario consultado, especialmente en móvil.
- Acceso secundario discreto «Ver todo el Histórico», sin una tercera tarjeta protagonista, para conservar la consulta existente.
- Volver o cambiar de categoría sin perder el año; recuentos explícitamente relativos al filtro.
- Acceso Admin como hoy. No nuevas pestañas inferiores Grabación/Edición ni permisos implícitos para otros roles.

### P1 — coincidencias e identidad
Se entrega junto al Histórico dividido; no debe quedar relegado a una corrección posterior.

El código ya ofrece todas las actividades de una fecha, pero el fondo/rango toma la primera. Recomiendo:
- Mantener el color de categoría y un contador neutral de actividades coincidentes.
- Abrir la lista completa dentro del panel actual, sin depender del color: **código estable + título + responsable + lugar + jornadas**.
- El código estable no debe cambiar según el orden de la lista, el día o el filtro. Dos registros con igual título y responsable seguirán distinguiéndose.
- Seleccionar una actividad destaca sus propias fechas, incluso con jornadas discontinuas o cruces de mes.
- En la consulta completa, marcadores pequeños pueden indicar varias categorías; no asignar una paleta arbitraria a cada trabajo. El rojo sigue significando atraso.
- No inferir horarios: el modelo actual registra días/jornadas.

La técnica exacta del indicador queda pendiente de prueba visual con dos, tres y más coincidencias. No dar por aprobado el relleno bicolor: debe demostrar legibilidad y continuidad de rangos. La cantidad debe anunciarse con claridad sin lectura duplicada; el aria-label actual ya enumera todas las actividades.

Añadir lugar al detalle requiere ampliar la proyección histórica y su consulta; no basta con dibujar una etiqueta.

### P2 — seguimiento Aunor y conciliación
Una referencia contractual propia, relacionada con trabajos y cambios, resulta más sólida que un campo libre dentro de cada actividad: permite mostrar también lo pactado que aún no tiene actividad y el trabajo que aún no tiene vínculo.

Pantallas/bloques:
1. **Resumen Aunor:** referencias previstas, actividades vinculadas, trabajos sin referencia y referencias sin trabajo; sin porcentajes ni saldos inventados.
2. **Ficha de referencia:** documento, cláusula/página, texto original, alcance documentado y datos faltantes «Por confirmar».
3. **Cambio o reemplazo:** origen/destino, motivo, solicitante, fecha, alcance total/parcial, evidencia y decisión registrada. Propuesto no equivale a aprobado.
4. **Bloque Aunor en la ficha de actividad:** relaciones y acceso a evidencias; referencia breve en el detalle Histórico, con información ampliada fuera del pequeño panel.
5. **Resumen para revisión con el supervisor:** relación entre lo previsto, lo realizado y los cambios documentados. Acceso externo o exportaciones no se presumen autorizados.

Conservar el original y el historial de cada revisión. Una propuesta rechazada, un reemplazo parcial o una baja operativa no borran el trabajo ni su relación contractual. Permitir varias actividades por referencia y relaciones múltiples justificadas, evitando duplicar recuentos. Una Grabación y una Edición no equivalen automáticamente a dos entregables contractuales.

Separar expresamente:
- **Ejecución:** los estados actuales.
- **Conformidad:** qué trabajo fue aceptado, por quién y con qué evidencia.
- **Aprobación económica:** decisión documentada independiente; «Sin constancia» no significa «Rechazada», «Aprobada» ni «Pagada».

Admin registra una aprobación ajena solo con su respaldo; el sistema no la otorga por marcar «Entregada». «No planificada» tampoco significa automáticamente «fuera de contrato». Las cantidades, equivalencias, importes y rótulos finales necesitan documentación/decisión de Marco.

Mismo lenguaje visual: tarjetas de Cuentas, formularios de Planificación y trazabilidad de las fichas actuales. Inicialmente acceso desde el contenido de Mi panel Admin y enlaces contextuales, sin rehacer ni saturar la navegación inferior. Operarios y Burson conservan sus límites; no se añade un rol de supervisor por inferencia.

### P3 — validación y pendientes que siguen abiertos
- Pruebas aisladas autorizadas: coincidencias homónimas, misma categoría, varias categorías, cruces de mes/año, vacío, volumen y filtros/contadores.
- Ratón, teclado, tacto, foco, cierre de hoja móvil, contraste real de fotos y rendimiento.
- Aunor: referencias sin actividad, trabajos sin referencia, reemplazos parciales/rechazados, baja lógica sin pérdida, evidencia ausente, sin constancia económica y recuentos sin duplicación.
- Mantener los gates documentados: smoke autenticado del Preview, bootstrap/limpieza temporal pendiente, dispositivos reales/Safari/iOS, aceptación del equipo y RC posteriores.
- Producción sigue requiriendo su autorización separada, entorno Supabase separado, backup/restauración y Go/No-Go. Esta revisión no verifica ni cierra esos gates.

Fuera de esta ampliación: nuevos Históricos de Creatividad/Locución, chat IA, carga de materiales, automatización de cobros/equivalencias, nuevos permisos externos y rediseño general.

## 4. Tres briefs para futuros PNG
Las variantes cambian la **composición fotográfica de entrada**, no la interfaz ni los calendarios de destino.

| Variante | Composición | Base real y adaptación móvil |
|---|---|---|
| **A. Tarjetas enfrentadas — recomendada** | Dos tarjetas blancas iguales, foto de rodaje y foto de estación de edición. Títulos actuales, acento cian/naranja y VS pequeño entre ambas. Acciones con el lima vigente. | Tarjetas de admin-panel-con-actividad-desktop.png dentro del contenedor de admin-historico-desktop.png. Móvil: dos tarjetas apiladas, sin tocar cabecera/barra inferior. |
| **B. Díptico cinematográfico** | Una pieza rectangular con dos mitades fotográficas, velo azul noche y títulos condensados blancos. Separación central recta y VS discreto. Sin convertir toda la página en una portada oscura. | Marco del Histórico y cabecera técnica actuales. Móvil: dos franjas apiladas; texto legible y fotos con recortes controlados. |
| **C. Diagonal Rhino** | Dos escenas unidas por una diagonal moderada que retoma las líneas de marca, contenida dentro de la zona de entrada. Rótulos horizontales y destinos de igual peso. | Diagonales de la cabecera real; no deformar tarjetas, navegación ni calendario. Móvil: separación horizontal para conservar legibilidad. |

Futuro paquete de aprobación: entradas de escritorio/móvil, destino Grabación, destino Edición, detalle de coincidencias y una muestra de seguimiento Aunor con el mismo lenguaje de tarjetas/formularios. Las vistas Aunor serán propuestas identificadas, no capturas de una función ya existente. Los ejemplos no representarán cantidades o aprobaciones reales.

Las fotografías deben ser aprobadas o identificarse como ilustrativas, sin atribuir un rodaje/cliente al equipo. Texto y UI se conservan a partir de referencias reales; no pedir a un generador que reinvente toda la pantalla. Contraste a medir sobre la imagen final; un degradado no lo garantiza por sí solo. No se genera nada de ese paquete bajo esta orden.

## 5. Resultado de la comparación
Coincidencias: conservar diseño y roles; reutilizar calendario; distinguir identidad del color; tres ejes Aunor; evidencias sin inventar aprobaciones.

Diferencias relevantes:
- Fotos persistentes sobre calendario frente a puerta de entrada: se recomienda entrada solamente, por densidad móvil y petición de dos accesos.
- Aunor como nota frente a referencia relacionada: se recomienda referencia independiente y conciliación para que ningún trabajo/referencia quede fuera de la revisión.
- Relleno dividido frente a indicadores discretos: pendiente de comprobación y aprobación, no decisión cerrada.
- «aria-hidden = fallo» se matizó tras verificar que el botón ya enumera todos los registros; no se adopta una corrección automática por consenso.
- Se conservan todos los colores aprobados, incluido el lima de Creatividad.

Confianza alta en conservación y hechos observados; media en la solución de densidad aún no visualizada; modelo/terminología Aunor pendientes de documentación y aprobación.

## Registro Claudex
- Modo: decide.
- Pipeline/perfil: core, o/max para Claude, sin degradación.
- Motivo: ampliación que afecta UX aprobada, representación de datos y seguimiento con consecuencias económicas.
- Evidencia: 37 capturas; 15 comunes a ambas derivaciones; código local; prueba visual del lanzador.
- Resultado: recomendación, no implementación.
- Quién decide: Marco; aprobación pendiente.
- Próximo paso propuesto: aprobar este alcance y la dirección A/B/C para preparar los PNG, sin dar por autorizado el desarrollo ni los datos de prueba.
- Sin cambio de goal, protocolo, aplicación, datos, commits ni despliegues. Archivos previos del usuario preservados.

## Archivos de respaldo de esta revisión
- [Paquete neutral](paquete-neutral.md)
- [Inventario de capturas](inventario-capturas.json) y [huellas SHA-256](huellas-capturas.json)
- [Cobertura y hechos observados](evidencia-factual.md)
- [Prueba visual Claude](claude-capacidad-visual.json)
- [Derivación Codex original](derivacion-codex-original.md)
- [Derivación Claude estructurada](derivacion-claude.json)
- [Comparación limpia](comparacion-limpia.json)
- [Verificación de hechos y matices de la comparación](verificacion-hechos.md)

Nota: derivacion-codex.md conserva además una síntesis breve; la comparación usó la respuesta original, no esa síntesis.

