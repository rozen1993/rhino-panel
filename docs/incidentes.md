# Incidentes

Registro de incidentes reales que causaron retrabajo, fallo de una puerta de salida, efecto colateral
inesperado, gasto significativo de contexto o tiempo, conflicto entre Claude y Codex, o riesgo de
seguridad o datos.

Alimenta el ciclo de automejora del `protocolo-universal-v4.md` §12. Una regla sin incidente detrás es
una regla sin evidencia.

---

## INC-001 — El requerimiento cambió por completo después de cerrar la Fase 0

- **Proyecto:** Sistema_R — plataforma Rhino Audiovisuales / AUNOR
- **Fecha:** 2026-08-17
- **Fase:** 1 (UX y desarrollo visual), con la Fase 0 ya cerrada

### Qué ocurrió

El 2026-08-12 se cerró la Fase 0 y se abrió la Fase 1. Entre el 12 y el 17 de agosto se produjeron
**ocho direcciones visuales completas** (encargos E-001, E-002, E-003 y E-004), cada una con cuatro
pantallas, y la fase quedó parada esperando que Marco eligiera una (D-018).

El 2026-08-17 el cliente entregó una **versión 2 completa del requerimiento** —ficha en PDF más tres
mockups generados con IA— que:

- introduce un flujo de acceso nuevo (pantalla roster + modal de clave);
- propone un modelo de estados incompatible con el decidido, y **los dos mockups se contradicen entre
  sí** sobre cuál es;
- introduce archivos subidos a la plataforma frente a enlaces de OneDrive, sin decidir cuál;
- cambia los roles y las sedes de casi todo el equipo;
- convierte la vista de AUNOR de «consulta de solo lectura» en «vista de supervisión»;
- y, sobre todo, **fija una restricción de identidad visual** (alinearse a aunor.pe) que no existía
  cuando se encargaron las ocho direcciones.

### Impacto

- Dieciséis decisiones cerradas: **once quedan en revisión** (D-001, D-005, D-007, D-008, D-009, D-010,
  D-011, D-013, D-014, D-015, D-016).
- Quince de los veintinueve criterios de aceptación quedan condicionados.
- La elección entre ocho direcciones visuales (D-018) queda **suspendida**: se pidió elegir sin saber
  que la marca ya estaba restringida.
- Veintidós decisiones nuevas abiertas (D-019 a D-040), de las cuales dieciséis necesitan respuesta del
  cliente.
- El trabajo visual de la Fase 1 no se tira, pero deja de ser una elección libre.

### Causa raíz

El requerimiento de partida se tomó como estable cuando no lo era. La Fase 0 se derivó de `CLAUDE.md`
—que a su vez venía de la ficha v1— **sin contrastarla con el cliente ni con la operación real**. Al
cerrar la Fase 0 se dejó constancia de ese riesgo, pero no se actuó sobre él.

El detonante concreto es que **existía información del cliente que nadie había pedido**: una nota de voz
y unos mockups que ya circulaban. No apareció información nueva por sorpresa; apareció información que
no se había ido a buscar.

### Regla existente que falló o faltó

Ninguna regla del protocolo obliga a **comprobar que el requerimiento sigue vigente antes de invertir en
producción de volumen**. El protocolo cubre bien qué hacer cuando la implementación contradice el
contrato (§7, fallo de producto), pero no cuando el contrato mismo estaba caduco desde el principio.

El principio 4 —«el artefacto más barato para decidir»— existe y sin embargo se produjeron **ocho**
direcciones visuales cuando el propio principio dice «no producir cinco alternativas si dos permiten
decidir». Ocho maquetas encargadas sobre una premisa sin verificar es exactamente el gasto que ese
principio quiere evitar. La regla no falló: no se aplicó.

### ¿Local o universal?

**Universal.** Cualquier proyecto que derive una fase de concepción de un documento de cliente puede
construir sobre una versión caduca sin notarlo.

### Cambio propuesto

Pendiente de que Marco lo apruebe. Propuesta mínima, para el protocolo §6:

> Antes de abrir una fase que produzca volumen —maquetas, código, migraciones—, confirmar que el
> requerimiento de partida sigue vigente y preguntar expresamente si existe material del cliente que no
> se haya entregado: notas de voz, mockups, hojas de cálculo, correos. Que el cliente no lo haya
> mandado no significa que no exista.

### Evidencia de que el cambio habría evitado el incidente

La nota de voz y los mockups **ya existían** cuando se encargó E-001: la propia ficha v2 los describe
como «precisiones brindadas posteriormente», y su fecha de versión es el 12/08/2026, el mismo día en que
se cerró la Fase 0. Una sola pregunta —«¿hay algo más del cliente que no tengamos?»— antes de encargar
E-001 habría evitado producir ocho direcciones visuales bajo una premisa equivocada.

### Nota sobre la auditoría

La primera versión de la evaluación de impacto la escribió Claude y la auditó Codex en lectura. La
auditoría encontró errores de hecho reales —conteos equivocados de decisiones y de criterios, una
sobrelectura de `CLAUDE.md`, y una afirmación falsa de que el requerimiento v2 eliminaba el campo de
avance cuando lo conserva expresamente para Eduardo— y tres omisiones graves: AUNOR, la subida de
archivos con mala señal, y el histórico sin enlaces de OneDrive.

Eso confirma el valor de la revisión independiente del protocolo §11: el derivador no puede auditarse a
sí mismo.

---

## INC-002 — El diseño se alejó de la dirección aprobada, tanda a tanda

- **Proyecto:** Sistema_R
- **Fecha:** 2026-08-17
- **Fase:** 1 (UX y desarrollo visual)

### Qué ocurrió

Marco aprobó una dirección visual concreta —`diseno/piezas-png/pieza-2.png`— y a partir de ahí se
produjeron **veintinueve pantallas** en dos tandas: catorce de móvil (E-007) y quince de escritorio
(E-008). Al comparar el resultado con la imagen original, Marco detectó que **ambas tandas se habían
alejado del diseño que aprobó**.

Las desviaciones concretas:

| | La imagen aprobada | Lo que se dibujó |
|---|---|---|
| Etiquetas de estado | Píldoras **sólidas**, color saturado, texto blanco | Etiquetas con **contorno** y fondo pálido |
| Tarjetas de resumen | Icono grande en cuadro de color, cifra, etiqueta y detalle | Solo la cifra y su etiqueta |
| Fila de meses | **Los doce** meses del año | Cinco meses |
| Tarjetas | Planas, borde fino, sin sombra | **Sombra dura desplazada** |

### Impacto

Veintinueve pantallas dibujadas que no representan del todo la dirección aprobada. No se tiran —el
contenido, las reglas y la estructura son correctos— pero hay que rehacer su capa visual.

### Causa raíz

Dos causas, y la primera es la de fondo:

1. **El sistema de diseño se extrajo del archivo equivocado.** `docs/sistema-diseno.md` se derivó
   leyendo el CSS de `diseno/escritorio/pieza-2.html`, dando por hecho que era la misma dirección que
   el PNG. **No lo era:** el HTML y la imagen renderizan la misma idea de forma distinta, y Marco
   aprobó **la imagen**. De ahí salieron dos reglas equivocadas —la sombra dura y las etiquetas con
   contorno— que se propagaron a todo lo dibujado después.
2. **La deriva se midió contra la entrega anterior, no contra el original.** Cada tanda tomaba como
   referencia el resultado de la previa. Un desvío pequeño cada vez, acumulado dos veces.

### Regla existente que falló o faltó

El sistema de diseño existía desde E-008 y aun así no evitó el problema, porque **el propio sistema
estaba mal derivado**. Faltaba una regla anterior a él: **cuál es la referencia autorizada**.

### ¿Local o universal?

**Universal.** Cualquier proyecto donde una dirección visual exista en más de un formato —una imagen
aprobada y una maqueta— puede derivar el sistema del formato equivocado sin notarlo.

### Cambio aplicado

- `docs/sistema-diseno.md` declara ahora que **la fuente es la imagen que Marco aprobó**, y que la
  maqueta HTML solo sirve para leer hexadecimales concretos, no para forma ni composición.
- Se corrigieron las reglas equivocadas: píldoras sólidas, tarjetas planas, doce meses, tarjetas de
  resumen con icono.
- **Instrucción permanente de Marco:** todo encargo a Codex que toque diseño lleva **adjunta la imagen
  del diseño aprobado**, además del OCRAV. No basta con nombrarla ni describirla.

### Evidencia de que el cambio habría evitado el incidente

Las dos reglas equivocadas —sombra dura y etiquetas con contorno— salieron literalmente del CSS del
HTML. Ninguna de las dos está en la imagen aprobada. Con la imagen delante al escribir el sistema, o
adjunta en cada encargo, la contradicción se habría visto en el primer vistazo.
