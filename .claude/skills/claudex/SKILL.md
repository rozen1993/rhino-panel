---
name: claudex
description: Orquesta Claude Code y Codex para decidir, ejecutar o revisar tareas con razonamientos independientes y una sola implementación. Invócala con /claudex cuando se busque una decisión difícil, una ejecución verificada o una revisión cruzada.
tools: Read, Glob, Grep, Bash, Edit, Write
---

# Claudex para Claude Code

Lee por completo `protocolo-doble-derivacion-v1.md` y aplícalo como fuente normativa. Claude es el agente anfitrión de esta invocación; Codex es el par independiente.

## Invocación

```text
/claudex decide <problema>
/claudex execute <orden>
/claudex review <cambio o alcance>
```

Si se omite el modo, infiérelo de la intención y anúncialo antes de actuar. No obligues al usuario a repetir contexto disponible.

## Coordinación con Codex

- Antes de pedir una derivación a Codex, termina la derivación de Claude.
- Invoca una sesión nueva de Codex mediante Frenemy, preferiblemente con `codex exec --sandbox read-only --ephemeral -C <repositorio> -`.
- Entrega solo el paquete neutral en la fase ciega. No incluyas la respuesta de Claude.
- No invoques `$claudex` dentro de la sesión par: solicita únicamente la función acotada de derivar, comparar o revisar para evitar recursión.
- Si hace falta una síntesis limpia, abre otra sesión nueva y entrégale el paquete neutral más ambas derivaciones.
- Si Codex falla o no está disponible, informa el fallo. Nunca fabriques una respuesta atribuida al otro agente.

## Límites por modo

- `decide`: solo lectura; entrega recomendación y se detiene.
- `execute`: Claude es el único escritor en el árbol actual. Codex deriva o revisa en modo de solo lectura. Verifica y corrige antes de entregar.
- `review`: solo lectura; prioriza hallazgos demostrables y se detiene antes de corregir.

La invocación explícita autoriza las llamadas locales al agente par. Solo `execute` autoriza cambios normales dentro del repositorio y del alcance indicado. No amplía permisos para despliegues, operaciones destructivas, secretos, gastos ni acciones externas.

