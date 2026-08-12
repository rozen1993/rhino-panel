# Estado

Tablero actual del proyecto. No es un diario: si algo deja de ser el estado, se reemplaza.

**Actualizado:** 2026-08-12

---

## Fase activa

**Fase 1 — UX y desarrollo visual** (Bloque A — Frontend)

## Objetivo actual

Decidir cómo se verá y cómo se usará: arquitectura de información, navegación, wireframes,
formularios, vistas de móvil y escritorio, pantalla de AUNOR, supervisión, módulo Burson, estados
vacíos, de error y de carga, sistema de diseño y dirección visual definitiva.

## Puerta de salida

Marco aprueba la dirección visual y entiende todos los recorridos principales desde las pantallas.

## Reglas de la fase

Mobile-first. No se instala backend, no se crea base de datos, no se configura Supabase y no se
implementa autenticación real. **No se instala ni se andamia la aplicación**: la Fase 1 produce
diseño, no código de producto.

## Siguiente acción

`docs/fase-1-ux.md` tiene el inventario de pantallas, la arquitectura de información por rol, la
navegación decidida y los patrones transversales.

**E-001 entregado y verificado.** `diseno/direccion-a.html` (operativa) y `diseno/direccion-b.html`
(editorial).

**E-002 y E-003 entregados y verificados.** Cinco direcciones visuales en `diseno/`:
A operativa, B editorial, C institucional, D campo en oscuro, E señalética vial. E-003 corrigió los
muestrarios de C, D y E, que declaraban la paleta de A.

Las cinco están publicadas como páginas privadas en claude.ai, una por dirección, para poder verlas en
un celular real. Los enlaces viven en el chat; si hiciera falta que fueran públicos y permanentes, la
vía es GitHub Pages, que exige repositorio público y `gh`, hoy no instalado.

**Bloqueado esperando a Marco:** elegir dirección visual.

Después: Codex hace los wireframes de las nueve pantallas en ese lenguaje, y el sistema de diseño se
congela en `docs/sistema-diseno.md`.

## Contrato vigente

Ninguno. La Fase 1 no produce código de producto.

## Estado de las instalaciones

Nada instalado y nada andamiado. El stack de **STACK — Frontend** queda autorizado al abrir la Fase 2.
El de **STACK — Backend**, al abrir la Fase 4.

## Fases cerradas

**Fase 0 — Concepción funcional.** Cerrada el 2026-08-12 por decisión de Marco, que dio la fase por
pasada sin la validación línea por línea de `docs/fase-0-concepcion.md` que se le había propuesto. El
documento se da por bueno como base de la Fase 1; si al ver las pantallas aparece algo que no coincide
con la operación real, se corrige entonces y se anota como incidente.
