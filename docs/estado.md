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

`docs/fase-0-concepcion.md` está redactado, salvo la sección de Burson (§9), que depende de D-005.

Faltan dos cosas para cerrar la fase:

1. Marco resuelve la cola: D-005 a D-010 en `docs/decisiones-pendientes.md`. Seis entradas, cada una
   con opciones, consecuencias y recomendación.
2. Marco lee la concepción y confirma que el producto que describe es el que quiere. Si algo no
   coincide con la operación real, se corrige el documento antes de diseñar nada.

Con eso se completa §9, se incorporan las decisiones a los criterios de aceptación y la fase queda en
condiciones de pasar su puerta.

## Contrato vigente

Ninguno. Fase 0 no produce código.

## Estado de las instalaciones

Nada instalado y nada andamiado, según corresponde a Fase 0. El stack de **STACK — Frontend** queda
autorizado únicamente al abrir la Fase 2. El de **STACK — Backend**, al abrir la Fase 4.
