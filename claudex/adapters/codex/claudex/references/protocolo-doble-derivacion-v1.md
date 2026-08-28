# CLAUDEX — PROTOCOLO DE DOBLE DERIVACIÓN Y EJECUCIÓN VERIFICADA — v1.8

Protocolo autónomo para aprovechar la principal ventaja de trabajar con Claude Code y Codex: obtener razonamientos independientes, localizar incertidumbre mediante discrepancias y producir una sola ejecución verificada. Marco conserva siempre la decisión final.

## PRINCIPIO DE PARES

Claude y Codex son familias distintas y pares funcionales. Ninguna está permanentemente por encima de la otra.

- El liderazgo se asigna según la tarea, evidencia y capacidad necesaria.
- Cualquiera puede proponer, ejecutar, revisar o sintetizar.
- En una unidad concreta se declara un solo escritor y un revisor independiente.
- El modelo más potente no recibe autoridad de producto por ser más capaz.
- Marco decide alcance, preferencias, riesgo aceptable y aprobación final.
- Cuando no hace falta doble derivación, se elige un solo agente por adecuación y costo.

---

## RESUMEN EJECUTIVO — POR QUÉ EXISTE ESTE PROTOCOLO

La solución correcta no es sustituir una jerarquía por otra ni crear un protocolo universal completo alrededor de una IA. Este documento se concentra únicamente en la ventaja diferencial de utilizar dos familias de modelos.

La ventaja principal de trabajar con Claude y Codex no es repartir el trabajo como jefe y subordinado. Es obtener dos razonamientos con sesgos, fortalezas y posibles errores diferentes.

Si ambos llegan independientemente a la misma solución y la evidencia la respalda, aumenta la confianza. Si discrepan, la discrepancia localiza exactamente dónde existe incertidumbre. Esto puede evitar decisiones arquitectónicas incorrectas y retrabajo costoso.

### Cuándo activarlo

La doble derivación se activa cuando se cumplen al menos dos condiciones:

- la decisión es difícil de revertir;
- existen varias soluciones razonables;
- afecta arquitectura, permisos, seguridad o datos;
- las pruebas no pueden demostrar completamente que una opción es correcta;
- ya hubo un intento fallido;
- Claude o Codex reportan baja confianza.

Es obligatoria para:

- autenticación y autorización;
- migraciones o eliminación de datos;
- arquitectura estructural;
- operaciones destructivas;
- cambios importantes de este protocolo;
- decisiones con consecuencias económicas relevantes.

No se utiliza para estilos menores, formularios simples, renombres, pruebas rutinarias ni implementaciones claramente especificadas.

### Flujo correcto

1. Marco plantea el problema.
2. Se prepara un paquete neutral de evidencia.
3. Codex deriva una solución sin ver la de Claude.
4. Claude deriva otra sin ver la de Codex.
5. Ambas respuestas declaran supuestos, solución, riesgos, evidencia necesaria y confianza.
6. Una tercera sesión limpia compara ambas.
7. Las coincidencias se verifican.
8. Las discrepancias se convierten en preguntas concretas.
9. Marco decide cuando la evidencia no puede resolverlas.
10. Solo una solución pasa a implementación.

### Mayor riesgo

El principal riesgo es producir un **consenso artificial**: que el segundo agente lea primero la solución del primero y simplemente la confirme. Por eso la independencia inicial es obligatoria. Si un agente ya conocía la otra respuesta, su trabajo cuenta como revisión, no como derivación independiente.

---

## TARJETA DE ACTIVACIÓN

Antes de resolver una decisión difícil, preguntar:

> **¿Esta decisión necesita doble derivación antes de construir?**

Activar si aparecen **dos señales**:

- es difícil o costosa de revertir;
- existen varias soluciones razonables;
- afecta arquitectura, datos, permisos, seguridad o UX aprobada;
- faltan hechos o las pruebas no bastan para decidir;
- hubo un intento fallido;
- un agente declara baja confianza;
- sus efectos cruzan componentes o fases.

Activar siempre para autenticación/autorización, migraciones o eliminación de datos, arquitectura estructural, operaciones destructivas y cambios importantes de protocolos.

No activar para formato, copy, estilos locales definidos, pruebas rutinarias, errores con causa demostrada ni implementación mecánica con contrato inequívoco.

**Duplicar razonamiento cuando aporta valor; nunca duplicar escritura sobre el mismo trabajo.**

---

## 1. PROPÓSITO

- Detectar supuestos ocultos y errores tempranos.
- Evitar que un agente confirme por inercia al otro.
- Aumentar confianza cuando ambos coinciden y existe evidencia.
- Convertir desacuerdos en preguntas verificables.
- Concentrar modelos fuertes y mayor esfuerzo donde equivocarse cuesta más.
- Mejorar la ejecución mediante un único escritor y un revisor de otra familia.

Fuera de sus condiciones de activación, cada proyecto aplica su propio flujo durable y asigna el agente más adecuado para la tarea.

---

## MODOS DE OPERACIÓN

Claudex tiene tres modos. Si Marco no indica uno, el agente anfitrión lo infiere por la intención y lo anuncia antes de actuar.

### `decide` — obtener la mejor respuesta

Uso: decisiones, diagnósticos abiertos, diseño, arquitectura, estrategias o problemas con varias respuestas razonables.

1. Preparar un paquete neutral.
2. Producir dos derivaciones ciegas.
3. Compararlas en una tercera sesión limpia.
4. Verificar los hechos decisivos.
5. Entregar una recomendación o elevar a Marco la discrepancia que la evidencia no pueda resolver.

Este modo es de solo lectura. No implementa la solución.

### `execute` — obtener la mejor ejecución

Uso: construir, corregir, modificar o completar una orden con resultado verificable.

1. Convertir la orden en contrato, límites, criterios de aceptación y pruebas.
2. Aplicar la tarjeta de activación. Si el riesgo lo exige, realizar doble derivación antes de escribir. Si la implementación es mecánica, omitir esa duplicación y reservar al segundo agente para la revisión.
3. El agente donde se invocó Claudex es el único escritor del árbol actual.
4. Implementar y ejecutar las comprobaciones pertinentes.
5. Entregar al agente par el contrato neutral, el diff y los resultados de pruebas, sin defender previamente la implementación.
6. Clasificar sus hallazgos por evidencia y severidad. Corregir los válidos y volver a verificar. Un hallazgo crítico o alto exige una revisión final limpia.
7. Entregar resultado, evidencia, riesgos residuales y archivos modificados.

El agente par no edita los mismos archivos ni trabaja simultáneamente sobre el mismo árbol. La delegación de escritura solo puede hacerse en un entorno aislado, con límites explícitos y sin integrar cambios automáticamente.

### `review` — obtener la mejor evaluación

Uso: auditar código, cambios, planes o resultados existentes.

1. Delimitar el objeto y los criterios de revisión.
2. Claude y Codex lo revisan independientemente sin ver primero los hallazgos del otro.
3. Una comparación limpia elimina duplicados, exige evidencia y ordena los hallazgos por severidad.
4. Se informa lo demostrado, lo incierto y lo que no pudo verificarse.

Este modo es de solo lectura. Corregir los hallazgos requiere una orden posterior o una invocación `execute`.

### Selección automática

- Pregunta, elección o estrategia → `decide`.
- Orden de construir, cambiar, arreglar o completar → `execute`.
- Solicitud de revisar, auditar o verificar → `review`.
- Intención ambigua con consecuencias materiales → pedir una aclaración breve.

---

## PIPELINES DE ESPECIALIZACIÓN

El modo y el pipeline son ejes ortogonales:

- el **modo** `decide|execute|review` gobierna permisos, escritura y garantías;
- el **pipeline** `core|astro|refine` gobierna criterios, fases, gates y entregables;
- el pipeline nunca concede permisos ni modifica el principio de un solo escritor.

`core` es el pipeline predeterminado y conserva el comportamiento general. `astro` especializa la componización Astro + Tailwind. `refine` especializa la auditoría y mejora verificable preservando intención y contrato público.

| Modo | `core` | `astro` | `refine` |
|---|---|---|---|
| `decide` | Decisión general. | Plan de componización sin escribir. | Triaje y plan de mejora sin escribir. |
| `execute` | Implementación abierta. | Componización Astro + Tailwind verificada. | Auditoría y corrección acotadas por calidad. |
| `review` | Revisión general. | Auditoría especializada de la componización. | Auditoría especializada de calidad, sin parches. |

La forma canónica explicita ambos ejes:

```text
claudex [perfil] [decide|execute|review] [--pipeline core|astro|refine] <tarea>
```

Los alias diarios son solo expansiones de ejecución:

```text
claudex astro <tarea>   → execute --pipeline astro
claudex refine <tarea>  → execute --pipeline refine
```

No existe el alias `track`. Un solo nombre por eje evita ambigüedad.
Los alias `astro|refine` solo son válidos cuando no se escribió un modo. Para combinar con `decide` o `review`, usa siempre `--pipeline`; una forma mixta como `decide astro <tarea>` es inválida.

### Carga progresiva

- Para `astro`, leer por completo `pipeline-astro.md` antes de derivar, ejecutar o revisar.
- Para `refine`, leer por completo `pipeline-refine.md` antes de derivar, ejecutar o revisar.
- Para `core`, no cargar esas referencias salvo que la tarea necesite comparar pipelines.

### Fronteras

- `review --pipeline refine` es válido: entrega hallazgos con severidad y evidencia, pero no corrige.
- `execute --pipeline refine` puede corregir defectos, accesibilidad y rendimiento sin cambiar requisitos ni API pública. Toda desviación observable se registra.
- Cambiar requisitos, API, arquitectura de producto o dirección visual exige `decide` o `execute --pipeline core`.
- `execute --pipeline astro` ejecuta siempre sus gates de destino, aunque el triaje permita omitir `refine`.

---

## 2. PAQUETE NEUTRAL

Ambos agentes reciben exactamente:

```text
MODO Y TAREA
`decide`, `execute` o `review`, seguido de la pregunta u orden exacta.

PIPELINE
`core`, `astro` o `refine`, seguido de la especialización y referencia aplicable.

CONTEXTO
Hechos confirmados y rutas relevantes.

RESTRICCIONES
Decisiones cerradas y límites inmutables.

EVIDENCIA
Pruebas, métricas, errores o fuentes disponibles.

SALIDA
Resultado esperado y estructura requerida para el modo elegido.
```

El paquete no contiene soluciones sugeridas ni lenguaje que favorezca una opción.

Cuando el pipeline sea `astro` o `refine`, el paquete incluye sus criterios cerrados y gates sin proponer de antemano una implementación concreta.

El anfitrión pasa al agente par la raíz absoluta del proyecto. Las derivaciones y revisiones usan el perfil de contexto `project`, que permite leer el repositorio y cargar sus instrucciones. La comparación limpia usa el perfil `neutral`: se ejecuta desde un directorio temporal vacío, carga solo la configuración de usuario y no recibe herramientas. Este aislamiento neutraliza el contexto del proyecto; no sustituye un sandbox del sistema operativo.

---

## 3. DERIVACIÓN CIEGA

Esta fase se aplica siempre en `decide`, en `review` y antes de escribir en `execute` cuando la tarjeta de activación lo exige.

1. Claude recibe el paquete en una sesión nueva.
2. Codex recibe el mismo paquete en un contexto limpio.
3. Ninguno ve la respuesta del otro.
4. Ninguno edita archivos durante la derivación.
5. Ambos responden así:

```text
SUPUESTOS — qué considera cierto y qué falta confirmar.
PROPUESTA — solución recomendada y fundamento.
ALTERNATIVAS — opciones relevantes y motivo de descarte.
RIESGOS — cómo podría fallar.
VERIFICACIÓN — evidencia que la confirma o refuta.
CONFIANZA — alta, media o baja, con razón concreta.
```

Cuando sea pertinente y el esquema lo permita, la respuesta también declara `pipeline`, `input_class`, `gates`, `artifacts` y `deviations`. Estos campos complementan la estructura base; no sustituyen supuestos, propuesta, alternativas, riesgos, verificación y confianza.

Si un agente conoció primero la respuesta del otro, su salida cuenta como revisión, no como derivación independiente.

---

## 4. COMPARACIÓN

Una tercera sesión limpia recibe el paquete y ambas respuestas. Separa:

- coincidencias de hechos y solución;
- diferencias de supuestos;
- contradicciones verificables;
- diferencias de criterio o riesgo aceptable;
- decisiones reservadas a Marco.

Formato:

| Punto | Claude | Codex | Evidencia | Resolución |
|---|---|---|---|---|
| Supuesto o decisión | Posición | Posición | Qué lo prueba | Resuelto / experimento / Marco |

El comparador sintetiza; no vota ni sustituye a Marco. El consenso sin evidencia no basta.

La comparación solicita una salida JSON validada por esquema. Las derivaciones y revisiones también entregan campos estructurados para supuestos, propuesta, alternativas, riesgos, verificación y confianza. Si la CLI o el esquema fallan, se conserva e informa el error real en lugar de completar campos inventados.

---

## 5. REGLAS DE SALIDA

- **Coinciden y hay evidencia:** adoptar y construir una sola solución.
- **Coinciden sin evidencia:** diseñar la prueba o prototipo más barato que pueda refutarla.
- **Discrepan por un hecho:** consultar código, prueba, medición o fuente oficial.
- **Discrepan por alcance, preferencia o riesgo:** presentar opciones y consecuencias a Marco.
- **Ambos tienen baja confianza:** no implementar; obtener información o dividir el problema.

Una vez resuelta la discrepancia, `decide` termina con una recomendación; `execute` continúa con un solo escritor; `review` termina con hallazgos priorizados.

---

## 6. MODELO Y ESFUERZO

- Marco puede seleccionar explícitamente el perfil `<modelo>/<nivel>` en cada invocación.
- `s` selecciona Sonnet y `o` selecciona Opus.
- Los niveles públicos normales son `low`, `medium`, `high`, `xhigh` y `max`.
- Los cinco niveles normales se pasan sin traducción al esfuerzo homónimo de la CLI y mantienen Dynamic Workflows deshabilitado para esa sesión.
- `ultracode` equivale a esfuerzo CLI `max` con Dynamic Workflows/subagentes habilitados solo para esa sesión.
- Solo `ultracode` activa Dynamic Workflows; `xhigh` y `max` no los activan.
- Si el perfil se omite, se usa `o/low`.

La selección explícita de Marco no se escala ni se reduce automáticamente. El anfitrión puede recomendar otro perfil antes de invocar, pero necesita que Marco lo elija. No se interpreta un timeout, permiso o fallo de red como falta de inteligencia.

El wrapper comprueba que la CLI instalada exponga las banderas requeridas antes de invocar el modelo. Si no puede cumplir exactamente el perfil solicitado, falla con evidencia; no degrada silenciosamente. La configuración persistente de Claude Code no se modifica: `enableWorkflows` se fija mediante una sobrescritura efímera y se elimina al terminar.

### Checkpoint de uso y recuperación durable

El checkpoint predeterminado de Claude es 95%. Es una señal informativa para dejar evidencia recuperable; no reserva tokens, no bloquea nuevas llamadas y no interrumpe una tarea en curso.

- Si Marco o una fuente fiable informa una utilización igual o superior al checkpoint, la llamada puede comenzar o continuar normalmente. El wrapper registra `claudex_usage_checkpoint` y mantiene la captura durable.
- El valor conocido siempre se expresa como porcentaje consumido. Una indicación «queda X%» se normaliza a `100 - X`; un porcentaje ambiguo permanece desconocido.
- Cuando la CLI emite un evento de límite con utilización igual o superior al checkpoint, el supervisor conserva la ruta exacta del journal y continúa esperando el resultado. No termina el proceso por ese evento.
- Un estado `allowed_warning|rejected` también puede registrar el checkpoint aunque falte el porcentaje. En ese caso se usa `trigger_basis=status` y no se afirma que la utilización alcanzó 95%.
- La telemetría de utilización puede faltar en modo no interactivo. La recuperación durable no depende de que ese dato exista.
- Toda invocación JSON usa internamente `stream-json`, guarda al llegar cada evento JSON completo que contenga texto visible recuperable, el estado mínimo de cuota y el resultado final, y vacía el búfer en cada línea. Las líneas inválidas solo dejan longitud y hash, nunca su contenido. Los journals se conservan 72 horas; al iniciar cada operación real, el wrapper purga únicamente archivos `claudex-*.jsonl` vencidos de su directorio de recuperación. `DryRun` no modifica ese directorio, `RecoverLatest` nunca selecciona archivos más antiguos y no se crea ningún proceso persistente. Se excluyen deliberadamente el prompt, herramientas y bloques internos de razonamiento.
- Una terminación sin resultado final, un resultado final vacío o un código no cero produce un sobre `claudex_recovery` con el texto recuperable, la causa y `complete=false`. Esa salida no se presenta como validada por el esquema.
- La recuperación solo conserva texto de salida y metadatos operativos. Nunca solicita, reconstruye ni expone la cadena privada de razonamiento.
- En Claude Code anfitrión, comunicar 95% o más no detiene el trabajo. Claude continúa y prioriza conclusiones útiles antes de refinamientos opcionales; si el proveedor termina la ejecución, se entrega lo recuperable como incompleto.

---

## 7. ECONOMÍA E INDEPENDENCIA

- Compartir rutas y evidencia, no chats completos.
- Limitar cada derivación a una decisión.
- No pedir código durante la fase ciega.
- No abrir una cuarta opinión sin información nueva.
- Preferir un experimento barato cuando el problema sea empírico.
- No reutilizar sesiones contaminadas.
- No permitir que el implementador modifique las pruebas que deben juzgarlo.

El gasto adicional solo se justifica si es menor que el riesgo o retrabajo que ayuda a evitar.

---

## 8. REGISTRO

Cada activación termina con:

```text
Modo:
Pipeline:
Tarea:
Motivo de activación:
Coincidencias:
Discrepancias:
Evidencia:
Resultado o decisión final:
Quién decidió:
Próximo paso:
```

Solo lo que tenga valor futuro pasa a `decisiones.md`.

---

## 9. INVOCACIÓN: CLAUDEX

Claudex tiene dos adaptadores locales que comparten este protocolo:

- Claude Code: `.claude/skills/claudex/SKILL.md`.
- Codex: paquete autónomo en `claudex/adapters/codex/claudex/`, instalado globalmente mediante un enlace en `~/.codex/skills/claudex`. Así aparece en el selector nativo desde cualquier proyecto y conserva una sola copia editable.

En Claude Code, Marco puede activarla con:

```text
/claudex [decide|execute|review] [--pipeline core|astro|refine] <tarea>
/claudex [astro|refine] <tarea>
```

En Codex, Marco puede activarla con:

```text
$claudex [s|o]/[low|medium|high|xhigh|max|ultracode] [decide|execute|review] [--pipeline core|astro|refine] <tarea>
$claudex [s|o]/[low|medium|high|xhigh|max|ultracode] [astro|refine] <tarea>
```

Ejemplos:

```text
$claudex s/low decide <problema>
$claudex o/medium execute --pipeline astro <orden>
$claudex o/high review --pipeline refine <alcance>
$claudex o/max execute <orden>
$claudex o/ultracode astro <orden>
```

El selector es opcional; omitirlo equivale a `o/low`.

También puede decir **«usa Claudex»** y el agente inferirá el modo y el pipeline. La sintaxis visible cambia entre herramientas, pero ambas aplican este protocolo y conservan la independencia de las derivaciones.

Los agentes pueden proponer Claudex cuando se cumplan las condiciones, informando a Marco antes de consumir la segunda derivación. Una invocación explícita autoriza las llamadas locales al agente par. `decide` y `review` permanecen en solo lectura. `execute` autoriza únicamente las modificaciones normales del repositorio comprendidas por la orden; no autoriza por sí solo despliegues, operaciones destructivas, acceso a secretos, gastos ni acciones externas.

---

## 10. BITÁCORA

| Versión | Fecha | Origen | Cambio |
|---|---|---|---|
| 1.8 | 2026-08-27 | Aclaración de Marco | Añade checkpoint informativo de 95% sin bloqueo ni interrupción, streaming durable, recuperación explícita y retención oportunista de journals durante 72 horas. |
| 1.7 | 2026-08-25 | Decisión de Marco | `ultracode` pasa de esfuerzo `xhigh` a `max`; conserva Dynamic Workflows/subagentes como su diferencia exclusiva frente a `o/max`. |
| 1.6 | 2026-08-25 | Decisión de Marco | Claudex expone `xhigh` y `max` como esfuerzos normales sin Dynamic Workflows; solo `ultracode` conserva workflows/subagentes habilitados. |
| 1.5 | 2026-08-25 | Decisión de Marco | Claudex separa modo y pipeline, añade `astro` y `refine`, alias de ejecución, carga progresiva, matriz de permisos y campos estructurados opcionales. |
| 1.4 | 2026-08-24 | Decisión de Marco | La invocación sin selector cambia su perfil predeterminado de `o/ultracode` a `o/low`. |
| 1.3 | 2026-08-24 | Decisión de Marco | Claudex añade selector explícito de modelo/esfuerzo, workflows efímeros para Ultracode, raíz de proyecto validada, perfiles de contexto y salidas estructuradas. |
| 1.2 | 2026-08-19 | Decisión de Marco | Claudex incorpora los modos `decide`, `execute` y `review`, ejecución con un solo escritor y adaptador local para Codex. |
| 1.1 | 2026-08-19 | Decisión de Marco | La doble derivación adopta el nombre Claudex y se expone como habilidad local invocable mediante `/claudex`. |
| 1.0 | 2026-08-19 | Decisión de Marco | Se formaliza la doble derivación adaptativa: activación por riesgo, razonamientos ciegos, comparación de discrepancias y una sola implementación. |
