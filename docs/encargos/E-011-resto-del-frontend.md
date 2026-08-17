# E-011 — El resto del frontend

**Fase:** 2 — Construcción frontend
**Ejecuta:** Codex
**Estado:** encargado
**Fecha:** 2026-08-17
**Formato:** OCRAV
**Imagen adjunta:** `diseno/piezas-png/pieza-2.png` — la dirección visual aprobada. Ábrela antes de
escribir código. Es la única referencia de forma.

---

```
┌─────────────────────────────┐
│ 1. OBJETIVO                 │
└─────────────────────────────┘
```

Completar todo lo que falta del frontend, **en móvil primero** (D-042), sobre el cimiento ya construido
en `frontend/` (E-009, E-010). Trabaja **en este orden de prioridad** y, si te quedas sin tiempo,
detente al final de un bloque completo y verificado — nunca a mitad de uno:

1. **Corrección de datos** (rápido, hazlo primero).
2. **P-5 · Supervisión.**
3. **P-6 · AUNOR.**
4. **P-1 · Acceso** y **portada pública**.
5. **P-7 · Burson.**
6. **P-8 · Cuentas.**
7. **P-9 · Importación.**
8. Si llegas hasta aquí con margen: versión de **escritorio** de lo ya construido (P-2 a P-10), ancho
   1280 px, reutilizando los mismos componentes.

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

### Léelo en este orden

1. `diseno/piezas-png/pieza-2.png` — la imagen madre.
2. `docs/sistema-diseno.md` — ya tiene los hex de AUNOR y Burson fijados.
3. `frontend/components/` y `frontend/app/actividades/` — el patrón ya establecido; síguelo, no lo
   reinventes.
4. `docs/fase-0-concepcion.md` §7 (pantallas), §8 (AUNOR), §9 (Burson).
5. `docs/decisiones.md` — en especial las de hoy: **D-045** (cada rol actúa solo dentro de lo que
   permite, nadie hace nada fuera de su rol), D-023 (material = enlace, nunca archivo), D-026 (acceso
   con usuario y clave + atajo local, sin roster), D-030 (patrón compartido), D-033/D-041 (feedback de
   AUNOR, por actividad, siempre pasa primero por supervisión), D-043 (portada pública).
6. `docs/decisiones-pendientes.md` — D-020/D-021/D-022, ya con las confirmaciones de hoy.

### 0 · Corrección de datos, primero

**Martín tiene el rol Supervisión, solamente (D-045).** No puede ser responsable operativo de una
actividad — eso está fuera de lo que su rol permite. En `frontend/lib/activities.ts`, la actividad
«Cierre de carril por instalación de señal» (tipo Operación) tiene a Martín como responsable. **Cámbialo
a `"Sin asignar"`** — no inventes un nombre nuevo, porque no se sabe todavía quién tiene el rol
Operación. Es el estado real de la información hoy, no un error a esconder.

### 1 · P-5 · Panel de supervisión

Quien entra aquí tiene rol Supervisión (Martín, por ejemplo). Dos bandejas, **claramente separadas**:

- **Observaciones respondidas, pendientes de cerrar.** Lista de actividades Observadas donde el
  colaborador ya contestó. Para cada una: la observación, la respuesta, y el botón **Resolver**, que
  devuelve la actividad a su estado anterior (no lo simules de verdad, es suficiente que el botón
  exista).
- **Feedback de AUNOR pendiente de atender.** Comentarios del cliente sobre actividades concretas
  (D-041), con tres acciones: **Descartar**, **Responder**, **Convertir en observación interna**. Con un
  aviso visible: «El feedback de AUNOR no cambia el estado de las actividades y no llega directo al
  colaborador» — la regla de D-033 escrita en la propia pantalla, como ya hizo bien un encargo anterior.

Además: la lista completa de actividades del equipo, con filtro por tipo/estado/responsable, y aquí sí
aparecen las acciones de supervisión — Observar, Aprobar, Cancelar — **solo cuando el estado de la
actividad las admite** según `docs/fase-0-concepcion.md` §5 (Aprobar solo desde Entregada sin
observaciones abiertas; nunca sobre una Observada).

### 2 · P-6 · Vista de AUNOR

**Interfaz aparte** (D-004): sin la navegación interna de Rhino, sin `NavBar` de colaborador. Solo el
nombre del cliente y «Rhino Audiovisuales» en la cabecera.

Muestra el mes: última actualización, los **cinco grupos** que ve AUNOR (usa `AunorStatusPill`, ya
existe), y la lista de actividades con fecha, tipo, título, ubicación y estado agrupado. **Nunca**
observaciones internas, respuestas internas, notas internas, ni actividades dadas de baja.

Sobre cada actividad, AUNOR puede dejar su opinión (D-041): un campo de texto y sus comentarios previos
con fecha. Sin acciones de edición sobre la actividad misma.

### 3 · P-1 · Acceso, y portada pública

**Portada pública** (D-043) primero: presentación de la plataforma, nombre «Rhino Audiovisuales», qué es
en una frase, botón que lleva al acceso. **No** menciona AUNOR por nombre de forma prominente ni expone
nada del equipo — solo la marca de Rhino.

**Acceso** (D-026): formulario de usuario y clave. Debajo o aparte, un bloque «En este dispositivo» que
muestra, **solo si existieran datos guardados localmente** (para esta maqueta, puedes simularlo con
`localStorage` o dejarlo como estado vacío de ejemplo con un comentario), las cuentas que ya entraron con
éxito ahí, para tocarlas directamente. Enlace «¿Olvidaste tu clave?». **No** dibujes ninguna lista de
todo el equipo con su carga de trabajo — eso es exactamente el roster que se descartó.

### 4 · P-7 · Módulo Burson

Tablero con `BursonStatusPill` (ya existe). Columnas: solicitud, fecha, responsable de Rhino, material
solicitado, estado, **pendientes de Rhino**, **pendientes de Burson** — estas dos son el motivo de
existir del módulo, tienen que verse de un vistazo. Solo lo ven Coordinación y Supervisión (D-011); el
`NavBar` ya tiene el flag `coordinationOnly`, revisa si necesita también admitir Supervisión.

### 5 · P-8 · Administración de cuentas

Lista de personas con su rol o roles asignados (puede ser más de uno, D-001) y si están activas. Acciones:
dar de alta, asignar/quitar rol, desactivar. Usa como datos de ejemplo los que ya están confirmados:
Johann, Eduardo, Chiara, Martín (Supervisión), y dónde corresponda, marca "rol pendiente de confirmar"
para quienes no lo tienen — no inventes roles que no están decididos.

### 6 · P-9 · Importación del histórico

El paso de simulación: un archivo cargado (puedes simularlo con un botón «Cargar archivo de ejemplo»
que rellena datos ficticios), separado en **filas que entrarían** y **filas rechazadas con motivo**, con
totales. Botones Confirmar y Cancelar.

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No** conectes nada real. Sin `fetch`, sin Supabase, sin base de datos. Todo simulado.

**No** dibujes el roster del cliente en ningún sitio, ni siquiera en Cuentas.

**No** muestres «Aprobar» sobre una actividad Observada, en ningún lugar.

**No** confundas visualmente el feedback de AUNOR con una observación interna — colores y etiquetas
distintos, ya fijados en `docs/sistema-diseno.md` §3 bis.

**No** inventes nombres para roles o personas que no estén confirmados en `docs/decisiones.md` o
`docs/decisiones-pendientes.md`. Donde falte el dato real, dilo explícitamente («Sin asignar», «Rol
pendiente») en vez de inventar.

**No** te apartes de los componentes existentes. Si necesitas uno nuevo, créalo con el mismo criterio y
regístralo en `docs/sistema-diseno.md`.

**No** hagas commits.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

Por cada bloque que completes: `npm run verify` en verde antes de pasar al siguiente. No avances con
algo roto.

1. Martín ya no aparece como responsable de una actividad operativa.
2. P-5 separa con claridad observaciones internas de feedback de AUNOR, con el aviso escrito en pantalla.
3. Aprobar nunca aparece sobre una actividad Observada.
4. P-6 no filtra nada interno y usa los cinco grupos de AUNOR.
5. P-1 no publica ninguna lista de personas antes de autenticar.
6. Todo sigue fiel a `pieza-2.png`: píldoras sólidas, tarjetas planas, sin sombra dura.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

1. `npm run verify` en verde al final de cada bloque — pega el resultado de cada uno.
2. Capturas con `npx playwright screenshot` a 390×844 de cada pantalla nueva, en `frontend/.verificacion/`.
3. Descríbelas y compáralas contra `pieza-2.png`.
4. `git status` no muestra cambios fuera de `frontend/` y, si corresponde, `docs/sistema-diseno.md`.

**Reporte, aunque no termines todo:** qué bloques completaste y verificaste, cuáles quedaron a medias
(y en qué punto exacto), y cuáles no llegaste a tocar. Sé preciso — este reporte se usa para decidir qué
sigue, no para quedar bien.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple, anótalo, y sigue. **No inventes reglas de producto ni datos de
personas reales.** Prioriza terminar bloques completos y verificados sobre avanzar a medias en muchos.
