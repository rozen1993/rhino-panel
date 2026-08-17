# E-005 — Cinco direcciones visuales en escritorio

**Fase:** 1 — UX y desarrollo visual
**Ejecuta:** Codex
**Estado:** encargado
**Fecha:** 2026-08-17
**Sustituye a:** E-001, E-002 y E-004, cuyas ocho direcciones quedaron obsoletas por el requerimiento v2

Marco necesita elegir la dirección visual definitiva. Este encargo produce **cinco direcciones
alternativas en escritorio**, sobre las mismas pantallas, con el producto real dentro.

Resuelve **D-031**, y con ella desbloquea **D-018** y la puerta de salida de la Fase 1.

---

## 1. Por qué las ocho anteriores no sirven

Léelo antes de empezar, porque explica en qué no hay que reincidir.

Las ocho direcciones de `diseno/direccion-a.html` … `direccion-h.html` se produjeron entre el 12 y el 17
de agosto **sobre un requerimiento caduco**. Están bien hechas y se conservan, pero fallan en tres cosas
a la vez:

1. **Son de móvil**, y ahora se decide primero el escritorio (D-042).
2. **No conocían la restricción de marca**: se encargaron sin saber que la línea gráfica debe alinearse
   a la identidad visual de AUNOR.
3. **No contienen el producto real**: les faltan la navegación por meses con contadores, las tarjetas de
   resumen, el historial en tabla con exportación, el enlace a OneDrive y el feedback de AUNOR.

Ver `docs/incidentes.md` → INC-001. La lección: **no inventes lo que no está decidido, y usa lo que sí
lo está.**

---

## 2. Contexto — leer antes de ejecutar

- `docs/fase-0-concepcion.md` — qué es el producto. Interesan §3 (campos), §5 (estados), §7 (pantallas)
  y §8 (AUNOR).
- `docs/decisiones.md` — las veintiuna decisiones cerradas. **En especial D-019, D-023, D-033 y D-042**,
  que son de ayer y cambian lo que hay que dibujar.
- `docs/impacto-requerimiento-v2.md` — qué cambió con el requerimiento v2.
- `actualizacion_del_requerimiento/` — la ficha v2 del cliente en PDF. **Los tres mockups `.webp` están
  descritos abajo porque probablemente no puedas verlos.**
- `diseno/direccion-a.html` … `direccion-h.html` — lo ya hecho, para no repetir territorios.

### Qué muestran los mockups del cliente

Son tres capturas generadas con IA. Su valor es que enseñan **qué tiene el cliente en la cabeza**; su
límite es que se contradicen entre sí y llevan el nombre de marca equivocado.

- **Portada tipo roster:** fondo azul marino muy oscuro con fotografía de intercambio vial y líneas de
  neón cian; título gigante «CONTROL DE ACTIVIDADES»; una tarjeta por persona con ícono circular de
  color, nombre, rol, píldora verde «Activo», número de actividades, última actualización y botón verde
  lima «Ingresar».
- **Panel de trabajo:** cabecera oscura con avatar y campana; **barra lateral izquierda oscura** con Mi
  panel, Nueva actividad, Historial mensual, Archivos y selector de año; fila de meses con el contador
  debajo de cada uno y el mes activo en verde; cuatro tarjetas de resumen; formulario de registro a la
  izquierda; y a la derecha una tabla de historial con buscador, filtro, paginación y botón de exportar.
- La paleta que proponen es **azul marino casi negro + cian + verde lima**, con fotografía de autopista.

---

## 3. Tarea

Cinco archivos HTML autónomos en `diseno/escritorio/`, cada uno una dirección visual completa:

### `pieza-1.html` — La propuesta del cliente, bien ejecutada

El lenguaje de los mockups —azul marino muy oscuro, cian, verde lima, sensación de autopista de
noche— **hecho en serio**: con el nombre correcto, con contraste AA de verdad, con los siete estados y
con el producto real dentro. Marco tiene que poder comparar «lo que pidió el cliente» contra las
alternativas, así que esta pieza tiene que ser la mejor versión posible de esa idea, no una caricatura.

### `pieza-2.html` a `pieza-5.html` — Cuatro alternativas

Cuatro direcciones **claramente distintas entre sí y distintas de la 1**, cada una con una tesis propia.
Todas tienen que seguir siendo creíbles como herramienta de una productora que trabaja para una
concesionaria de autopista: nada de estética de aplicación de consumo ni de juguete.

Elige tú las cuatro tesis y explícalas en el reporte. Dos condiciones:

- **Ninguna puede repetir el territorio de otra ni el de la pieza 1.** Si al ponerlas en fila dos
  resultan intercambiables, el encargo falló.
- **Al menos una debe ser clara**, de fondo claro. Cinco interfaces oscuras no son cinco opciones.

---

## 4. Contrato

### Las cuatro secciones de cada archivo, en este orden

**1 · Muestrario.** La paleta **real de esa dirección** con sus hexadecimales, la escala tipográfica
real, y **las siete etiquetas de estado**: Programada, En proceso, Por subir, Entregada, Observada,
Aprobada, Cancelada.

> Los hexadecimales que declare el muestrario tienen que existir de verdad en el CSS de ese archivo. En
> un encargo anterior tres direcciones declararon la paleta de otra y hubo que corregirlo.

**2 · P-2 · Mi panel.** La pantalla de trabajo de Johann, en escritorio. Debe contener:

- barra lateral con los destinos y el selector de año;
- navegación por meses con **el número de actividades bajo cada mes** y el mes activo destacado;
- **tarjetas de resumen por estado**;
- **tabla de historial del mes** con buscador, filtro por estado, paginación y **exportar reporte
  mensual**;
- columnas: fecha, actividad, lugar, estado, **si tiene enlace al material**, y acciones;
- por fila, dos acciones: **Ver** (abre la carpeta de OneDrive) y **Editar**. **No hay descargar.**

**3 · P-3 · Detalle de una actividad Observada.** La ficha completa: ubicación, enlace al material,
**la observación con su respuesta**, el historial de cambios de estado con autor y fecha, y **cuándo se
modificó por última vez**. Solo acciones de colaborador.

**4 · P-5 · Panel de supervisión.** La pantalla que hace que esto sea un sistema de supervisión y no una
lista. Debe distinguir de un vistazo **dos bandejas**:

- **observaciones ya respondidas y pendientes de cerrar** — si no destacan, las actividades se quedan
  detenidas sin que nadie lo note;
- **feedback de AUNOR pendiente de atender** — comentarios del cliente que esperan que supervisión los
  descarte, los responda o los convierta en observación interna.

Aquí sí aparecen las acciones de supervisión: observar, aprobar, cancelar.

### Reglas que no se pueden romper

- **Escritorio primero**, ancho de referencia **1280 px**. No debe romperse hasta 1024 px. El móvil es
  un encargo posterior: **no lo dibujes**, pero no diseñes nada que sea imposible de estrechar después.
- **HTML y CSS puros, un solo archivo por dirección.** Sin dependencias, sin CDN, sin fuentes remotas,
  sin imágenes externas, sin framework. JavaScript solo si es imprescindible; preferible ninguno.
- **Sin fotografías.** Los mockups usan una foto de autopista; tú no puedes incrustar imágenes externas.
  Si una dirección necesita esa sensación, consíguela con CSS —degradados, formas, líneas— y dilo en el
  reporte.
- **Los siete estados se distinguen sin depender solo del color.** Forma, peso, borde o texto cargan
  parte del trabajo.
- **Observada se lee como «esto te está esperando»**, y en P-5 el feedback de AUNOR se distingue a
  simple vista de una observación interna: **son cosas distintas y no deben confundirse nunca**.
- **Contraste AA como mínimo** en todo texto, también sobre fondo oscuro, que es donde más se falla.
- **El nombre es «Rhino Audiovisuales».** Los mockups del cliente dicen «Midnight & RAS Audiovisuales» y
  es un error suyo. **No lo copies.** Sin logotipos inventados de Rhino ni de AUNOR: basta el nombre en
  texto.
- **Nada de backend**: ningún `fetch`, ningún formulario que envíe, ninguna referencia a Supabase.
- **Contenido literalmente idéntico en las cuatro secciones entre las cinco direcciones**, salvo el
  muestrario, que describe la paleta propia de cada una. Si el contenido varía, la comparación deja de
  ser válida y el encargo falla.
- Datos de ejemplo verosímiles y coherentes con los ya usados: Johann, Eduardo, Chiara, Martín;
  kilómetros de la vía; sentido de calzada; fechas de agosto de 2026.

---

## 5. Fronteras

**Permitido crear:** `diseno/escritorio/pieza-1.html` … `pieza-5.html` y `diseno/escritorio/README.md`.

**Prohibido tocar:** `diseno/direccion-a.html` … `direccion-h.html`, `diseno/README.md`, `docs/`,
`CLAUDE.md`, `protocolo-universal-v4.md`, `.gitignore`, `actualizacion_del_requerimiento/` y cualquier
archivo fuera de `diseno/escritorio/`.

**Prohibido crear:** `package.json`, `node_modules`, configuración de build o cualquier andamiaje. La
Fase 1 no instala nada.

**Efectos externos:** ninguno. Sin red, sin instalaciones, sin commits.

---

## 6. Verificación

1. Los cinco archivos abren sin errores de consola.
2. Ningún `<script src=`, `<link href="http`, `@import url(http`, `fetch(`, ni referencia a Supabase.
3. No existe `package.json` ni `node_modules`.
4. Cada archivo contiene las **siete** etiquetas de estado y las **cuatro** secciones.
5. A 1280 px y a 1024 px no hay scroll horizontal en el cuerpo de la página.
6. **No aparece «Midnight» ni «RAS» en ningún archivo.**
7. En P-2 y P-3 no aparece «Aprobar», «Observar» ni «Cancelar» como acción disponible; en P-5 sí.
8. **No aparece ninguna acción de descargar** ni contador de archivos adjuntos.
9. Los hexadecimales declarados en cada muestrario existen en el CSS de su propio archivo.
10. El contenido de las secciones 2, 3 y 4 coincide literalmente entre las cinco direcciones.
11. `diseno/direccion-a.html` … `direccion-h.html` quedan sin modificar.
12. `git status` no muestra cambios fuera de `diseno/escritorio/`.

---

## 7. Reporte

Corto: resultado, archivos tocados, verificación punto por punto, **la tesis de cada una de las cinco
direcciones en una línea**, decisiones locales, y dudas o riesgos. En especial: di si alguna te parece
demasiado cercana a otra, y si alguna de las cinco te preocupa de cara a estrecharla a móvil después.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte.

**No inventes reglas de producto.** Todo lo que necesitas saber sobre estados, permisos, campos y
feedback de AUNOR está en `docs/fase-0-concepcion.md` y `docs/decisiones.md`. Si algo no está ahí, es que
no está decidido, y entonces no se dibuja.
