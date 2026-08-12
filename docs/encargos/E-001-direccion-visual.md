# E-001 — Dirección visual: dos propuestas

**Fase:** 1 — UX y desarrollo visual
**Ejecuta:** Codex
**Estado:** encargado

Marco tiene que elegir cómo se ve el producto. Este encargo produce el artefacto mínimo que le permite
decidir: **dos direcciones visuales distintas**, sobre las mismas tres pantallas, que pueda abrir en su
propio celular y comparar.

No es la aplicación. Son dos maquetas estáticas.

---

## 1. Contexto

Leer antes de ejecutar:

- `docs/fase-0-concepcion.md` — qué es el producto. Interesan sobre todo §3 (campos), §4 (ubicación),
  §5 (estados) y §7 (pantallas).
- `docs/fase-1-ux.md` — navegación y patrones transversales.
- `docs/decisiones.md` — las diecisiete decisiones cerradas.

Rhino Audiovisuales es una productora que trabaja para AUNOR, una concesionaria de autopista. Quien más
usará esto es una persona en vía, con el teléfono en una mano, a pleno sol.

---

## 2. Tarea

Producir **dos archivos HTML autónomos**, uno por dirección visual, que muestren las mismas tres
pantallas en móvil:

- `diseno/direccion-a.html` — **Operativa**. Herramienta de trabajo: densa, sobria, máxima legibilidad
  al sol, tipografía de sistema, color reservado casi por completo al estado.
- `diseno/direccion-b.html` — **Editorial**. Producto con identidad: más aire, tarjetas más generosas,
  presencia de color de marca en cabeceras y acentos, algo más de personalidad — es una productora
  audiovisual, no un ERP.

Deben ser dos direcciones **de verdad distintas**, no dos variantes de la misma. Si al verlas juntas la
elección da igual, el encargo falló.

---

## 3. Contrato

No reinterpretable.

### Contenido de cada archivo

En este orden, dentro de un mismo documento con scroll:

1. **Muestrario.** Paleta con sus valores, escala tipográfica, y las **siete etiquetas de estado**
   —Programada, En proceso, Por subir, Entregada, Observada, Aprobada, Cancelada— tal como se verán en
   las listas.
2. **P-2 · Mis actividades.** Cinco tarjetas con datos de ejemplo realistas, cubriendo cinco estados
   distintos, **una de ellas Observada**. Cada tarjeta muestra fecha, tipo, título, estado y avance.
   Botón de crear alcanzable con el pulgar. Barra inferior con dos destinos: Actividades y Perfil.
3. **P-3 · Detalle de una actividad Observada.** Ficha completa con ubicación, enlace al material,
   la observación con su respuesta, el historial de cambios de estado con autor y fecha, y **cuándo se
   modificó por última vez**. Solo acciones de colaborador.
4. **P-4 · Formulario de una grabación.** Campos obligatorios primero, ubicación visible con
   `ubicacion_nombre` prominente y el resto plegado o secundario, y el **aviso de borrador guardado en
   el teléfono pero aún no enviado**, con opción de reintentar.

### Reglas que no se pueden romper

- **HTML y CSS puros, en un solo archivo cada uno.** Sin dependencias, sin CDN, sin fuentes remotas,
  sin imágenes externas, sin framework. JavaScript solo si es imprescindible; preferible ninguno.
- **Mobile-first**, ancho de referencia 390 px. No debe romperse en escritorio, pero el móvil manda.
- **Los siete estados tienen que distinguirse sin depender solo del color.** Se leen a pleno sol y hay
  daltonismo: forma, peso, borde o texto deben cargar parte del trabajo.
- **Observada tiene que leerse como «esto te está esperando»**, no como un estado más de la lista. Es la
  señal más importante de la pantalla.
- **Contraste AA como mínimo** en todo texto.
- **Ninguna acción de supervisión** —observar, aprobar, cancelar— puede aparecer en estas pantallas: son
  vistas de colaborador. Una acción que el rol no puede ejecutar no se muestra, ni siquiera desactivada.
- **Nada de backend**: ningún `fetch`, ningún formulario que envíe, ninguna referencia a Supabase.
- **Sin logotipos** de Rhino ni de AUNOR. No inventar identidad gráfica de terceros; basta el nombre en
  texto.
- Datos de ejemplo verosímiles: nombres del equipo (Johann, Eduardo, Chiara, Martín), kilómetros,
  sentido de la calzada, fechas coherentes.

---

## 4. Fronteras

**Permitido crear o modificar:**

- `diseno/direccion-a.html`
- `diseno/direccion-b.html`
- `diseno/README.md` — cinco líneas: qué es cada archivo y cómo abrirlo.

**Prohibido tocar:** `docs/`, `CLAUDE.md`, `protocolo-universal-v4.md`, `.gitignore`, y cualquier
archivo fuera de `diseno/`.

**Prohibido crear:** `package.json`, `node_modules`, configuración de build, cualquier andamiaje de
aplicación. La Fase 1 no instala nada.

**Efectos externos:** ninguno. Sin red, sin instalaciones, sin commits.

---

## 5. Verificación

Debe quedar verde antes de reportar:

1. Los dos archivos abren en un navegador sin errores de consola.
2. No existe `package.json` ni `node_modules` en el repositorio.
3. Ningún `<script src=`, ningún `<link href="http`, ningún `@import url(http`, ningún `fetch(`.
4. Cada archivo contiene las siete etiquetas de estado y las tres pantallas.
5. A 390 px de ancho no hay scroll horizontal en ninguna de las tres pantallas.
6. En las tres pantallas no aparece la palabra «Aprobar», «Observar» ni «Cancelar» como acción
   disponible.
7. `git status` no muestra cambios fuera de `diseno/`.

---

## 6. Reporte

Corto, en el chat, no en archivos:

- resultado;
- archivos tocados;
- verificación, punto por punto;
- decisiones locales que tomaste;
- dudas o riesgos que queden.

---

## Regla de cierre

Si falta una decisión bloqueante —algo que cambie contrato, datos, permisos, seguridad, UX acordada o
alcance—, **detente y pregunta**. No inventes requisitos. Si es un detalle local, reversible y cubierto
por este contrato, elige la solución más simple y anótala en el reporte.
