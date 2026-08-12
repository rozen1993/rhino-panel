# Estado

Tablero actual del proyecto. No es un diario: si algo deja de ser el estado, se reemplaza.

**Actualizado:** 2026-08-11

---

## Fase activa

**Fase 0 — Concepción funcional** (Bloque A — Frontend)

## Objetivo actual

Entender y dejar escrito exactamente qué producto debe existir, antes de diseñarlo: alcance
dentro/fuera, perfiles y sus necesidades, recorridos principales, qué información muestra cada
pantalla, comportamiento de AUNOR y Burson, estados desde la perspectiva del usuario, ubicación,
necesidades de mala señal y criterios de aceptación funcionales.

No se definen todavía tablas, RLS, migraciones, Auth ni arquitectura de base de datos.

## Puerta de salida

El producto puede explicarse pantalla por pantalla y recorrido por recorrido sin depender de
decisiones técnicas de backend.

## Siguiente acción

`docs/fase-0-concepcion.md` está completo: doce secciones, diez recorridos, nueve pantallas,
veintinueve criterios de aceptación y la máquina de estados con su tabla de transiciones. Las quince
decisiones cerradas (D-001 a D-005 y D-007 a D-015) están incorporadas.

Falta una sola cosa para cerrar la fase: **Marco lee la concepción y confirma que el producto que
describe es el que quiere**. Se derivó de `CLAUDE.md`, no de observar cómo trabajan de verdad Johann,
Eduardo, Chiara y Martín; corregirla aquí es barato y corregirla en la Fase 2 no lo es.

Queda una decisión abierta que no bloquea la puerta: D-006, el Excel histórico, que bloquea la Fase 7.

## Contrato vigente

Ninguno. Fase 0 no produce código.

## Estado de las instalaciones

Nada instalado y nada andamiado, según corresponde a Fase 0. El stack de **STACK — Frontend** queda
autorizado únicamente al abrir la Fase 2. El de **STACK — Backend**, al abrir la Fase 4.
