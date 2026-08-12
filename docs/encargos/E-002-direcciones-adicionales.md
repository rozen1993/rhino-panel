# E-002 — Tres direcciones visuales adicionales

**Fase:** 1 — UX y desarrollo visual
**Ejecuta:** Codex
**Estado:** encargado
**Depende de:** E-001, ya entregado

Marco pide tres direcciones más, sobre las mismas tres pantallas, para elegir entre cinco.

El riesgo de este encargo no es el esfuerzo: es que las cinco acaben pareciéndose y decidir se vuelva
más difícil en vez de más fácil. Por eso cada dirección nueva tiene una **tesis propia** y ocupa un
territorio que A y B no ocupan.

---

## 1. Contexto

Leer antes de ejecutar:

- `docs/encargos/E-001-direccion-visual.md` — el contrato original. **Sigue vigente entero.**
- `diseno/direccion-a.html` y `diseno/direccion-b.html` — lo ya entregado.
- `docs/fase-1-ux.md` — navegación y patrones.

Las dos direcciones existentes ocupan estos territorios, y **ninguna de las nuevas puede repetirlos**:

- **A — Operativa.** Tipografía de sistema, bordes duros, sombra sólida, ámbar sobre azul marino.
  Instrumento de trabajo.
- **B — Editorial.** Georgia serif, crema y coral, formas asimétricas, sombras suaves. Productora
  audiovisual.

---

## 2. Tarea

Tres archivos HTML autónomos más, con **exactamente el mismo contenido** que `direccion-a.html`:

### `diseno/direccion-c.html` — Institucional

El lenguaje de una concesionaria de autopista. Sobria, corporativa, azul y gris, alineada, casi
tabular. Transmite formalidad y fiabilidad; es la que un cliente como AUNOR reconocería como «un
sistema serio». Sin gestos gráficos llamativos: el orden es la estética.

### `diseno/direccion-d.html` — Campo, en oscuro

Interfaz oscura por defecto. Pensada para grabaciones nocturnas, para no deslumbrar en cabina y para
gastar menos batería en jornadas largas. Alto contraste, superficie casi negra, y el color usado como
**señal pura**: si algo brilla, es porque exige atención. Es la más distinta de todas en primera
impresión.

### `diseno/direccion-e.html` — Señalética vial

Identidad tomada del entorno real del trabajo: señalización de carretera. Tipografía condensada y
robusta, amarillo y negro, franjas diagonales, formas de señal, jerarquía de mensaje de vía. Es la
dirección con más carácter y también la más arriesgada: puede resultar potente o puede resultar un
disfraz. Ejecutarla en serio, no como broma, para que Marco pueda juzgarla de verdad.

---

## 3. Contrato

**Todo el contrato de E-001 sigue vigente**: mismas tres pantallas en el mismo orden (muestrario, P-2
Mis actividades, P-3 detalle de una Observada, P-4 formulario de grabación), HTML y CSS puros en un
solo archivo, sin dependencias ni recursos externos, mobile-first a 390 px, contraste AA, ninguna
acción de supervisión visible, sin backend, sin logotipos inventados, y prohibido crear andamiaje.

A eso se añade lo específico de este encargo:

- **Mismo contenido literal que `direccion-a.html`.** Los mismos títulos, los mismos nombres, los
  mismos kilómetros, las mismas fechas, los mismos porcentajes, la misma observación y la misma
  respuesta. **Lo único que cambia es el lenguaje visual.** Si el contenido varía entre direcciones, la
  comparación deja de ser válida y el encargo falla.
- **Los siete estados siguen distinguiéndose sin depender solo del color**, también en la dirección
  oscura, donde es más difícil.
- **Observada sigue leyéndose como «esto te está esperando»** en las tres.
- En la dirección oscura, cuidar que el contraste AA se cumpla **sobre fondo oscuro**, que es donde más
  se falla: texto gris medio sobre negro suele no llegar.
- Ninguna de las tres puede parecerse a A ni a B. Si al ponerlas en fila dos resultan intercambiables,
  el encargo falló.

---

## 4. Fronteras

**Permitido crear o modificar:**

- `diseno/direccion-c.html`
- `diseno/direccion-d.html`
- `diseno/direccion-e.html`
- `diseno/README.md` — actualizarlo para que liste las cinco.

**Prohibido tocar:** `diseno/direccion-a.html`, `diseno/direccion-b.html`, `docs/`, `CLAUDE.md`,
`protocolo-universal-v4.md`, `.gitignore` y cualquier archivo fuera de `diseno/`.

**Prohibido crear:** `package.json`, `node_modules`, configuración de build o cualquier andamiaje.

**Efectos externos:** ninguno. Sin red, sin instalaciones, sin commits.

---

## 5. Verificación

1. Los tres archivos abren sin errores de consola.
2. Ningún `<script src=`, `<link href="http`, `@import url(http`, `fetch(`, ni referencia a Supabase.
3. No existe `package.json` ni `node_modules`.
4. Cada archivo contiene las siete etiquetas de estado y las tres pantallas.
5. A 390 px no hay scroll horizontal en ninguna pantalla de ninguna dirección.
6. No aparece «Aprobar», «Observar» ni «Cancelar» como acción disponible.
7. Los títulos, nombres, fechas y porcentajes coinciden literalmente con `direccion-a.html`.
8. `direccion-a.html` y `direccion-b.html` quedan sin modificar.
9. `git status` no muestra cambios fuera de `diseno/`.

---

## 6. Reporte

Corto: resultado, archivos tocados, verificación punto por punto, decisiones locales, y dudas o riesgos
restantes. En especial, di si alguna de las tres te parece demasiado cercana a otra.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte.
