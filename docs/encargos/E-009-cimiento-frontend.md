# E-009 — Cimiento del frontend

**Fase:** 2 — Construcción frontend
**Ejecuta:** Codex
**Estado:** encargado
**Fecha:** 2026-08-17
**Formato:** OCRAV
**Imagen adjunta:** `diseno/piezas-png/pieza-2.png` — es la dirección visual aprobada por Marco. Ábrela
antes de escribir una sola línea de código. Es la única referencia de **forma**; todo lo demás dibujado
hasta ahora (`diseno/movil/`, `diseno/escritorio-png/`) tiene deriva conocida — ver INC-002 en
`docs/incidentes.md` — y solo sirve como referencia de **contenido**, nunca de forma.

---

```
┌─────────────────────────────┐
│ 1. OBJETIVO                 │
└─────────────────────────────┘
```

Levantar el cimiento del proyecto Next.js: el andamiaje, el sistema de diseño llevado a Tailwind y
componentes reutilizables, y **una sola página interna de verificación** que permita comparar el
resultado contra la imagen aprobada antes de construir ninguna pantalla de producto.

**No se construye ninguna pantalla de producto en este encargo.** Eso es el siguiente encargo, sobre
este cimiento.

Ruta del proyecto: `frontend/`.

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

**El producto.** Plataforma web interna de **Rhino Audiovisuales**, productora peruana que trabaja para
**Autopista del Norte (AUNOR)**. Estás en la Fase 2: construcción del frontend con **datos simulados**,
sin backend real.

### Léelo en este orden

1. **`diseno/piezas-png/pieza-2.png`** — ábrela primero. Es la imagen que manda.
2. **`docs/sistema-diseno.md`** — el lenguaje visual puesto en valores: paleta, tipografía, las tres
   familias de estado (los siete internos, los cinco que ve AUNOR, los cinco de Burson), y los elementos
   que se repiten. **Acaba de corregirse** para que coincida con la imagen; síguelo tal como está hoy.
3. **`CLAUDE.md`**, bloque `STACK — Frontend` — qué tecnología está autorizada y qué reglas rigen.
4. **`docs/decisiones.md`** — en especial D-017 (navegación), D-019 (siete estados), D-023 (el material
   es un enlace, nunca un archivo), D-028 (el avance solo en Edición y Creatividad), D-030 (un patrón de
   pantalla compartido), D-033 y D-041 (feedback de AUNOR).
5. **`protocolo-universal-v4.md`** — cómo se trabaja en este proyecto.

### Lo que hay que construir en este encargo

**A. El proyecto.**

- Next.js con **App Router**, **TypeScript en modo estricto**, **Tailwind CSS**.
- `npm run verify` que corra TypeScript, lint, pruebas (Vitest) y build, y termine en verde.
- Versiones estables actuales, fijadas en el lockfile. No perseguir versiones bleeding-edge.

**B. Los tokens de Tailwind**, extraídos de `docs/sistema-diseno.md` §2: los colores de papel, panel,
línea, tinta, y los tres acentos (azul, ámbar, rojo). No se inventan valores nuevos.

**C. Los componentes base:**

| Componente | Qué es |
|---|---|
| `StatusPill` | Los **siete** estados internos. **Píldora sólida**: fondo de color saturado, texto blanco (o tinta donde la tabla lo indique), con su signo. Ver `docs/sistema-diseno.md` §3 |
| `AunorStatusPill` | Los **cinco** grupos que ve AUNOR — §3 bis |
| `BursonStatusPill` | Los **cinco** estados propios de Burson, sin los signos de los siete — §3 bis |
| `Card` | Tarjeta plana: fondo blanco, borde fino, radio 4-6 px. **Sin sombra dura** |
| `Button` | Primario (ámbar) y secundario (borde, texto azul) |
| `Avatar` | Cuadrado de esquinas suaves, fondo ámbar, iniciales en tinta |
| `TopBar` | «Rhino Audiovisuales» a la izquierda, avatar y nombre a la derecha |
| `NavBar` | **Un solo componente con dos presentaciones** (D-017): barra inferior fija en móvil, barra lateral en escritorio. El destino activo en azul |
| `MonthStrip` | **Los doce meses del año**, con el número de actividades debajo de cada uno, el mes activo en azul sólido |
| `SummaryTile` | Icono grande en cuadro de color a la izquierda; a la derecha la cifra, su etiqueta y una línea de detalle |
| `FormField` | Etiqueta **encima** del campo, nunca al lado. Asterisco rojo si es obligatorio |

**D. La página de verificación**, en `/interno/sistema-diseno` (o ruta equivalente, fuera de la
navegación del producto). Muestra, con datos de ejemplo:

- Los siete `StatusPill`, los cinco `AunorStatusPill`, los cinco `BursonStatusPill`, todos en fila.
- Un `MonthStrip` completo con los doce meses.
- Cuatro `SummaryTile` de ejemplo.
- El `NavBar` en su presentación móvil y en su presentación de escritorio, una junto a otra.
- Dos `Card` de ejemplo, una con contenido corto y otra con contenido largo.
- Los dos `Button`.
- Un `FormField` de ejemplo con y sin asterisco.

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No** construyas ninguna pantalla de producto (P-1 a P-10). Solo el cimiento y la página de
verificación.

**No** uses ninguna librería de componentes UI (nada de shadcn, MUI, Chakra, etc.). Tailwind puro sobre
HTML semántico.

**No** te apartes de `docs/sistema-diseno.md`. Si algo que necesitas no está definido ahí, **detente y
anótalo en el reporte** — no lo inventes en silencio. Es exactamente el error que causó INC-002.

**No** dibujes sombras duras desplazadas en ningún componente. La imagen aprobada no las tiene.

**No** dibujes etiquetas de estado con contorno y fondo pálido. Son píldoras **sólidas**.

**No** recortes la fila de meses a los que tienen datos. Son **doce**, siempre.

**No** conectes nada real: sin Supabase, sin Auth, sin base de datos, sin `fetch` a ningún servidor. Los
datos de ejemplo son literales en el código.

**No** modifiques nada fuera de `frontend/`. **No** toques `diseno/`, `docs/`, `CLAUDE.md`,
`protocolo-universal-v4.md`, `actualizacion_del_requerimiento/`.

**No** hagas commits.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

1. `npm run verify` termina en verde: TypeScript sin errores, lint sin errores, pruebas en verde, build
   exitoso.
2. La página de verificación renderiza sin errores de consola, en `/interno/sistema-diseno`.
3. Los **siete** `StatusPill` están presentes, con relleno sólido de color y texto legible, cada uno con
   su signo.
4. El `MonthStrip` muestra **doce** meses.
5. Ningún componente tiene sombra dura desplazada.
6. El `NavBar` se ve correctamente en su presentación móvil (390 px) y en su de escritorio (1280 px).
7. **Comparación visual contra `pieza-2.png`:** el tratamiento de las píldoras de estado, la planitud de
   las tarjetas y el conteo de meses coinciden con la imagen aprobada.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

1. Ejecuta `npm run verify` y pega el resultado.
2. Levanta el servidor de desarrollo y usa `npx playwright screenshot` (el comando suelto, no hace falta
   escribir pruebas) para capturar `/interno/sistema-diseno` en dos anchos:
   - `frontend/.verificacion/movil.png` a 390×844
   - `frontend/.verificacion/escritorio.png` a 1280×800
3. Abre esas dos capturas tú mismo y descríbelas: ¿las píldoras son sólidas?, ¿hay doce meses?, ¿las
   tarjetas están planas?
4. Compáralas contra `diseno/piezas-png/pieza-2.png` línea por línea de la lista de aceptación y di si
   coinciden.
5. `git status` no muestra cambios fuera de `frontend/`.

**Reporte:** corto. Resultado de `npm run verify`, estructura de carpetas creada, lista de componentes
con una línea cada uno, resultado de la comparación visual, y **cualquier cosa que no estuviera definida
en `docs/sistema-diseno.md` y hayas tenido que resolver por tu cuenta** — repórtalo aunque lo hayas
resuelto bien; es información que el sistema de diseño necesita incorporar.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte. **No inventes reglas de producto.**
