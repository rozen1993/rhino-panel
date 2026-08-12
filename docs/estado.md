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

**Unidad en curso:** E-001, dirección visual. El contrato está en
`docs/encargos/E-001-direccion-visual.md` y lo ejecuta Codex: dos direcciones distintas sobre las mismas
tres pantallas, en `diseno/`, para que Marco compare en su celular y elija.

Después: wireframes de las nueve pantallas en la dirección elegida, y sistema de diseño.

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
