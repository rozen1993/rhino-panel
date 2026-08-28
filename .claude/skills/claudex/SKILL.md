---
name: claudex
description: Orquesta Claude Code y Codex para decidir, ejecutar o revisar tareas con razonamientos independientes y una sola implementación. Invócala con /claudex para doble derivación o para sus pipelines astro y refine.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Claudex para Claude Code

Lee por completo `../../../claudex/adapters/codex/claudex/references/protocolo-doble-derivacion-v1.md` y aplícalo como fuente normativa. Claude es el agente anfitrión de esta invocación; Codex es el par independiente.

## Invocación

```text
/claudex [decide|execute|review] [--pipeline core|astro|refine] <tarea>
/claudex astro <tarea>   -> execute --pipeline astro
/claudex refine <tarea>  -> execute --pipeline refine
```

Si se omite el modo o el pipeline, infiérelos de la intención y anuncia ambos antes de actuar. No obligues al usuario a repetir contexto disponible.

## Resolución del pipeline

- `core` es el pipeline predeterminado.
- Para `astro`, lee por completo `../../../claudex/adapters/codex/claudex/references/pipeline-astro.md` antes de actuar.
- Para `refine`, lee por completo `../../../claudex/adapters/codex/claudex/references/pipeline-refine.md` antes de actuar.
- El modo gobierna los permisos y el pipeline solo especializa criterios, fases y entregables.
- `decide` y `review` permanecen en solo lectura con cualquier pipeline.
- `review --pipeline refine` entrega una auditoría especializada sin parches; corregir requiere `execute --pipeline refine`.

## Coordinación con Codex

- Antes de pedir una derivación a Codex, termina la derivación de Claude.
- Invoca una sesión nueva de Codex mediante Frenemy, preferiblemente con `codex exec --sandbox read-only --ephemeral -C <repositorio> -`.
- Acota la espera de esa invocación y no dejes un proceso `codex exec` sin supervisión ni condición de terminación.
- Incluye en el paquete neutral el modo, el pipeline y los criterios y gates pertinentes de su referencia. No supongas que el par puede leer la instalación local de Claudex desde otro proyecto.
- Entrega solo el paquete neutral en la fase ciega. No incluyas la respuesta de Claude.
- No invoques `$claudex` dentro de la sesión par: solicita únicamente la función acotada de derivar, comparar o revisar para evitar recursión.
- Si hace falta una síntesis limpia, abre otra sesión nueva y entrégale el paquete neutral más ambas derivaciones.
- Si Codex falla o no está disponible, informa el fallo. Nunca fabriques una respuesta atribuida al otro agente.

## Checkpoint de recuperación al 95%

- Si Marco comunica que el uso de Claude alcanzó o superó 95%, continúa la tarea. Ese porcentaje por sí solo nunca ordena detener herramientas, subagentes, revisiones ni refinamientos.
- Interpreta «queda X%» como porcentaje restante y conviértelo a `100 - X` consumido. No conviertas una cifra cuya dirección sea ambigua.
- Prioriza las conclusiones útiles antes de refinamientos opcionales y mantén claro qué está completado, ejecutado, verificado o pendiente, pero no termines anticipadamente solo para respetar el checkpoint.
- Si el proveedor termina la ejecución, entrega o recupera el texto visible disponible y márcalo como incompleto. No expongas razonamiento interno: resume decisiones y hallazgos, no la cadena privada de pensamiento.
- Las capturas durables del wrapper se conservan durante 72 horas y se purgan oportunistamente al iniciar otra operación real; no dependen de un servicio en segundo plano.
- No afirmes que el 5% final está reservado. El 95% es únicamente un checkpoint informativo para facilitar la recuperación.

## Límites por modo

- `decide`: solo lectura; entrega recomendación o plan especializado y se detiene.
- `execute`: Claude es el único escritor en el árbol actual. Codex deriva o revisa en modo de solo lectura. Verifica y corrige antes de entregar.
- `review`: solo lectura; prioriza hallazgos demostrables y se detiene antes de corregir.

La invocación explícita autoriza las llamadas locales al agente par. Solo `execute` autoriza cambios normales dentro del repositorio y del alcance indicado. No amplía permisos para despliegues, operaciones destructivas, secretos, gastos ni acciones externas.
