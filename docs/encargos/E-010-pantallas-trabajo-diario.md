# E-010 — Pantallas del trabajo diario (P-2, P-3, P-4, P-10)

**Fase:** 2 — Construcción frontend
**Ejecuta:** Codex
**Estado:** encargado
**Fecha:** 2026-08-17
**Formato:** OCRAV
**Imagen adjunta:** `diseno/piezas-png/pieza-2.png` — la dirección visual aprobada por Marco. Ábrela
antes de escribir código. Es la única referencia de forma. Ver también `docs/sistema-diseno.md`, que ya
está en código en `frontend/components/`.

---

```
┌─────────────────────────────┐
│ 1. OBJETIVO                 │
└─────────────────────────────┘
```

Construir, **sobre el cimiento ya existente en `frontend/`**, las pantallas que un colaborador usa todos
los días. **Móvil primero** (D-042); el ancho de escritorio se ajusta en un encargo posterior.

Rutas de página dentro de `frontend/app/`:

```
/actividades              P-2 · lista de un colaborador (Johann)
/actividades?rol=coord    P-2 · variante de Coordinación (Chiara), ve las de todos
/actividades/[id]         P-3 · detalle de una actividad
/actividades/nueva        P-4 · formulario de nueva actividad
/historial                P-10 · historial mensual en tabla/lista
```

Elige tú la forma exacta de las rutas si el patrón de arriba no encaja con App Router; lo que importa es
que las cinco pantallas existan y naveguen entre sí.

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

**No partas de cero.** Ya existen en `frontend/components/`: `StatusPill`, `AunorStatusPill`,
`BursonStatusPill`, `Card`, `Button`, `Avatar`, `TopBar`, `NavBar`, `MonthStrip`, `SummaryTile`,
`FormField`. **Reutilízalos.** Si te falta un componente, créalo siguiendo el mismo patrón y añádelo a
`docs/sistema-diseno.md` — no lo dejes solo en el código.

### Léelo en este orden

1. `diseno/piezas-png/pieza-2.png` — la imagen madre.
2. `docs/sistema-diseno.md` — ya actualizado con los hex exactos de AUNOR y Burson.
3. `frontend/app/interno/sistema-diseno/page.tsx` — cómo se usan hoy los componentes; imítalo.
4. `docs/fase-0-concepcion.md` §3 (campos), §5 (estados), §7 (P-2, P-3, P-4).
5. `docs/decisiones.md` — en especial D-002/D-003 (quién ve qué), D-007 (editar hasta Aprobada), D-008
   (enlace obligatorio según tipo), D-017 (navegación), D-023 (el material es un enlace, nunca un
   archivo — **no hay `<input type="file">` en ningún formulario**), D-028 (el avance **solo** en
   Edición y Creatividad), D-030 (patrón compartido entre roles).
6. `diseno/movil/m-01…m-14` — **solo para el contenido y el texto**, nunca para la forma. Tienen la
   deriva de INC-002.

### Datos de ejemplo — literales, los mismos en todas las pantallas

| Fecha | Tipo | Título | Responsable | Estado | Avance |
|---|---|---|---|---|---|
| Hoy 08:30 | Grabación | Cobertura de mantenimiento en peaje Chillón | Johann | **Observada** | — |
| 13 ago 06:00 | Operación | Cierre de carril por instalación de señal | Martín | Programada | — |
| 11 ago 15:20 | Edición | Resumen semanal de seguridad vial | Eduardo | En proceso | 55% |
| 10 ago 17:40 | Creatividad | Piezas para campaña «Vuelve seguro» | Chiara | Por subir | 100% |
| 08 ago 11:00 | Coordinación | Agenda de rodaje con cuadrilla norte | Chiara | Entregada | — |

**El avance solo se muestra en Edición y Creatividad (D-028).** Grabación, Operación y Coordinación no
llevan barra de avance — la fila se ve bien sin ella, no como un hueco vacío.

**Observación y respuesta de la actividad del peaje Chillón (D-023: sin adjuntos):**

> **Chiara, 12 ago 09:18:** «El plano del panel variable termina antes de mostrar el tránsito. Añade 8
> segundos y nivela el audio ambiente.»
>
> **Johann, 12 ago 10:42:** «Plano extendido y audio nivelado. Reemplacé el archivo en el mismo enlace.»

**Historial de estado completo, los cuatro pasos:** Observada (Chiara, 12 ago 09:18) · Por subir
(Johann, 12 ago 08:54) · En proceso (Johann, 12 ago 07:58) · Programada (Chiara, 10 ago 16:30).
**Última modificación: hoy 10:42 por Johann.**

**Ubicación de esa actividad:** peaje Chillón, caseta norte, Km 25.4, sentido Norte → Sur. Nombre del
lugar prominente en el formulario; el resto plegado (D-029).

### Qué contiene cada pantalla

**P-2 · Actividades (colaborador).** `MonthStrip` con agosto activo. Cuatro `SummaryTile`: total,
programadas, en proceso, finalizadas. Debajo, las cinco actividades en `Card`, **la Observada primero y
destacada**. Botón «Nueva actividad» alcanzable con el pulgar. `NavBar` con Actividades y Perfil.

**P-2 · Variante de Coordinación.** Mismas actividades, pero cada tarjeta **dice de quién es**
(Coordinación ve todo, D-030). `NavBar` añade Burson.

**P-3 · Detalle.** Ficha completa: fecha, tipo, responsable, quién la creó, descripción, entrega
prevista, ubicación, enlace al material (un link, nunca un adjunto), la observación y su respuesta si la
actividad es Observada, el historial de cuatro pasos, y **cuándo se modificó por última vez** (D-007).
Acciones de colaborador solamente: editar, avanzar de estado. **Si el estado es Aprobada, la ficha está
cerrada: sin acciones de edición.**

**P-4 · Formulario de nueva actividad.** Obligatorios primero: fecha, tipo, título, responsable, estado
inicial. Etiqueta **encima** del campo (`FormField` ya lo hace). Después ubicación —nombre del lugar
grande, el resto plegado—. El avance **solo aparece si el tipo es Edición o Creatividad**. Luego
descripción, entrega prevista, enlace al material, notas. El campo de enlace es una URL de texto, nunca
un selector de archivo.

Añade también el **aviso de borrador local**: aparece cuando hay contenido sin guardar en el servidor —
«Guardado en este teléfono · Todavía no llegó al servidor», con botón de reintentar. No hace falta
persistencia real todavía: puede ser un estado de React que se dispara al escribir en el formulario, con
un `setTimeout` simulando el envío. Lo que importa es que el patrón visual exista y sea reutilizable
cuando en la Fase 6 se conecte al servidor de verdad.

**P-10 · Historial mensual.** Buscador, filtro por estado, las cinco actividades en lista de fichas
(no tabla: no cabe en 390 px), con fecha, título, lugar, estado, si tiene enlace, y **Ver** / **Editar**
— **no hay Descargar** (D-024). Botón «Exportar».

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No** construyas P-1 (acceso), P-5 (supervisión), P-6 (AUNOR), P-7 (Burson), P-8 (cuentas), P-9
(importación) ni la portada. Son encargos posteriores.

**No** conectes nada real. Los datos son un array literal en el código o un archivo de fixtures — sin
`fetch`, sin Supabase, sin base de datos.

**No** dibujes «Aprobar», «Observar» ni «Cancelar» en estas pantallas. Son de colaborador.

**No** muestres avance en Grabación, Operación ni Coordinación.

**No** incluyas ningún control de subir archivo. El material es siempre un enlace de texto.

**No** te apartes de los componentes existentes en `frontend/components/`. Si necesitas uno nuevo,
créalo con el mismo criterio visual y regístralo en `docs/sistema-diseno.md`.

**No** dibujes escritorio en este encargo. Solo móvil, 390 px de referencia.

**No** modifiques `diseno/`, `docs/` (salvo añadir componentes nuevos a `sistema-diseno.md` si hace
falta), `CLAUDE.md`, `protocolo-universal-v4.md`.

**No** hagas commits.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

1. `npm run verify` en verde.
2. Las cinco pantallas existen y se navega entre ellas: de la lista al detalle, del detalle a editar,
   de la lista a nueva actividad, de la lista al historial.
3. En la lista del colaborador, la actividad Observada **se distingue sin buscarla**.
4. El formulario **no muestra avance** salvo que el tipo sea Edición o Creatividad.
5. El detalle de la actividad Observada muestra el texto literal de la observación y la respuesta, y
   los cuatro pasos del historial.
6. Una actividad Aprobada no ofrece ninguna acción de edición.
7. Ningún formulario tiene un campo de subir archivo.
8. La variante de Coordinación muestra el responsable de cada actividad.
9. El aviso de borrador local aparece y tiene botón de reintentar.
10. Todo se ve fiel a `pieza-2.png`: píldoras sólidas, tarjetas planas, sin sombra dura.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

1. `npm run verify` — pega el resultado.
2. Levanta el servidor y usa `npx playwright screenshot` para capturar, a 390×844, cada una de las
   cinco pantallas en `frontend/.verificacion/`: `p2-colaborador.png`, `p2-coordinacion.png`,
   `p3-detalle-observada.png`, `p4-formulario.png`, `p10-historial.png`.
3. Abre esas capturas y descríbelas una por una.
4. Compáralas contra `pieza-2.png` en los tres puntos críticos de siempre: píldoras sólidas, sin sombra
   dura, meses completos donde aplique.
5. `git status` no muestra cambios fuera de `frontend/`.

**Reporte:** corto. Resultado de `npm run verify`, rutas creadas, capturas, comparación visual, y
cualquier decisión de contenido o de componente que hayas tenido que tomar por tu cuenta.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte. **No inventes reglas de producto.**
