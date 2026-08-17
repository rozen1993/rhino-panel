# E-008 — Diseño de escritorio y laptop

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

Diseñar el producto en **escritorio y laptop** y entregarlo como **quince imágenes PNG horizontales**,
todas gobernadas por el sistema de diseño recién fijado.

Rutas exactas de salida, en `diseno/escritorio-png/`:

```
d-01-panel-colaborador.png       P-2 · panel de un colaborador
d-02-panel-coordinacion.png      P-2 · variante de Coordinación, ve las de todos
d-03-panel-vacio.png             P-2 · sin actividades este mes
d-04-detalle-observada.png       P-3 · actividad Observada, con observación y respuesta
d-05-detalle-supervision.png     P-3 · la misma ficha vista por supervisión
d-06-formulario-grabacion.png    P-4 · crear grabación, con ubicación obligatoria
d-07-supervision-observaciones.png  P-5 · bandeja de observaciones
d-08-supervision-feedback.png    P-5 · bandeja de feedback de AUNOR
d-09-aunor-mes.png               P-6 · vista mensual de AUNOR
d-10-aunor-feedback.png          P-6 · AUNOR dejando su opinión
d-11-burson-tablero.png          P-7 · módulo Burson
d-12-burson-ficha.png            P-7 · ficha de una solicitud de Burson
d-13-cuentas.png                 P-8 · administración de cuentas
d-14-importacion.png             P-9 · importación del histórico, simulación previa
d-15-historial.png               P-10 · historial mensual en tabla
```

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

**El producto.** Plataforma web interna de **Rhino Audiovisuales**, productora peruana que trabaja para
**Autopista del Norte (AUNOR)**, concesionaria de autopista. El equipo —cinco personas— registra ahí las
actividades que hace para el cliente; supervisión las revisa, observa y aprueba; AUNOR consulta el mes y
deja su opinión.

### Lee esto antes de dibujar nada

- **`docs/sistema-diseno.md`** — **es obligatorio y manda sobre todo lo demás.** Fija la paleta con sus
  hexadecimales, la tipografía, las siete marcas de estado, los elementos que se repiten y las reglas de
  negocio que el diseño no puede contradecir. Si algo no está ahí, no te lo inventes.
- `diseno/piezas-png/pieza-2.png` y `diseno/escritorio/pieza-2.html` — la dirección aprobada.
- `docs/fase-0-concepcion.md` — el producto: §5 estados, §7 pantallas, §8 AUNOR, §9 Burson.
- `diseno/movil/` — las catorce pantallas de móvil ya hechas. **Ojo:** su contenido es correcto pero
  **no son consistentes entre sí** y por eso existe ahora el sistema de diseño. Úsalas como referencia
  de **contenido**, nunca de forma.

### El contenido exacto de cada pantalla

Los datos de ejemplo son **siempre los mismos** en todas las pantallas donde aparezcan:

| Fecha | Tipo | Título | Responsable | Estado | Avance |
|---|---|---|---|---|---|
| Hoy 08:30 | Grabación | Cobertura de mantenimiento en peaje Chillón | Johann | **Observada** | 80% |
| 13 ago 06:00 | Operación | Cierre de carril por instalación de señal | Martín | Programada | 0% |
| 11 ago 15:20 | Edición | Resumen semanal de seguridad vial | Eduardo | En proceso | 55% |
| 10 ago 17:40 | Creatividad | Piezas para campaña «Vuelve seguro» | Chiara | Por subir | 100% |
| 08 ago 11:00 | Coordinación | Agenda de rodaje con cuadrilla norte | Chiara | Entregada | 100% |

**d-01 · Panel del colaborador.** Barra lateral izquierda con Mis actividades, Nueva actividad,
Historial mensual y Perfil, más el selector de año 2026. Fila de meses con el número debajo: ABR 6,
MAY 8, JUN 10, JUL 9, AGO 12, agosto destacado. Cuatro tarjetas de resumen: **12 actividades ·
3 programadas · 2 en proceso · 7 finalizadas**. Debajo, las cinco actividades de la tabla, con la
Observada primera y destacada.

**d-02 · Variante de Coordinación.** Lo mismo, pero cada fila **dice de quién es**. La barra lateral
añade Burson.

**d-03 · Vacío.** Agosto sin actividades. Mensaje neutro y el botón de crear.

**d-04 · Detalle Observada.** La cobertura del peaje Chillón. Ficha: responsable Johann, creada por
Chiara, entrega prevista 12 ago 18:00, avance 80%. Ubicación: peaje Chillón, caseta norte, Km 25.4,
sentido Norte → Sur. Enlace al material. **La observación y su respuesta, con este texto literal:**

> **Chiara, 12 ago 09:18:** «El plano del panel variable termina antes de mostrar el tránsito. Añade 8
> segundos y nivela el audio ambiente.»
>
> **Johann, 12 ago 10:42:** «Plano extendido y audio nivelado. Reemplacé el archivo en el mismo enlace.»

**Historial de estado completo, los cuatro pasos:** Observada (Chiara, 12 ago 09:18) · Por subir
(Johann, 12 ago 08:54) · En proceso (Johann, 12 ago 07:58) · Programada (Chiara, 10 ago 16:30). Y
**última modificación: hoy 10:42 por Johann**. Acciones de colaborador solamente.

**d-05 · La misma ficha vista por supervisión.** Idéntica, pero con las acciones de supervisión:
**«Resolver observación»** y **«Cancelar actividad»**.

> **No dibujes «Aprobar» aquí.** Sobre una actividad Observada no se puede aprobar: solo se aprueba
> desde Entregada y sin observaciones abiertas. Es la regla de `docs/fase-0-concepcion.md` §5 y ya se
> incumplió una vez.

**d-06 · Formulario de grabación.** Obligatorios primero: fecha, tipo, título, responsable, estado
inicial, avance. **Etiqueta encima del campo, nunca al lado.** Después ubicación con el nombre del lugar
prominente y el resto plegado. Luego descripción, entrega prevista, enlace al material y notas internas.

**d-07 · Supervisión, bandeja de observaciones.** Todas las actividades del equipo, con filtros por mes,
tipo, estado y responsable. **Arriba y destacado: las observaciones ya respondidas y pendientes de
cerrar** — si no destacan, las actividades se quedan detenidas y nadie lo nota. Se ve de quién es cada
actividad.

**d-08 · Supervisión, bandeja de feedback de AUNOR.** Comentarios del cliente esperando que supervisión
los atienda. Por cada uno: qué actividad o mes comenta, quién de AUNOR lo escribió, cuándo, y el texto.
Tres acciones: **descartar**, **responder** y **convertir en observación interna**.

> **El feedback de AUNOR no es una observación interna y no puede parecerlo.** Son cosas distintas: el
> del cliente **no cambia el estado de nada** y nunca llega directo al operario. Que se distingan a
> simple vista es el punto entero de esta pantalla.

**d-09 · Vista mensual de AUNOR.** Interfaz aparte, sin la navegación interna. Muestra el mes, **cuándo
se actualizó por última vez**, los totales agrupados —Programada · En trabajo · Entregada · Aprobada ·
Cancelada— y la lista de actividades con fecha, tipo, título, ubicación y estado.

**d-10 · AUNOR deja su opinión.** La misma vista con AUNOR escribiendo un comentario, y los comentarios
que ya dejó con su fecha.

**d-11 · Burson, tablero.** Lista de solicitudes con: solicitud, fecha, responsable de Rhino, material
solicitado, estado —**Solicitado · En proceso · Entregado · Aprobado · Cancelado**, que son los suyos,
no los siete—, **pendientes de Rhino** y **pendientes de Burson**. Esas dos columnas son el motivo de
existir del tablero y tienen que verse de un golpe.

**d-12 · Burson, ficha.** Una solicitud abierta con todos sus campos y sus fechas de entrega y
aprobación.

**d-13 · Cuentas.** Lista de personas con su rol y si están activas. Acciones de alta, cambio de rol y
desactivación.

**d-14 · Importación del histórico.** El paso de **simulación previa**: el archivo cargado y lo que
pasaría si se confirma, separado en **filas que entrarían** y **filas rechazadas con su motivo**, con
los totales. Botón de confirmar y botón de cancelar.

**d-15 · Historial mensual.** La tabla del mes: fecha, actividad, lugar, estado, **si tiene enlace al
material**, y las acciones **Ver** y **Editar**. Con buscador, filtro por estado, paginación y exportar.

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No** te apartes de `docs/sistema-diseno.md`. Los colores, la tipografía, las marcas de los siete
estados, la cabecera, el avatar, los botones y los campos son los que dice ese archivo. **Este es el
punto más importante del encargo:** las catorce pantallas móviles anteriores fallaron precisamente aquí.

**No** dibujes «Aprobar» sobre una actividad Observada.

**No** muestres acciones de supervisión en pantallas de colaborador. Solo en `d-05`, `d-07` y `d-08`.

**No** dibujes adjuntar archivos, contador de archivos ni botón de descargar. El material es un enlace.

**No** inventes métricas. Las tarjetas son cuatro: actividades, programadas, en proceso, finalizadas.

**No** inventes actividades. Rhino es una **productora**: graba, cubre, edita y produce piezas. **Nada
de radares, control de velocidad, monitoreo de tráfico ni aforo vehicular** — eso es el trabajo de la
concesionaria y ya se coló una vez.

**No** mezcles los estados de Burson con los siete de una actividad.

**No** enseñes a AUNOR nada interno: ni observaciones, ni respuestas internas, ni pendientes internos,
ni actividades dadas de baja.

**No** escribas «Midnight» ni «RAS». El nombre es **Rhino Audiovisuales**.

**No** dibujes móvil ni la pantalla de acceso. **No** modifiques nada fuera de `diseno/escritorio-png/`.
**No** crees andamiaje. **No** hagas commits. **No** escribas código de aplicación.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

1. Existen las **quince PNG** con los nombres exactos del bloque 1, horizontales, de al menos **1536 px
   de ancho**.
2. **Las quince parecen el mismo producto.** Misma cabecera, mismo avatar, misma barra lateral, mismos
   botones, mismos campos, mismos radios y la misma sombra dura. **Es el criterio principal.**
3. **Los siete estados se ven idénticos en todas las pantallas donde aparezcan**, según la tabla del
   sistema de diseño: mismo color, mismo fondo, mismo signo. Un estado no cambia de cara entre pantallas.
4. En `d-01` la actividad **Observada** salta a la vista sin buscarla.
5. En `d-05` **no aparece «Aprobar»** por ninguna parte.
6. En `d-08` el feedback de AUNOR **se distingue a simple vista** de una observación interna.
7. En `d-09` no aparece **ningún** dato interno.
8. En `d-11` los estados son los cinco de Burson, no los siete de una actividad.
9. `d-04` muestra los **cuatro pasos** del historial de estado y el texto literal de la observación y la
   respuesta.
10. Ninguna pantalla muestra nada de lo prohibido en el bloque 3.

**Sobre el texto:** se acepta texto imperfecto de un modelo de imagen. **No se acepta** contenido que
contradiga el bloque 2 o las reglas del sistema de diseño.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

1. `ls diseno/escritorio-png/` devuelve exactamente quince PNG con los nombres pedidos.
2. Cada archivo pesa más de 100 KB, es horizontal y mide al menos 1536 px de ancho.
3. **Abre las quince y descríbelas una por una.**
4. **Ponlas en fila y comprueba que parecen el mismo producto.** Si alguna se sale del sistema,
   **regenérala**. Di cuáles regeneraste.
5. Comprueba estado por estado que un mismo estado se ve igual en todas las pantallas donde sale. Si
   una lo dibuja distinto, **regenérala**.
6. Comprueba que en `d-05` no aparece «Aprobar».
7. Comprueba que no aparecen actividades de tráfico, radares ni control vehicular, ni «Midnight», ni
   «RAS», ni «alertas activas», ni «recursos asignados», ni botón de descargar.
8. Comprueba que `d-09` no filtra nada interno a AUNOR.
9. `git status` no muestra cambios fuera de `diseno/escritorio-png/`.

**Reporte:** corto. Resultado, los quince archivos, la verificación punto por punto, la descripción de
cada imagen en una línea, cuáles regeneraste y por qué, y **si alguna pantalla te obligó a inventar algo
que el sistema de diseño no cubría** — eso es un hueco del sistema y hay que saberlo.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte. **No inventes reglas de producto.**
