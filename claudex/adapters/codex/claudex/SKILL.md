---
name: claudex
description: Orquesta Codex y Claude Code para decidir, ejecutar o revisar tareas con razonamientos independientes y una sola implementación. Úsala cuando el usuario invoque $claudex o solicite doble derivación, ejecución verificada o revisión cruzada en este repositorio.
---

# Claudex para Codex

Lee por completo `protocolo-doble-derivacion-v1.md` y aplícalo como fuente normativa. Codex es el agente anfitrión de esta invocación; Claude Code es el par independiente.

## Invocación

```text
$claudex decide <problema>
$claudex execute <orden>
$claudex review <cambio o alcance>
```

Si se omite el modo, infiérelo de la intención y anúncialo antes de actuar. No obligues al usuario a repetir contexto disponible.

## Coordinación con Claude Code

- Antes de pedir una derivación a Claude, termina la derivación de Codex.
- Invoca una sesión nueva de Claude Code mediante Frenemy, preferiblemente con `claude.cmd --print --permission-mode plan --tools "Read,Glob,Grep" --no-session-persistence`.
- Entrega solo el paquete neutral en la fase ciega. No incluyas la respuesta de Codex.
- No invoques `/claudex` dentro de la sesión par: solicita únicamente la función acotada de derivar, comparar o revisar para evitar recursión.
- Si hace falta una síntesis limpia, abre otra sesión nueva y entrégale el paquete neutral más ambas derivaciones.
- Si Claude falla o no está disponible, informa el fallo. Nunca fabriques una respuesta atribuida al otro agente.

## Límites por modo

- `decide`: solo lectura; entrega recomendación y se detiene.
- `execute`: Codex es el único escritor en el árbol actual. Claude deriva o revisa en modo de solo lectura. Verifica y corrige antes de entregar.
- `review`: solo lectura; prioriza hallazgos demostrables y se detiene antes de corregir.

La invocación explícita autoriza las llamadas locales al agente par. Solo `execute` autoriza cambios normales dentro del repositorio y del alcance indicado. No amplía permisos para despliegues, operaciones destructivas, secretos, gastos ni acciones externas.

