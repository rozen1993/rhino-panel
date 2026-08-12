# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

Resueltas hasta ahora: D-001 a D-005 y D-007 a D-015 — ver `docs/decisiones.md`.

---

## D-006 — Excel histórico: disponibilidad y forma real

**Fase:** 0 (informativa) / 7 (bloqueante)

Única entrada abierta. No bloquea la concepción ni la puerta de salida de la Fase 0.

Conviene resolverlo temprano de todos modos: conocer las columnas reales del Excel —sobre todo las
coberturas de Johann— evita diseñar campos que el histórico no puede llenar y descubrirlo recién en la
Fase 7, cuando ya haya pantallas y esquema hechos.

**Qué hace falta:** una copia del archivo en el proyecto, o al menos la lista de columnas y unas filas
de ejemplo.

---

## D-016 — ¿Qué ve Coordinación?

**Fase:** 1
**Bloquea:** la navegación de Coordinación, la pantalla P-2, el recorrido R-3 y, más adelante, las
políticas RLS.

Es una contradicción entre dos decisiones ya tomadas, no una duda nueva. Con **D-002**, Coordinación
puede programar y asignar actividades a otros. Con **D-003**, un colaborador solo ve las actividades de
las que es responsable. Como Coordinación no es responsable de lo que asigna, hoy programaría una
cobertura para Johann y **no volvería a verla nunca**. El seguimiento, que es la mitad de su rol, sería
imposible.

**Opciones**

- **A. Coordinación ve todas las actividades, pero no puede observar, aprobar ni cancelar.** Es un rol
  de trabajo con lectura global. Consecuencia: puede hacer seguimiento de verdad, que es para lo que
  existe; el aislamiento de D-003 deja de aplicarse a una persona más, y hay que probarlo aparte.
- **B. Coordinación ve las suyas y las que ella creó.** Consecuencia: cambio mínimo sobre D-003 y
  resuelve el problema concreto; no ve lo que otro programó ni lo que un colaborador registró por su
  cuenta, así que su seguimiento tiene huecos.
- **C. Se mantiene D-003 tal cual.** Programar es disparar y olvidar. Consecuencia: coherencia máxima;
  hace inútil la mitad del rol de Chiara.

**Recomendación:** A. `CLAUDE.md` describe el perfil como «coordinación **y seguimiento**», y no se
puede seguir lo que no se ve. B parece más prudente, pero deja fuera justo las actividades que nadie
programó, que son las que más se pierden.

---

## D-017 — Patrón de navegación en móvil

**Fase:** 1
**Bloquea:** todos los wireframes; es la caja donde vive cualquier pantalla.

**Opciones**

- **A. Barra inferior fija** con los destinos del rol, que en escritorio pasa a un lateral.
  Consecuencia: el pulgar la alcanza sin recolocar el teléfono, y los destinos están siempre a la
  vista; ocupa una franja permanente de una pantalla ya pequeña. Todos los roles tienen entre dos y
  cinco destinos, así que caben.
- **B. Menú lateral desplegable** (hamburguesa). Consecuencia: no gasta espacio y escala a muchos
  destinos; esconde la navegación tras un toque, y en la mano es de las zonas peor alcanzables.
- **C. Sin navegación persistente:** una pantalla de inicio que enlaza a todo y un botón de volver.
  Consecuencia: máxima simplicidad y máximo espacio para el contenido; moverse entre dos zonas obliga a
  pasar por el inicio cada vez.

**Recomendación:** A. Es lo que mejor sostiene «mobile-first» con el número de destinos que hay, y en
el rol más común —un colaborador con dos destinos— apenas se nota.
