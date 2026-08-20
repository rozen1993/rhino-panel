# CLAUDEX — PROTOCOLO DE DOBLE DERIVACIÓN Y EJECUCIÓN VERIFICADA — v1.2

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

## 2. PAQUETE NEUTRAL

Ambos agentes reciben exactamente:

```text
MODO Y TAREA
`decide`, `execute` o `review`, seguido de la pregunta u orden exacta.

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

- Incertidumbre normal: modelos equilibrados, esfuerzo `medium`.
- Arquitectura, seguridad o datos: modelos fuertes, esfuerzo `high`.
- Problema crítico tras fallos previos: máxima capacidad justificada, `xhigh` o equivalente.
- Comparación: modelo fuerte y contexto limpio.

Escalar esfuerzo si el modelo entiende pero no cierra. Escalar modelo si falta capacidad. No escalar un timeout, permiso o fallo de red como si fuera falta de inteligencia.

Los alias concretos cambian; importa usar niveles equivalentes en la versión disponible.

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
- Codex: integración activa mediante `AGENTS.md` y paquete de skill en `claudex/adapters/codex/claudex/SKILL.md`. Para aparecer en el selector nativo, el paquete se instala en `.agents/skills/claudex/SKILL.md`.

En Claude Code, Marco puede activarla con:

```text
/claudex [decide|execute|review] <tarea>
```

En Codex, Marco puede activarla con:

```text
$claudex [decide|execute|review] <tarea>
```

También puede decir **«usa Claudex»** y el agente inferirá el modo. La sintaxis visible cambia entre herramientas, pero ambas aplican este protocolo y conservan la independencia de las derivaciones.

Los agentes pueden proponer Claudex cuando se cumplan las condiciones, informando a Marco antes de consumir la segunda derivación. Una invocación explícita autoriza las llamadas locales al agente par. `decide` y `review` permanecen en solo lectura. `execute` autoriza únicamente las modificaciones normales del repositorio comprendidas por la orden; no autoriza por sí solo despliegues, operaciones destructivas, acceso a secretos, gastos ni acciones externas.

---

## 10. BITÁCORA

| Versión | Fecha | Origen | Cambio |
|---|---|---|---|
| 1.2 | 2026-08-19 | Decisión de Marco | Claudex incorpora los modos `decide`, `execute` y `review`, ejecución con un solo escritor y adaptador local para Codex. |
| 1.1 | 2026-08-19 | Decisión de Marco | La doble derivación adopta el nombre Claudex y se expone como habilidad local invocable mediante `/claudex`. |
| 1.0 | 2026-08-19 | Decisión de Marco | Se formaliza la doble derivación adaptativa: activación por riesgo, razonamientos ciegos, comparación de discrepancias y una sola implementación. |
