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

---

## D-013 — ¿Es obligatorio pasar por «Por subir»?

**Fase:** 0
**Bloquea:** las transiciones permitidas hacia adelante y qué botones ofrece el detalle.

Ni `CLAUDE.md` ni la concepción dicen si el avance es estrictamente
`Programada → En proceso → Por subir → Entregada`, o si se puede saltar el tercer paso.

**Opciones**

- **A. Opcional siempre.** Desde En proceso se puede ir a Por subir o directo a Entregada.
  Consecuencia: se adapta a cada tipo sin reglas extra; «Por subir» pasa a ser informativo y algunos
  dejarán de usarlo.
- **B. Obligatorio en los tipos que producen material** (Grabación, Edición, Creatividad) y opcional en
  Coordinación y Operación. Consecuencia: coincide con la regla del enlace (D-008) y hace que «Por
  subir» signifique siempre lo mismo; una regla más que explicar.
- **C. Obligatorio siempre.** Consecuencia: un solo camino, trivial de probar; obliga a Coordinación y
  Operación a atravesar un estado que en su caso no significa nada.

**Recomendación:** B, por coherencia con D-008: los mismos tres tipos que deben dejar un enlace son los
que tienen algo que subir.

---

## D-014 — ¿Puede el colaborador retroceder por su cuenta?

**Fase:** 0
**Bloquea:** las acciones del detalle y el criterio de aceptación sobre el techo del colaborador.

Si el responsable entregó y se da cuenta de que faltaba algo, no está resuelto si puede volver atrás o
si depende de que supervisión lo observe.

**Opciones**

- **A. Sí, mientras no esté Aprobada.** Consecuencia: coherente con D-007, que ya le deja editar la
  ficha hasta la aprobación; corregir no exige molestar a nadie. Supervisión puede ver desaparecer de
  su bandeja algo que iba a revisar.
- **B. No: solo avanza.** Para volver atrás hace falta una observación. Consecuencia: lo que entró en
  revisión no sale sin que supervisión lo sepa; obliga a pedir una observación para un error propio.
- **C. Sí, salvo desde Entregada.** Puede retroceder mientras trabaja, pero una vez entregado el
  control pasa a supervisión. Consecuencia: intermedio; protege solo el tramo que de verdad importa.

**Recomendación:** C. Deja libertad durante el trabajo y congela el momento en que la pelota pasa a
supervisión.

---

## D-015 — ¿Quién resuelve una observación?

**Fase:** 0
**Bloquea:** los permisos de supervisión, la trazabilidad de la observación y los tres recorridos de
ida y vuelta. Es la más importante de las tres.

`CLAUDE.md` fija que al resolver la actividad vuelve exactamente al estado previo, pero no dice quién
resuelve.

**Opciones**

- **A. Supervisión, tras leer la respuesta.** El colaborador responde y corrige; supervisión decide si
  queda resuelta. Consecuencia: observar significa algo, porque quien objeta es quien levanta la
  objeción; supervisión tiene que volver a pasar por ahí para desbloquear.
- **B. El colaborador, al responder.** Consecuencia: nada se queda atascado esperando a supervisión; el
  colaborador puede cerrar por su cuenta una objeción que no atendió, y observar deja de tener fuerza.
- **C. El colaborador la marca como atendida y supervisión la cierra.** Dos pasos distintos.
  Consecuencia: se ve quién dijo qué y cuándo; es el flujo más fiel y también el más largo.

**Recomendación:** A. Es la que sostiene la trazabilidad que pide la meta final sin añadir un paso más.
