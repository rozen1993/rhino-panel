SUPUESTOS

Derivación independiente, de solo lectura, basada en las 15 capturas abiertas y los archivos permitidos. No navegué la aplicación ni ejecuté acciones. La capacidad visual de Claude mediante su lanzador está documentada por el anfitrión; no la reverifiqué.

Los cuatro registros pertenecen a una demo visual. No representan contrato, cantidades reconocidas ni aprobaciones de Aunor. Marco conserva las decisiones visuales y económicas.

PROPUESTA

La interfaz actual ofrece una base coherente: cabecera oscura, navegación persistente, títulos condensados, superficies claras, bordes finos y acentos cian/lima. El Histórico muestra doce meses, jornadas discontinuas y detalle lateral; en móvil mantiene los meses en columna y abre el detalle en una hoja inferior. Las nuevas piezas deben prolongar esa estructura.

Conserva:

- Cabecera, navegación por rol, tipografías, colores y componentes vigentes.
- Calendario anual completo, control de año, jornadas y panel de detalle.
- Estados operativos existentes y separación entre Admin, Operario y Burson.
- Acceso al Histórico completo; las nuevas entradas no deben hacer desaparecer registros de otras categorías.

Añade, por prioridad:

1. **Entradas fotográficas.** Dentro del contenido de Histórico, dos accesos Grabación/Edición con composición tipo VS. Cada acceso abre el calendario actual filtrado, con categoría y año visibles. Mantener un enlace secundario «Ver todo el Histórico». No añadir Creatividad/Locución a estas piezas.
2. **Identidad y coincidencias.** Incorporar identificador estable, lugar y datos suficientes para distinguir registros con títulos parecidos. Completar el selector existente de coincidencias.
3. **Seguimiento Aunor.** Diseñar una vista de conciliación y un bloque relacionado en la ficha de actividad, dentro del lenguaje actual. Su estructura necesita validación de Marco antes de implementación.

Pantallas necesarias: entrada fotográfica, Histórico filtrado, detalle con coincidencias, ficha de actividad con relaciones Aunor y vista de conciliación. Admin sería el punto inicial del nuevo acceso porque la ruta actual de Histórico está restringida a ese rol. Cualquier extensión de acceso necesita una decisión expresa.

**Coincidencias**

El código ya conserva todas las actividades de una fecha y permite elegirlas. La limitación visual es que el fondo y la continuidad del rango proceden de `matches[0]`.

Propongo:

- Mantener la cuadrícula y mostrar cantidad neutral cuando coincidan varias actividades.
- En coincidencias entre categorías, usar un tratamiento de celda que indique pluralidad y pequeños marcadores de las categorías presentes. El rojo conserva su significado de atraso.
- Al abrir una fecha, mostrar la lista completa con identificador, título, responsable, lugar y jornadas. La identidad depende del identificador y del texto.
- Al seleccionar una actividad, destacar sus fechas y mantener visible qué registro se está consultando.
- En el Histórico filtrado, indicar que la cantidad corresponde a esa categoría. La consulta de otras categorías queda accesible desde el filtro.

Dos actividades de Grabación con fechas idénticas seguirían siendo dos filas identificadas dentro del selector. No hace falta inventar colores individuales ni horarios.

**Aunor**

Separar tres entidades relacionadas: referencia contractual original, actividad ejecutada y propuesta de cambio/reemplazo. Una referencia puede relacionarse con varias actividades; una actividad puede tener relaciones justificadas con varias referencias. No asumir correspondencia uno a uno.

La vista de conciliación mostraría: referencia original, situación documentada de lo previsto, actividades vinculadas, cambio propuesto, evidencias y decisiones registradas. También debe incluir actividades todavía sin referencia y referencias sin actividad. Así puede verse trabajo adicional sin convertir automáticamente su existencia en reconocimiento contractual.

Cada propuesta de reemplazo debe conservar origen y destino, motivo, solicitante, fecha, alcance y evidencia. Si se rechaza o modifica, permanecen tanto la propuesta como las actividades. La revisión debe generar una nueva versión o evento, conservando el original.

Mantener tres dimensiones separadas:

- Ejecución: los estados operativos existentes.
- Conformidad: decisión documentada sobre el trabajo y su alcance.
- Aprobación económica: decisión independiente, con respaldo y responsable.

«Entregada» no completa las otras dimensiones. «Sin constancia» debe distinguirse de «rechazada». Una sustitución parcial conserva visible el alcance pendiente. No calcular equivalencias, saldos económicos o porcentajes de cumplimiento sin unidades, cantidades y reglas verificadas. El canal Burson permanece separado de cliente y referencia contractual.

Las evidencias pueden comenzar como enlaces asociados a documentos concretos, con autor y fecha, coherentes con el sistema actual. No se justifica introducir cargas de archivos en esta fase.

ALTERNATIVAS: TRES BRIEFS PARA FUTUROS PNG

Las tres variantes utilizarían las capturas reales como base y conservarían íntegros cabecera, navegación y lenguaje tipográfico. Las fotografías todavía necesitan selección o aprobación; no se presentan aquí imágenes nuevas.

1. **Dos tarjetas enfrentadas — recomendada.** Base: superficie y tarjetas de `admin-panel-con-actividad-desktop.png`. Dos tarjetas iguales: fotografía de rodaje y fotografía de edición; título, breve descripción y enlace «Ver Histórico». Separador VS pequeño. Cian y naranja identifican las categorías. Móvil: tarjetas apiladas con separación clara. Se integra naturalmente con los componentes existentes.
2. **Díptico fotográfico continuo.** Base: marco de contenido de `admin-historico-desktop.png`. Una pieza rectangular dividida en dos mitades, con fotografía y velo azul oscuro para legibilidad; VS centrado y rótulos equivalentes. Móvil: dos franjas apiladas. Mayor protagonismo fotográfico; requiere controlar contraste y recorte.
3. **Encuentro diagonal contenido.** Base: cabeceras oscuras visibles en fichas y Burson. Dos escenas separadas por una diagonal suave dentro de una tarjeta; VS pequeño en el encuentro, títulos en zonas estables. Móvil: cortes horizontales. Mayor dinamismo, con especial revisión de legibilidad y reconocimiento de ambos destinos.

Cada futuro brief debe incluir escritorio, móvil y una vista de destino que demuestre el mismo Histórico filtrado. No usar imágenes que sugieran clientes, equipos o servicios no confirmados.

RIESGOS

La selección fotográfica podría dominar una herramienta operativa: limitarla a la entrada y evitar repetirla sobre cada calendario.

La densidad de coincidencias todavía no tiene evidencia visual. No puede darse por resuelta únicamente porque exista un selector.

El Histórico excluye actividades eliminadas según el código leído. Un registro Aunor necesita preservar su referencia y trazabilidad aun cuando una actividad salga de la consulta operativa habitual.

En móvil Burson se ven indicadores abreviados («Progr…», «En pr…», «Entre…»). Conviene comprobar su comprensión; las barras fijas sobre capturas largas no demuestran por sí solas contenido inaccesible.

VERIFICACIÓN

Abrí realmente estos PNG:

- `admin-historico-desktop.png`
- `admin-historico-edicion-desktop.png`
- `admin-historico-mobile.png`
- `admin-historico-mobile-viewport.png`
- `admin-historico-detalle-mobile-viewport.png`
- `admin-panel-con-actividad-desktop.png`
- `admin-cuentas-desktop.png`
- `admin-planificar-desktop.png`
- `carlos-panel-con-actividad-desktop.png`
- `carlos-actividad-mobile.png`
- `ana-creacion-propia-desktop.png`
- `luis-actividad-burson-desktop.png`
- `burson-encargos-desktop.png`
- `burson-encargos-mobile.png`
- `burson-detalle-mobile.png`

Código comprobado: `annual-calendar.tsx`, `historical.ts`, ruta de Histórico, `activities.ts` y consulta Supabase de Histórico. Confirman filtro actual por año, restricción Admin, fechas sin horarios, coincidencias completas en selector, color tomado del primer registro y ausencia de lugar en la proyección histórica. El modelo `Activity` leído no contiene referencias contractuales ni decisiones económicas.

Aceptación posterior: mantener doce meses y panel; conservar categoría al cambiar de año; distinguir registros homónimos y fechas idénticas; acceder a todas las coincidencias mediante ratón, teclado y tacto; verificar foco y cierre del detalle; representar reemplazos parciales, rechazados y sin aprobación sin perder originales; evitar duplicar actividades en recuentos.

Pendientes: coincidencias reales, datos voluminosos, Auth/RLS remoto, mutaciones, dispositivos físicos, Safari/iOS, tablet y aceptación del equipo. Los pendientes de Preview y Producción documentados en el paquete continúan abiertos.

CONFIANZA

Alta en la continuidad visual y los hechos del código inspeccionado. Media en el comportamiento con densidad de actividades. Limitada para concretar el modelo Aunor hasta revisar referencias y ejemplos reales con Marco. Ningún cambio ni PNG de propuesta fue creado.

