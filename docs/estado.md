# Estado

Tablero actual del proyecto. No es un diario: si algo deja de ser el estado, se reemplaza.

Quien abra solo este archivo debe poder retomar el trabajo sin leer ninguna conversación.

**Actualizado:** 2026-08-17

---

## Fase activa

**Fase 2 — Construcción frontend.** Abierta por decisión de Marco (D-044): la Fase 1 se da por cumplida
con la dirección visual elegida, aunque imperfecta, y la corrección se hace sobre el frontend en código
en vez de regenerando imágenes.

**Quedan autorizadas las tecnologías de STACK — Frontend:** Next.js (App Router), React, TypeScript
estricto, Tailwind, Zod, Vitest, Playwright, Git, npm. Todo con datos simulados: nada de Supabase, Auth
ni persistencia real hasta la Fase 4.

**Riesgo asumido y explícito:** la Fase 0 sigue con **trece decisiones abiertas**, once esperando a
César, sobre todo el catálogo de roles (D-020, D-021, D-022). Se construye sobre el catálogo documentado
hoy en D-001. Si el cliente lo cambia, la navegación y los permisos del frontend se ajustan después.

## Objetivo actual

Levantar el cimiento del frontend: el proyecto Next.js, el sistema de diseño llevado a código (Tailwind
+ componentes base), y una página interna de verificación que se compara directamente contra
`diseno/piezas-png/pieza-2.png` — la imagen que Marco aprobó — antes de construir ninguna pantalla de
producto encima.

## Puerta de salida de la Fase 2

La aplicación puede recorrerse de principio a fin con mocks y coincide con el diseño aprobado.

---

## Lo que Marco decidió el 2026-08-17 — en orden

1. **D-019 — sistema de supervisión.** Se mantienen los siete estados y el ciclo de observación
   completo.
2. **D-023 — el material va por enlace.** La plataforma no almacena archivos. Cierra D-024 y D-036.
3. **D-030 — un solo patrón de pantalla** para los cinco roles, con variantes internas.
4. **D-031 y D-018 — dirección visual: la pieza 2**, «planilla de rodaje». Cierra la elección que llevaba
   parada desde el 12 de agosto.
5. **D-026 — se entra con usuario y clave.** El atajo de «toca tu cara» vive en el dispositivo, no en el
   servidor. Se descarta el roster del cliente.
6. **D-042 — las piezas de escritorio fueron solo para elegir estética.** El producto se sigue
   diseñando mobile-first: móvil primero, luego laptop y escritorio.
7. **D-043 — portada pública antes del acceso.** Recupera la sensación de llegada del cliente sin
   publicar el equipo.
8. **D-041 — AUNOR opina sobre cada actividad**, no sobre el mes. Pasa siempre por supervisión (D-033).
9. **D-029 — la ubicación se queda como está**: nombre del lugar obligatorio, el resto plegado.
10. **D-028 — el avance solo se pide en Edición y Creatividad.** Modifica D-010.
11. **D-044 — se abre la Fase 2** con el diseño imperfecto, a corregir en código.

Con D-019, D-023, D-030, D-031, D-026 y D-033 cerradas, siete decisiones salieron de revisión y §5, §8,
§10 y §11 de `docs/fase-0-concepcion.md` volvieron a estar firmes.

---

## Entregado en la Fase 1 (visual)

| Encargo | Qué produjo | Dónde |
|---|---|---|
| E-001 a E-004 | Ocho direcciones visuales de móvil. **Obsoletas**, se conservan como archivo | `diseno/direccion-a.html` … `-h.html` |
| E-005 | Cinco direcciones de escritorio en HTML, con contenido exacto | `diseno/escritorio/pieza-1.html` … `-5.html` |
| E-006 | Las mismas cinco en PNG. **Marco eligió la pieza 2** (D-031) | `diseno/piezas-png/pieza-2.png` |
| E-007 | Bloque 1 del diseño móvil: 14 pantallas del trabajo diario | `diseno/movil/` |
| E-008 | 15 pantallas de escritorio | `diseno/escritorio-png/` |

**Las 29 pantallas de E-007 y E-008 tienen deriva visual respecto de `pieza-2.png` — ver INC-002.** No se
tiran: el contenido, las reglas y la estructura son correctos. Sirven de referencia de **contenido** para
construir el frontend; para **forma**, la única referencia es la imagen aprobada.

---

## INC-002, resumen

`docs/sistema-diseno.md` se derivó por error del CSS de una maqueta HTML, no de la imagen que Marco
aprobó. Produjo dos reglas equivocadas —sombra dura desplazada, etiquetas de estado con contorno— que se
propagaron a las 29 pantallas. Ya corregido en el propio archivo. Detalle completo en
`docs/incidentes.md` → INC-002.

**Regla permanente que dejó el incidente:** todo encargo a Codex que toque diseño lleva **adjunta la
imagen del diseño aprobado**, además del contrato en formato OCRAV.

---

## Cómo se escriben los encargos a Codex — OCRAV

Desde el 2026-08-17, todo encargo a Codex sigue esta estructura, por instrucción expresa de Marco:

```
O — Objetivo       ¿Qué queremos conseguir?
C — Contexto       ¿Qué necesita saber?
R — Restricciones  ¿Qué NO debe hacer?
A — Aceptación     ¿Cómo sabemos que funciona?
V — Verificación   ¿Cómo debe comprobarlo?
```

Cuando el encargo toca diseño, se adjunta además la imagen de `diseno/piezas-png/pieza-2.png`.

---

## Estado de las decisiones

- **Cerradas: 30.**
- **En revisión: 4** — D-001, D-005, D-011, D-016. Todas por el catálogo de roles y por si Burson
  participa.
- **Abiertas: 13** — D-006, D-020, D-021, D-022, D-025, D-027, D-032, D-034, D-035, D-037, D-038, D-039,
  D-040. Once necesitan a César; D-037 y D-039 los resuelve Marco solo.

## Por dónde conviene seguir

1. **Levantar el cimiento del frontend** (en curso, ver abajo).
2. **Enviar a César las preguntas de `docs/impacto-requerimiento-v2.md` §7** — sobre todo el equipo real
   (D-020, D-021, D-022), que es lo que mantiene en revisión a D-001, D-005, D-011 y D-016.
3. Construir las pantallas de producto sobre los componentes base, con datos mock.
4. Cuando lleguen las respuestas del cliente, ajustar navegación y permisos.
5. Fase 3: validar en dispositivo real, escribir el contrato de handoff, congelar.

---

## Dónde está el trabajo

| Documento | Qué contiene |
|---|---|
| `docs/sistema-diseno.md` | El lenguaje visual llevado a valores concretos. Corregido tras INC-002 |
| `docs/impacto-requerimiento-v2.md` | Qué cambió con el requerimiento v2 y qué se ejecutó |
| `docs/fase-0-concepcion.md` | Qué es el producto. Nueve secciones históricamente marcadas; la mayoría ya confirmadas |
| `docs/fase-1-ux.md` | Pantallas, navegación y el recuento real de vistas por dibujar |
| `docs/decisiones.md` | Las treinta cerradas |
| `docs/decisiones-pendientes.md` | Las trece abiertas, con quién debe contestar cada una |
| `docs/incidentes.md` | INC-001 y INC-002 |
| `docs/encargos/` | Los contratos que ejecuta Codex, en OCRAV desde E-006 |
| `diseno/` | Maquetas y pantallas de referencia (contenido correcto, forma en corrección) |
| `frontend/` | El proyecto Next.js. Se crea en esta fase |
| `actualizacion_del_requerimiento/` | Ficha v2 en PDF y los tres mockups del cliente |

---

## Contrato vigente

Ninguno todavía en código. El primero será el contrato de handoff de la Fase 3, cuando el frontend esté
construido y validado.

## Estado de las instalaciones

**Recién autorizado.** STACK — Frontend queda habilitado con la apertura de la Fase 2. STACK — Backend
sigue esperando a la Fase 4.

---

## Fases cerradas

**Fase 0 — Concepción funcional.** Cerrada el 2026-08-12, reabierta el 2026-08-17 por el requerimiento
v2. No se ha vuelto a cerrar formalmente: quedan trece decisiones abiertas. Se sigue trabajando en
paralelo con la Fase 2 por decisión de Marco.

**Fase 1 — UX y desarrollo visual.** Dada por cumplida el 2026-08-17 (D-044) con dirección visual
elegida e imperfecciones conocidas, a corregir en código durante la Fase 2.
