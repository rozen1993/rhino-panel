# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

Resueltas hasta ahora: D-001, D-002, D-003, D-004 — ver `docs/decisiones.md`.

---

## D-005 — ¿Burson necesita cuenta propia?

**Fase:** 0
**Bloquea:** el alcance del módulo Burson y su matriz de permisos. No bloquea el resto de la
concepción funcional.

`CLAUDE.md` dice expresamente que no se asuma que Burson necesita cuenta salvo decisión de Marco, y
describe el módulo como *"seguimiento separado de las actividades internas de Rhino"*, con pendientes
de Rhino y pendientes de Burson.

**Opciones**

- **A. Sin cuenta.** Es un tablero interno de Rhino sobre lo que se coordina con Burson. Nadie de
  Burson entra al sistema. Consecuencia: cero superficie externa nueva que asegurar y probar; los
  pendientes de Burson los registra Rhino según lo que sabe.
- **B. Con cuenta de solo lectura.** Burson ve el estado de sus requerimientos pero no escribe.
  Consecuencia: menos correos de seguimiento; obliga a decidir qué campos internos no puede ver, igual
  que con AUNOR.
- **C. Con cuenta que escribe** sus propios pendientes. Consecuencia: el tablero se mantiene solo;
  aparece un usuario externo con permiso de escritura, que hay que acotar y probar a fondo.

**Recomendación:** A para esta entrega. Es lo que literalmente pide el requerimiento y evita abrir una
superficie externa que después hay que asegurar y probar. B se puede añadir más tarde sin rehacer el
módulo.

---

## D-006 — Excel histórico: disponibilidad y forma real

**Fase:** 0 (informativa) / 7 (bloqueante)

No bloquea la concepción, pero conviene resolverlo temprano: conocer las columnas reales del Excel
—sobre todo las coberturas de Johann— evita diseñar campos que el histórico no puede llenar y
descubrirlo recién en la Fase 7.

**Qué hace falta:** una copia del archivo en el proyecto, o al menos la lista de columnas y unas filas
de ejemplo.
