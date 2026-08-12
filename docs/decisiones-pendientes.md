# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

Resueltas hasta ahora: D-001 a D-005 y D-007 a D-010 — ver `docs/decisiones.md`.

---

## D-006 — Excel histórico: disponibilidad y forma real

**Fase:** 0 (informativa) / 7 (bloqueante)

No bloquea la concepción, pero conviene resolverlo temprano: conocer las columnas reales del Excel
—sobre todo las coberturas de Johann— evita diseñar campos que el histórico no puede llenar y
descubrirlo recién en la Fase 7.

**Qué hace falta:** una copia del archivo en el proyecto, o al menos la lista de columnas y unas filas
de ejemplo.

---

## D-011 — ¿Quién mantiene el tablero de Burson?

**Fase:** 0
**Bloquea:** la matriz de permisos del módulo Burson y quién ve su entrada en la navegación.

Con D-005 resuelto, Burson es un tablero interno. Falta decidir quién de Rhino lo lleva.

**Opciones**

- **A. Coordinación y Supervisión.** Consecuencia: lo mantiene quien realmente habla con Burson; el
  resto del equipo ni ve el módulo. Es la más ajustada a cómo se describe el requerimiento.
- **B. Solo Supervisión / Administración.** Consecuencia: control máximo; carga toda la actualización
  sobre una persona.
- **C. Todos los colaboradores, cada uno en lo suyo.** Consecuencia: se reparte el trabajo; el tablero
  deja de tener un dueño claro y se desordena con facilidad.

**Recomendación:** A.

---

## D-012 — ¿Qué estados usa una solicitud de Burson?

**Fase:** 0
**Bloquea:** la pantalla del módulo Burson y sus criterios de aceptación.

`CLAUDE.md` da a Burson un campo «estado», pero no dice cuál. Los siete estados internos están
pensados para una actividad de producción con observación y aprobación, y puede que no encajen en el
seguimiento de un requerimiento de un tercero.

**Opciones**

- **A. Los mismos siete estados.** Consecuencia: una sola máquina de estados en todo el sistema, más
  fácil de explicar y de probar; arrastra a Burson conceptos que quizá le sobran, como «Por subir».
- **B. Un conjunto propio y corto** (por ejemplo: solicitado, en proceso, entregado, aprobado,
  cancelado). Consecuencia: encaja con lo que Burson realmente es; obliga a mantener dos máquinas de
  estados distintas.
- **C. Sin estados cerrados:** un texto libre. Consecuencia: mínimo esfuerzo; imposible contar,
  agrupar o filtrar de forma fiable.

**Recomendación:** B. El seguimiento de un requerimiento externo no tiene «Por subir» ni observación
interna, y forzarlo dentro de la máquina de actividades confundiría las dos cosas.
