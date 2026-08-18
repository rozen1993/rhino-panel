# E-012 — Tablet, laptop y escritorio

**Fase:** 2 — Construcción frontend
**Ejecuta:** Codex
**Estado:** encargado
**Fecha:** 2026-08-17
**Formato:** OCRAV
**Imagen adjunta:** `diseno/piezas-png/pieza-2.png` — **es literalmente el diseño de escritorio
aprobado.** Para este encargo no hay que interpretarla: hay que parecerse a ella.

---

```
┌─────────────────────────────┐
│ 1. OBJETIVO                 │
└─────────────────────────────┘
```

Hacer que **todo el frontend ya construido** funcione en tablet, laptop y escritorio, sin romper el
móvil, que es lo que manda (D-042) y ya está aprobado.

Anchos de referencia:

| | Ancho | Tailwind | Qué cambia |
|---|---|---|---|
| Móvil | 390 px | (base) | **No se toca.** Ya está aprobado |
| Tablet | 768 px | `md:` | Más aire, tarjetas en dos columnas, la navegación sigue abajo |
| Laptop | 1024 px | `lg:` | **Navegación pasa a barra lateral**, listas pasan a tabla |
| Escritorio | 1280 px | `xl:` | Como la imagen aprobada |

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

### Léelo en este orden

1. `diseno/piezas-png/pieza-2.png` — el destino exacto para 1280 px.
2. `frontend/components/mobile-shell.tsx` — el bloqueador principal, ver abajo.
3. `frontend/components/nav-bar.tsx` — **ya tiene** `presentation: "mobile" | "desktop"`, con la
   variante lateral construida. Aprovéchalo, no lo reescribas.
4. `docs/sistema-diseno.md` §6 (anchos) y §4 (elementos que se repiten).
5. `docs/decisiones.md` — **D-017** (barra inferior en móvil, lateral en escritorio) y **D-042** (el
   móvil manda; esto es adaptación, no rediseño).

### Los tres trabajos reales

**A · El contenedor.** `MobileShell` tiene `max-w-[390px]` clavado, así que hoy la aplicación se ve
estrecha en cualquier pantalla grande. Hay que convertirlo en un shell responsivo:

- hasta `lg`: como está hoy — ancho de móvil, `TopBar` arriba, `NavBar` abajo;
- desde `lg`: ancho completo, **`NavBar` en presentación `desktop` a la izquierda**, contenido a la
  derecha, sin barra inferior.

Renómbralo a `AppShell` si te parece más honesto, y actualiza todos los usos. Es un solo componente y
lo usan todas las páginas: hacerlo bien aquí arregla la mitad del encargo.

**B · De fichas a tablas, desde `lg`.** En móvil las listas son fichas apiladas porque no cabe otra
cosa. En la imagen aprobada son **tablas con columnas**. Afecta a:

- **P-2 · Actividades** → tabla: fecha, actividad, ubicación, estado, acciones. En la variante de
  Coordinación, añade la columna de responsable.
- **P-10 · Historial** → tabla: fecha, actividad, lugar, estado, si tiene enlace, acciones (Ver /
  Editar, sin Descargar).
- **P-7 · Burson** → tabla, con **pendientes de Rhino** y **pendientes de Burson** como columnas
  propias y visibles; son el motivo del módulo.
- **P-8 · Cuentas** → tabla: persona, rol o roles, estado, acciones.
- **P-9 · Importación** → las filas aceptadas y rechazadas en tabla, con el motivo del rechazo en su
  columna.
- **P-6 · AUNOR** → tabla: fecha, tipo, actividad, ubicación, estado agrupado.

Mantén la versión de fichas para móvil. Puedes renderizar ambas y alternarlas con `hidden lg:table` /
`lg:hidden`, o extraer un componente que decida — elige lo que deje el código más limpio y dilo en el
reporte.

**C · Los ajustes de proporción.** Esto sí es puro Tailwind:

- Tarjetas de resumen: 2×2 en móvil → **4 en fila** desde `lg`.
- `MonthStrip`: los doce meses ya están; en móvil se comprimen, desde `md` respiran.
- Formularios: un campo por fila en móvil → **dos columnas** desde `lg` donde tenga sentido. La etiqueta
  sigue **encima** del campo siempre, nunca al lado.
- Detalle de actividad (P-3): en escritorio, ficha a la izquierda e historial de estado a la derecha,
  como columna lateral.

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No rompas el móvil.** Es lo aprobado y lo que más importa (D-042). Si una pantalla se ve peor a
390 px después de tu cambio, el cambio está mal.

**No** rediseñes nada. Esto es adaptar a otros anchos lo que ya existe, no repensar pantallas.

**No** cambies contenido, textos ni datos de ejemplo.

**No** introduzcas colores, sombras ni radios nuevos. Sombra dura sigue prohibida; píldoras sólidas.

**No** uses una librería de UI ni de tablas. Tailwind y HTML semántico (`<table>`, `<thead>`, `<tbody>`,
`<th scope="col">`).

**No** conectes nada real. Sin `fetch`, sin backend.

**No** hagas commits.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

1. `npm run verify` en verde.
2. **A 390 px, todas las pantallas se ven exactamente como antes.** Es el criterio más importante.
3. A 1280 px, la navegación es una **barra lateral** y no hay barra inferior.
4. A 1280 px, P-2 y P-10 son **tablas**, no fichas estiradas ocupando todo el ancho.
5. A 1280 px, el panel de actividades se parece a `pieza-2.png`: barra lateral, doce meses, cuatro
   tarjetas de resumen en fila, tabla debajo.
6. A 768 px nada se rompe ni se solapa.
7. Sigue sin haber sombras duras, y las píldoras de estado siguen sólidas.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

1. `npm run verify` — pega el resultado. (Si PowerShell bloquea `npm`, usa `npm.cmd`.)
2. Capturas con `npx playwright screenshot` de **cada pantalla en tres anchos**, a
   `frontend/.verificacion/`: sufijo `-390`, `-768`, `-1280`.
3. **Compara cada captura de 390 px con la que ya existía antes de este encargo.** Si alguna cambió,
   dilo: es una regresión salvo que la justifiques.
4. Compara las de 1280 px con `pieza-2.png` y di si coinciden en estructura.
5. `git status` no muestra cambios fuera de `frontend/`.

**Reporte:** qué pantallas adaptaste, cómo resolviste la alternancia ficha/tabla, si algo del móvil
cambió y por qué, y qué te obligó a inventar algo que el sistema de diseño no cubría.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo. **Prioriza no romper el móvil sobre cualquier otra cosa.**
