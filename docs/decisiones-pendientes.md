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

---

## D-007 — ¿Puede el colaborador editar una actividad ya Entregada?

**Fase:** 0
**Bloquea:** qué acciones muestra la pantalla de detalle según el estado, y los criterios de
aceptación sobre edición.

Entregada significa que el colaborador declaró que terminó. No está resuelto si después puede seguir
tocando la ficha.

**Opciones**

- **A. No, salvo que sea observada.** Al entregar, la ficha se bloquea; si supervisión observa, se
  reabre. Consecuencia: lo que supervisión revisa no cambia bajo sus pies; un error de dedo obliga a
  pedir una observación para corregirlo.
- **B. Sí, hasta que sea Aprobada.** Consecuencia: cómodo para corregir un enlace mal pegado;
  supervisión puede estar revisando algo que ya cambió.
- **C. Solo algunos campos** (enlace al material y notas). Consecuencia: cubre el caso real —el enlace
  equivocado— sin dejar mover fechas ni descripción.

**Recomendación:** C.

---

## D-008 — ¿El enlace al material es obligatorio para pasar a Entregada?

**Fase:** 0
**Bloquea:** validación del formulario, el paso a Entregada y el criterio de aceptación 4.

**Opciones**

- **A. Obligatorio.** No hay entrega sin material localizable. Consecuencia: la entrega significa
  siempre lo mismo; bloquea a quien entregó por otra vía (disco físico, transferencia directa).
- **B. Opcional, con aviso.** Consecuencia: nunca bloquea; aparecen entregas sin material que después
  hay que perseguir.
- **C. Obligatorio solo para Grabación, Edición y Creatividad**, que producen material; opcional para
  Coordinación y Operación. Consecuencia: se ajusta a lo que cada tipo produce de verdad.

**Recomendación:** C, si Coordinación y Operación no siempre dejan un archivo.

---

## D-009 — ¿Quién puede cancelar una actividad?

**Fase:** 0
**Bloquea:** permisos por estado y el recorrido R-10.

`CLAUDE.md` fija que una actividad Aprobada no puede cancelarse, pero no quién cancela.

**Opciones**

- **A. Solo supervisión/administración.** Consecuencia: control claro; el colaborador tiene que pedirlo.
- **B. El responsable y supervisión.** Consecuencia: ágil en campo, donde una cobertura se cae sola;
  el colaborador puede hacer desaparecer trabajo comprometido.
- **C. El responsable solo hasta Programada**; después, solo supervisión. Consecuencia: cubre el caso
  real —la actividad que nunca empezó— sin dejar cancelar trabajo ya en curso.

**Recomendación:** C.

---

## D-010 — ¿El avance está atado al estado?

**Fase:** 0
**Bloquea:** el formulario, la pantalla de detalle y qué significa el número que ve AUNOR.

Hay un avance de 0 a 100 y además siete estados. No está resuelto si son dos cosas independientes.

**Opciones**

- **A. Independientes.** El avance es informativo y se mueve a mano. Consecuencia: máxima libertad;
  aparecerán actividades Entregadas al 60 %, y eso confunde.
- **B. El estado manda y el avance se deduce.** Consecuencia: nunca se contradicen; se pierde el matiz
  de "voy por la mitad" dentro de En proceso.
- **C. Independientes con reglas mínimas:** entregar exige 100, y aprobar lo mantiene en 100.
  Consecuencia: conserva el matiz durante el trabajo y evita la contradicción al final.

**Recomendación:** C.
