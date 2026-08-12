# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

Resueltas hasta ahora: D-001 a D-005 y D-007 a D-017 — ver `docs/decisiones.md`.

---

## D-006 — Excel histórico: disponibilidad y forma real

**Fase:** 0 (informativa) / 7 (bloqueante)

Única entrada abierta. No bloquea la Fase 1.

Conviene resolverlo temprano de todos modos: conocer las columnas reales del Excel —sobre todo las
coberturas de Johann— evita diseñar campos que el histórico no puede llenar y descubrirlo recién en la
Fase 7, cuando ya haya pantallas y esquema hechos.

**Qué hace falta:** una copia del archivo en el proyecto, o al menos la lista de columnas y unas filas
de ejemplo.
