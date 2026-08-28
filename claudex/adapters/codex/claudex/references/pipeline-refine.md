# Pipeline `refine`

Especializa Claudex para auditar, corregir, mejorar, pulir y optimizar código existente sin convertir la tarea en un rediseño o una ampliación funcional. Este pipeline define criterios y entregables; el modo `decide|execute|review` sigue gobernando los permisos.

## Contrato

`refine` preserva la intención y el contrato público: requisitos, API, props, eventos, rutas, formatos de datos y semántica documentada. No preserva bugs como si fueran contrato.

Puede corregir defectos y mejorar accesibilidad, seguridad proporcional, rendimiento y mantenibilidad. Un cambio de requisitos, API, arquitectura de producto, dirección visual o funcionalidad sale de `refine` y requiere `decide` o `execute --pipeline core`.

## Comportamiento por modo

- `decide --pipeline refine`: solo lectura. Determina si existe deuda material, delimita el contrato y propone un plan de mejora.
- `execute --pipeline refine`: el anfitrión es el único escritor. Audita, corrige, verifica y solicita review independiente.
- `review --pipeline refine`: solo lectura. Produce hallazgos priorizados y evidencia, sin parches. Corregir requiere una invocación posterior de `execute --pipeline refine`.

## Pipeline

### 1. Delimitar contrato y línea base

- Confirma el objeto de trabajo, comportamiento intencional y criterios de aceptación.
- Ejecuta las comprobaciones existentes antes de modificar.
- Captura resultados funcionales, visuales o de rendimiento que permitan comparar después.
- Distingue requisitos de comportamiento accidental. Si no puede resolverse con evidencia y la diferencia es material, eleva la decisión a Marco.

### 2. Auditar con evidencia

Examina solo dimensiones pertinentes al alcance:

- corrección y manejo de errores;
- claridad, cohesión y mantenibilidad;
- duplicación, código muerto y complejidad accidental;
- accesibilidad y responsive cuando exista interfaz;
- seguridad y privacidad proporcionales al sistema;
- rendimiento medible y uso de recursos;
- dependencias, tipos, contratos y pruebas.

No conviertas preferencias personales en defectos. Cada hallazgo debe señalar ubicación, impacto, evidencia y severidad.

### 3. Triar

Clasifica cada hallazgo:

- corregir dentro de `refine`;
- reportar como cambio de contrato para `core`;
- descartar por falta de evidencia o beneficio;
- posponer con riesgo residual explícito.

Prioriza exactitud y riesgos antes que estética interna. No emprendas una reescritura si una corrección localizada resuelve el problema.

### 4. Corregir y mejorar

- Aplica cambios pequeños y trazables.
- Mantén interfaces públicas salvo defecto demostrado.
- Añade o ajusta pruebas que demuestren la corrección sin debilitar las comprobaciones existentes.
- Conserva compatibilidad razonable con consumidores actuales.
- No añadas funcionalidades ni rediseñes el producto bajo la etiqueta de limpieza.

### 5. Optimizar

Optimiza solo cuellos de botella demostrados o costes obvios con riesgo bajo. Compara antes/después cuando la afirmación sea cuantitativa. No cambies legibilidad por micro-optimizaciones especulativas.

### 6. Registrar desviaciones observables

Cuando una corrección cambie un resultado visible, registra en `deviations`:

- estado anterior;
- estado posterior;
- motivo sustentado por evidencia, ambos registrados en `reason`;
- clase `defect`, `accessibility`, `performance` u `other`;
- impacto sobre consumidores, registrado en `impact`.

El registro puede vivir en la salida de la tarea; crea un archivo durable solo si el repositorio ya usa uno o Marco lo solicita.

### 7. Verificar paridad de intención

- Repite las comprobaciones de línea base y las nuevas pruebas.
- Confirma que el contrato público no cambió sin autorización.
- Verifica que los defectos objetivo desaparecieron.
- Ejecuta build, tipos, lint, pruebas, accesibilidad o mediciones pertinentes.
- Revisa el diff para detectar cambios accidentales y archivos ajenos.

### 8. Review independiente y entrega

Entrega al par el contrato neutral, el diff y los resultados, sin defender previamente la implementación. Corrige hallazgos válidos y repite las comprobaciones afectadas. Informa cambios, evidencia, desviaciones y riesgos residuales.

## Condiciones de parada

Detente y pide decisión cuando:

- la mejora exige cambiar requisitos o API pública;
- existen varias direcciones visuales o de producto razonables;
- no puede distinguirse un bug de comportamiento intencional;
- la corrección requiere una migración destructiva, secretos, gasto o acción externa no autorizada;
- ambos agentes conservan baja confianza después de obtener la evidencia disponible.

## Encadenamiento con `astro`

- Usa `refine -> astro` cuando la fuente semántica exista y tenga deuda material.
- En bundles o exports, deja que `astro` extraiga primero la fuente semántica; refina esa fuente, no el wrapper de distribución.
- Omite `refine` si el triaje no encuentra deuda material. `astro` mantiene sus propios gates de destino.
