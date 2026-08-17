# E-007 — Diseño móvil, bloque 1: el trabajo diario

**Fase:** 1 — UX y desarrollo visual
**Ejecuta:** Codex
**Estado:** encargado
**Fecha:** 2026-08-17
**Formato:** OCRAV
**Entrega:** imágenes PNG. No se programa nada todavía.

---

```
┌─────────────────────────────┐
│ 1. OBJETIVO                 │
└─────────────────────────────┘
```

Diseñar en **móvil** las pantallas que un colaborador usa todos los días, en la dirección visual ya
elegida (D-031), y entregarlas como **catorce imágenes PNG verticales**.

Este es el **bloque 1 de dos**. El bloque 2 —supervisión, AUNOR, Burson, cuentas e importación— va en un
encargo aparte inmediatamente después.

Rutas exactas de salida, en `diseno/movil/`:

```
m-01-actividades-colaborador.png     P-2 · lista de un colaborador
m-02-actividades-coordinacion.png    P-2 · variante de Coordinación, ve las de todos
m-03-actividades-vacio.png           P-2 · sin actividades este mes
m-04-actividades-carga.png           P-2 · cargando
m-05-actividades-error.png           P-2 · no se pudo cargar
m-06-detalle-normal.png              P-3 · actividad En proceso
m-07-detalle-observada.png           P-3 · actividad Observada, con la observación y su respuesta
m-08-detalle-aprobada.png            P-3 · actividad Aprobada, cerrada, sin edición
m-09-detalle-supervision.png         P-3 · la misma ficha vista por supervisión
m-10-formulario-grabacion.png        P-4 · crear grabación, con ubicación obligatoria
m-11-formulario-edicion.png          P-4 · crear edición, sin ubicación
m-12-formulario-borrador.png         P-4 · aviso de borrador guardado sin enviar
m-13-historial.png                   P-10 · historial del mes
m-14-historial-vacio.png             P-10 · historial sin resultados
```

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

**El producto.** Plataforma web interna de **Rhino Audiovisuales**, productora peruana que trabaja para
**Autopista del Norte (AUNOR)**, concesionaria de autopista. El equipo registra ahí las actividades que
hace para el cliente; supervisión las revisa y aprueba.

**Quién usa estas pantallas.** Johann grabando en vía, con el teléfono en una mano, a pleno sol y con
señal irregular. Es el caso que manda. Eduardo editando, Chiara coordinando, Martín en operaciones.

### La dirección visual — obligatoria

Es la **pieza 2**, ya elegida por Marco. Está en dos sitios y debes mirar los dos:

- `diseno/piezas-png/pieza-2.png` — la imagen aprobada
- `diseno/escritorio/pieza-2.html` — la maqueta con los **valores reales**: hexadecimales, tipografía y
  espaciados

**El lenguaje:** fondo claro, casi blanco. Tinta azul oscura. Acentos en ámbar y rojo. Muy ordenada,
alineada, casi documental — el aire de una planilla de producción audiovisual: claquetas, marcas de
tiempo, fichas de rodaje. El orden es la estética. Sin gestos gráficos llamativos.

### Los siete estados

**Programada · En proceso · Por subir · Entregada · Observada · Aprobada · Cancelada**

**Observada es la más importante de todas**: significa «esto te está esperando» y tiene que saltar a la
vista sin buscarla. Los siete se distinguen **sin depender solo del color**: forma, borde, peso o icono
cargan parte del trabajo, porque se leen a pleno sol.

### El contenido exacto de cada pantalla

**m-01 · Actividades de un colaborador.** Cabecera con «Rhino Audiovisuales» y el avatar de Johann.
Fila de meses con el número debajo: ABR 6, MAY 8, JUN 10, JUL 9, AGO 12, con agosto destacado. Cuatro
tarjetas de resumen: **12 actividades · 3 programadas · 2 en proceso · 7 finalizadas**. Debajo, cinco
tarjetas de actividad, cada una con fecha, tipo, título, estado y avance:

| Fecha | Tipo | Título | Estado | Avance |
|---|---|---|---|---|
| Hoy 08:30 | Grabación | Cobertura de mantenimiento en peaje Chillón | **Observada** | 80% |
| 13 ago 06:00 | Operación | Cierre de carril por instalación de señal | Programada | 0% |
| 11 ago 15:20 | Edición | Resumen semanal de seguridad vial | En proceso | 55% |
| 10 ago 17:40 | Creatividad | Piezas para campaña «Vuelve seguro» | Por subir | 100% |
| 08 ago 11:00 | Coordinación | Agenda de rodaje con cuadrilla norte | Entregada | 100% |

La tarjeta Observada va primera y destacada. Botón de crear alcanzable con el pulgar. **Barra inferior
fija** con dos destinos: Actividades y Perfil.

**m-02 · Variante de Coordinación.** Las mismas cinco actividades, pero **cada tarjeta dice de quién
es** —Johann, Eduardo, Martín, Chiara— porque Coordinación ve las de todo el equipo. El destino de la
barra se llama «Actividades», no «Mis actividades». Tres destinos: Actividades, Burson, Perfil.

**m-03 · Vacío.** Agosto sin ninguna actividad. Un mensaje que no culpe a nadie y el botón de crear.

**m-04 · Cargando.** Las tarjetas como esqueletos grises, sin texto inventado.

**m-05 · Error.** No se pudo cargar la lista. Mensaje claro y botón de reintentar.

**m-06 · Detalle normal.** La actividad «Resumen semanal de seguridad vial», Edición, En proceso, 55%.
Ficha con fecha, responsable Eduardo, quién la creó, descripción, entrega prevista, notas internas y el
enlace al material. **Historial de cambios de estado con autor y fecha.** Abajo: **cuándo se modificó
por última vez**. Acciones de colaborador: editar, y avanzar el estado.

**m-07 · Detalle Observada.** La cobertura del peaje Chillón, Grabación, Observada, 80%, responsable
Johann, creada por Chiara. Ubicación: peaje Chillón, caseta norte, Km 25.4, sentido Norte → Sur.
Enlace al material. **La observación de Chiara y la respuesta de Johann**, claramente una debajo de la
otra y distinguibles. Historial de estado. Última modificación. **Un aviso arriba: esta actividad
espera tu corrección.**

**m-08 · Detalle Aprobada.** La misma ficha pero Aprobada: **cerrada**. No hay acciones de edición. Se
nota que está terminada.

**m-09 · Detalle visto por supervisión.** La misma actividad Observada de m-07, pero con las acciones de
supervisión disponibles: resolver la observación, aprobar, cancelar.

**m-10 · Formulario de grabación.** Campos obligatorios primero: fecha, tipo, título, responsable,
estado inicial, avance. Luego **ubicación con el nombre del lugar prominente** y el resto —referencia,
kilómetro, sentido, latitud, longitud— plegado o secundario. Después descripción, entrega prevista,
enlace al material y notas. Los obligatorios marcados.

**m-11 · Formulario de edición.** El mismo formulario con tipo Edición: **la ubicación ya no es
obligatoria** y se nota.

**m-12 · Borrador sin enviar.** El formulario a medio llenar con un aviso claro: **está guardado en este
teléfono pero todavía no llegó al servidor**, con opción de reintentar.

**m-13 · Historial del mes.** La lista de agosto en formato adaptado a móvil, con buscador, filtro por
estado y exportar. Por fila: fecha, título, lugar, estado, si tiene enlace, y las acciones **Ver** y
**Editar**. Como en un teléfono no cabe una tabla, resuélvelo como lista de fichas.

**m-14 · Historial vacío.** El buscador sin resultados. Mensaje que ayude a corregir la búsqueda.

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No** dibujes escritorio ni tableta. **Solo móvil, vertical.**

**No** escribas «Midnight» ni «RAS». El nombre es **Rhino Audiovisuales**.

**No** inventes logotipos de Rhino ni de AUNOR.

**No** cambies la dirección visual. Es la pieza 2 y solo la pieza 2. Nada de fondo oscuro.

**No** inventes contenido. Todo lo que hay que mostrar está en el bloque 2. Si algo no está ahí, no se
dibuja. **En un intento anterior aparecieron actividades de control de tráfico y radares: eso es el
trabajo de la concesionaria, no de Rhino.** Rhino graba, cubre, edita y produce piezas.

**No** inventes métricas. Las tarjetas de resumen son cuatro y son estas: actividades, programadas, en
proceso, finalizadas. **Nada de «alertas activas» ni «recursos asignados».**

**No** dibujes gráficos de barras, gráficos circulares ni mapas. El producto no los tiene.

**No** dibujes adjuntar archivos, contador de archivos ni botón de descargar. El material vive en
OneDrive y solo se guarda un enlace.

**No** muestres acciones de supervisión —observar, aprobar, cancelar— en las pantallas de colaborador.
Solo en `m-09`. Una acción que el rol no puede ejecutar no se muestra, ni desactivada.

**No** dibujes la pantalla de acceso: su forma está sin decidir.

**No** modifiques nada fuera de `diseno/movil/`.

**No** crees `package.json`, `node_modules` ni andamiaje. **No** hagas commits.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

1. Existen los **catorce PNG** con los nombres exactos del bloque 1.
2. Todas son **verticales**, de al menos **1024 px de ancho**, con proporción de teléfono.
3. Las catorce comparten la misma dirección visual: fondo claro, tinta azul, acentos ámbar y rojo, aire
   documental. Puestas en fila parecen **el mismo producto**.
4. **La barra inferior fija** aparece en todas las pantallas de navegación.
5. En `m-01` la tarjeta **Observada salta a la vista sin buscarla**. Es la prueba más importante de este
   encargo.
6. En `m-10` y `m-12` los campos son **grandes y tocables**: alguien de pie en la berma, con una mano
   ocupada, tiene que poder usarlos.
7. `m-12` deja claro, sin ambigüedad, que **lo escrito aún no llegó al servidor**.
8. `m-07` distingue a simple vista la **observación** de la **respuesta**.
9. Se ven los siete estados repartidos por el conjunto, y se distinguen sin depender solo del color.
10. Ninguna pantalla muestra nada de lo prohibido en el bloque 3.

**Sobre el texto:** un modelo de imagen no siempre escribe bien. Se acepta texto imperfecto. **No se
acepta** contenido inventado que contradiga el bloque 2 — títulos de actividades que Rhino no hace,
métricas que no existen, o estados que no están en los siete.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

1. `ls diseno/movil/` devuelve exactamente catorce PNG con los nombres pedidos.
2. Cada archivo pesa más de 100 KB, es vertical y mide al menos 1024 px de ancho.
3. **Abre las catorce y descríbelas una por una.** Para cada una di: qué se ve, si respeta la dirección
   visual clara, y si el contenido corresponde a lo que pedía el bloque 2.
4. Comprueba en `m-01` que la tarjeta Observada destaca sobre las otras cuatro. Si no destaca,
   **regenérala**.
5. Comprueba que en ninguna aparecen actividades de tráfico, radares o control vehicular. Si aparecen,
   **regenera esa imagen**.
6. Comprueba que en ninguna aparece «Midnight», «RAS», «alertas activas» ni «recursos asignados».
7. Comprueba que las acciones de supervisión solo salen en `m-09`.
8. `git status` no muestra cambios fuera de `diseno/movil/`.

**Reporte:** corto. Resultado, los catorce archivos, la verificación punto por punto, la descripción de
cada imagen en una línea, cuáles tuviste que regenerar y por qué, y qué pantalla te parece más floja.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte. **No inventes reglas de producto.**

---

## Errata — 2026-08-17

**El bloque 2 de este contrato pedía mal la pantalla `m-09`.** Decía que la ficha Observada vista por
supervisión debía ofrecer «resolver la observación, aprobar, cancelar».

**«Aprobar» no puede aparecer ahí.** La regla está en `docs/fase-0-concepcion.md`:222 y en su tabla de
transiciones: *solo una actividad **Entregada** y **sin observaciones abiertas** puede pasar a
Aprobada*. Sobre una actividad Observada, supervisión puede **resolver** la observación o **cancelar**
la actividad, y nada más.

Codex ejecutó el contrato tal como estaba escrito, así que **el fallo es de contrato, no de ejecución**.
Lo detectó una revisión independiente de Codex sobre las imágenes ya entregadas, no la propia revisión
de Claude.

Al regenerar `m-09` hay que quitar «Aprobar».
