# E-004 — Tres direcciones visuales adicionales (segunda ronda)

**Fase:** 1 — UX y desarrollo visual
**Ejecuta:** Codex
**Estado:** encargado
**Depende de:** E-001 y E-002, ya entregados; E-003, que corrigió los muestrarios de C, D y E

Marco pide tres direcciones más, sobre las mismas pantallas que las cinco anteriores, para tener ocho
entre las que elegir.

El riesgo de este encargo es el mismo que el de E-002, agravado por el número: cuantas más direcciones
existen, más fácil es que la nueva se parezca a alguna vieja sin darse cuenta. Por eso cada dirección
nueva tiene una **tesis propia** y ocupa un territorio que ninguna de las cinco existentes ocupa.

---

## 1. Contexto

Leer antes de ejecutar:

- `docs/encargos/E-001-direccion-visual.md` — el contrato original. **Sigue vigente entero.**
- `docs/encargos/E-002-direcciones-adicionales.md` — el precedente directo de este encargo.
- `diseno/direccion-a.html` a `diseno/direccion-e.html` — las cinco ya entregadas. Abrirlas, no solo
  leer su descripción: el parecido que hay que evitar es visual, no solo verbal.
- `docs/fase-1-ux.md` — navegación y patrones.

Las cinco direcciones existentes ocupan estos territorios, y **ninguna de las tres nuevas puede
repetirlos**:

- **A — Operativa.** Tipografía de sistema, bordes duros de 2 px, sombra sólida, ámbar sobre azul
  marino casi negro. Instrumento de trabajo, densa.
- **B — Editorial.** Georgia serif, crema y coral, esquinas asimétricas, sombras suaves. Productora
  audiovisual con identidad de marca fuerte.
- **C — Institucional.** Arial, azul y gris, alineada y casi tabular. Concesionaria de autopista, orden
  como estética.
- **D — Nocturna.** Oscura por defecto, alto contraste, color como señal pura de atención. Pensada para
  grabar de noche y ahorrar batería.
- **E — Señalética vial.** Arial Narrow condensada, amarillo y negro, franjas y formas de señal de
  carretera.

---

## 2. Tarea

Tres archivos HTML autónomos más, con el mismo contenido de fondo que `direccion-a.html` en las tres
pantallas (el muestrario es propio de cada dirección, igual que ya corrigió E-003):

### `diseno/direccion-f.html` — Minimalista, calma

Registro de aplicación moderna y espaciosa: mucho aire entre elementos, esquinas muy redondeadas (12–16
px), sombras suaves y difusas, un único color de acento (violeta o índigo) sobre superficie neutra
clara. Tipografía de sistema pero con más interlineado y menos densidad que A. Transmite calma y
cuidado, no urgencia ni burocracia. Es la más parecida a una app de productividad actual.

### `diseno/direccion-g.html` — Cálida, humana

Paleta de tonos tierra: terracota, arena, verde musgo u oliva, sin negro puro en ningún sitio. Formas
redondeadas y orgánicas, sensación de equipo pequeño y cercano en vez de corporación. Sans-serif, no
serif —para no acercarse a B—, con calidez que viene del color y la forma, no de la tipografía.

### `diseno/direccion-h.html` — Técnica, densa

Tipografía monoespaciada en toda la interfaz. Grilla apretada, alineación estricta, alta densidad de
información por pantalla —lo opuesto a F—. Registro de panel de control técnico: piensa en la estética
de una herramienta de desarrollo o de un dashboard de operaciones, no en la de una app de consumo.
Superficie clara o gris muy claro (no oscura, para no repetir a D) con un acento verde o cian de señal.

Deben ser tres direcciones **de verdad distintas entre sí y de las cinco anteriores**. Si al ponerlas en
fila de ocho alguna resulta intercambiable con otra, el encargo falló.

---

## 3. Contrato

**Todo el contrato de E-001 sigue vigente**, con la corrección de E-003 ya incorporada:

- Mismas tres pantallas, en el mismo orden: **muestrario** (propio de cada dirección: su paleta real
  con hexadecimales, su escala tipográfica real y las siete etiquetas de estado tal como se ven en esa
  dirección), **P-2 Mis actividades**, **P-3 detalle de una actividad Observada**, **P-4 formulario de
  grabación**.
- **Contenido literal idéntico al de `direccion-a.html` en las tres pantallas** (no en el muestrario):
  los mismos títulos, nombres, kilómetros, fechas, porcentajes, la misma observación y la misma
  respuesta. Si el contenido de las pantallas varía entre direcciones, la comparación deja de ser válida
  y el encargo falla.
- HTML y CSS puros en un solo archivo por dirección. Sin dependencias, sin CDN, sin fuentes remotas, sin
  imágenes externas, sin framework. JavaScript solo si es imprescindible; preferible ninguno.
- Mobile-first, ancho de referencia 390 px. No debe romperse en escritorio.
- **Los siete estados se distinguen sin depender solo del color**, en las tres direcciones nuevas
  también, incluida H a pesar de su densidad.
- **Observada se lee como «esto te está esperando»**, la señal más importante de la pantalla, en las
  tres.
- Contraste AA como mínimo en todo texto, en las tres — cuidado especial en H por la densidad y en G por
  los tonos tierra claros.
- **Ninguna acción de supervisión** —observar, aprobar, cancelar— puede aparecer: son vistas de
  colaborador.
- Nada de backend: ningún `fetch`, ningún formulario que envíe, ninguna referencia a Supabase.
- Sin logotipos de Rhino ni de AUNOR.
- Datos de ejemplo verosímiles, coherentes con los ya usados en A–E (Johann, Eduardo, Chiara, Martín,
  kilómetros, sentido de calzada, fechas).

---

## 4. Fronteras

**Permitido crear o modificar:**

- `diseno/direccion-f.html`
- `diseno/direccion-g.html`
- `diseno/direccion-h.html`
- `diseno/README.md` — actualizarlo para que liste las ocho.

**Prohibido tocar:** `diseno/direccion-a.html` a `diseno/direccion-e.html`, `docs/`, `CLAUDE.md`,
`protocolo-universal-v4.md`, `.gitignore` y cualquier archivo fuera de `diseno/`.

**Prohibido crear:** `package.json`, `node_modules`, configuración de build o cualquier andamiaje.

**Efectos externos:** ninguno. Sin red, sin instalaciones, sin commits.

---

## 5. Verificación

1. Los tres archivos abren sin errores de consola.
2. Ningún `<script src=`, `<link href="http`, `@import url(http`, `fetch(`, ni referencia a Supabase.
3. No existe `package.json` ni `node_modules`.
4. Cada archivo contiene las siete etiquetas de estado y las tres pantallas, más su propio muestrario.
5. A 390 px no hay scroll horizontal en ninguna pantalla de ninguna dirección.
6. No aparece «Aprobar», «Observar» ni «Cancelar» como acción disponible.
7. En las tres pantallas (no en el muestrario), los títulos, nombres, fechas y porcentajes coinciden
   literalmente con `direccion-a.html`.
8. `direccion-a.html` a `direccion-e.html` quedan sin modificar.
9. `git status` no muestra cambios fuera de `diseno/`.

---

## 6. Reporte

Corto: resultado, archivos tocados, verificación punto por punto, decisiones locales, y dudas o riesgos
restantes. En especial, di si alguna de las tres nuevas te parece demasiado cercana a alguna de las
cinco existentes o entre sí.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte.
