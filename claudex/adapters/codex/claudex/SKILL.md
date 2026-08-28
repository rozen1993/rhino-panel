---
name: claudex
description: Orquesta Codex y Claude Code para decidir, ejecutar o revisar tareas con razonamientos independientes y una sola implementación. Úsala cuando se invoque $claudex, se pida doble derivación o se soliciten sus pipelines astro y refine.
---

# Claudex para Codex

Lee por completo `references/protocolo-doble-derivacion-v1.md` y aplícalo como fuente normativa. Resuelve esta ruta, los esquemas, las referencias y los scripts respecto del directorio que contiene este `SKILL.md`, nunca respecto del directorio de trabajo del proyecto. Codex es el agente anfitrión; Claude Code es el par independiente.

## Invocación

La forma canónica separa modo y pipeline:

```text
$claudex [perfil] [decide|execute|review] [--pipeline core|astro|refine] <tarea>
```

Los alias de ejecución expanden de esta forma:

```text
$claudex [perfil] astro <tarea>   -> execute --pipeline astro
$claudex [perfil] refine <tarea>  -> execute --pipeline refine
```

El perfil tiene la forma `<modelo>/<nivel>`:

- `s` selecciona `sonnet` y `o` selecciona `opus`.
- Los niveles públicos normales son `low`, `medium`, `high`, `xhigh` y `max`; se pasan sin traducción al esfuerzo homónimo de la CLI.
- `ultracode` equivale a esfuerzo CLI `max` con Dynamic Workflows/subagentes habilitados solo para esa invocación.
- Solo `ultracode` activa Dynamic Workflows. Incluso `xhigh` y `max` los mantienen deshabilitados.

Ejemplos:

```text
$claudex s/low decide <problema>
$claudex o/medium execute --pipeline astro <orden>
$claudex o/high review --pipeline refine <alcance>
$claudex o/max execute <orden>
$claudex o/ultracode astro <orden>
```

Si se omite el perfil, usa `o/low`. Si se omite el modo o el pipeline, infiérelos de la intención y anuncia ambos antes de actuar. No obligues al usuario a repetir contexto disponible.

## Resolución del pipeline

- `core` es el pipeline predeterminado y conserva el comportamiento general de Claudex.
- `astro` especializa criterios, fases y entregables para componentes Astro + Tailwind. Antes de actuar, lee por completo `references/pipeline-astro.md`.
- `refine` especializa la auditoría y mejora verificable sin cambiar la intención ni el contrato público. Antes de actuar, lee por completo `references/pipeline-refine.md`.
- El modo gobierna siempre los permisos. El pipeline nunca autoriza escritura: `decide` y `review` siguen siendo de solo lectura con cualquier pipeline.
- `review --pipeline refine` es válido y entrega hallazgos, no parches. Corregirlos requiere `execute --pipeline refine`.

## Coordinación con Claude Code

- Antes de pedir una derivación a Claude, termina la derivación de Codex.
- Usa siempre `scripts/invoke-claude.cmd`, resuelto desde el directorio de esta skill; no invoques directamente el ejecutable de Claude Code ni pases el prompt como argumento posicional.
- Determina la raíz absoluta del proyecto actual y pásala siempre mediante `-ProjectPath`.
- Traduce el perfil público directamente a `-Profile`. No escales ni reduzcas el modelo o el esfuerzo elegido por Marco.
- Pasa el pipeline resuelto mediante `-Pipeline`; el valor predeterminado es `core`.
- Incluye en el paquete neutral el modo, el pipeline y los criterios y gates pertinentes de su referencia. No supongas que el par puede leer la instalación local de Claudex desde otro proyecto.
- Usa `-Phase derive` para una derivación, `-Phase review` para revisar la implementación y `-Phase compare` para una síntesis limpia.
- Usa contexto `project` para derivar o revisar con acceso de solo lectura al repositorio. La fase `compare` fuerza contexto `neutral`, un directorio vacío y ninguna herramienta.
- Solicita salida `json`. Lee `structured_output` del sobre JSON de Claude y conserva el mensaje real cuando la CLI o la validacion del esquema fallen.
- El wrapper comprueba las capacidades de la CLI antes de gastar tokens. Si falta una bandera requerida, informa el fallo; no simules una degradacion silenciosa.
- El wrapper aplica `enableWorkflows=true` únicamente a `ultracode` y `false` a los demás niveles mediante un archivo temporal pasado con `--settings`. Nunca modifica `~/.claude/settings.json`; elimina el archivo temporal al terminar, incluso ante errores.
- Mantén `--permission-mode plan`, sesiones sin persistencia y herramientas limitadas a `Read`, `Glob` y `Grep` en contexto de proyecto.

### Checkpoint de uso y recuperación

- Usa `-UsageCheckpointPercent 95` en las invocaciones a Claude. Si Marco o una fuente fiable comunica la utilización actual, pásala además mediante `-KnownUsagePercent`.
- `-KnownUsagePercent` siempre representa porcentaje consumido. Si Marco dice «queda X%», normaliza primero a `100 - X`; si la frase es ambigua, no inventes el dato.
- Alcanzar o superar el checkpoint nunca bloquea una llamada ni interrumpe el trabajo en curso. Claude continúa hasta entregar su resultado o hasta que la propia CLI termine la ejecución.
- Para salida `json`, el wrapper usa internamente streaming durable y guarda en un JSONL solo texto visible recuperable, estado mínimo de cuota y el resultado final. El contrato externo sigue siendo un único resultado final; si este no existe, devuelve `claudex_recovery`, que es material parcial y debe etiquetarse como incompleto.
- Los journals se conservan durante 72 horas. Al iniciar cada operación real, el wrapper purga únicamente archivos `claudex-*.jsonl` vencidos dentro de su directorio de recuperación; `DryRun` no modifica ese directorio y no se instala ningún proceso persistente.
- Supervisa la invocación en intervalos no mayores de 10 segundos y conserva la ruta anunciada por `CLAUDEX_RECOVERY_FILE`. Si aparece `CLAUDEX_USAGE_CHECKPOINT`, registra el aviso y sigue esperando: no interrumpas el proceso. Si la invocación termina sin que el wrapper pueda emitir su sobre, confirma que el proceso acabó y recupera con `-RecoverFile <ruta>`. Usa `-RecoverLatest` solo como último recurso si perdiste la ruta exacta y no hay otra invocación concurrente.
- La utilización exacta no siempre está expuesta por la CLI no interactiva. El checkpoint es telemetría informativa, no una reserva garantizada ni una condición de parada. Un estado `allowed_warning|rejected` también puede registrarlo sin porcentaje; consulta `trigger_basis`, `utilization_known` y `threshold_reached` antes de describir la causa.
- Nunca presentes una recuperación como salida validada por el esquema y nunca solicites ni expongas razonamiento interno. Conserva únicamente conclusiones, hallazgos, evidencia y el estado real de completitud.

Codifica el paquete neutral como UTF-8 Base64 y envíalo por la entrada estándar:

```powershell
$paquete = @'
Describe aquí la consulta neutral para Claude.
'@
$paqueteCodificado = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($paquete))
$scriptClaudex = Join-Path '<directorio-de-la-skill>' 'scripts\invoke-claude.cmd'
$paqueteCodificado | & $scriptClaudex `
  -EncodedStdin `
  -ProjectPath '<raíz-absoluta-del-proyecto>' `
  -Profile 'o/low' `
  -Pipeline 'core' `
  -Phase derive `
  -ContextProfile project `
  -UsageCheckpointPercent 95 `
  -OutputFormat json
```

- Entrega solo el paquete neutral en la fase ciega. No incluyas la respuesta de Codex.
- No invoques `/claudex` dentro de la sesión par: solicita únicamente derivar, comparar o revisar para evitar recursión.
- Si hace falta una síntesis limpia, abre otra sesión con `-Phase compare` y entrégale el paquete neutral más ambas derivaciones.
- Si Claude falla o no está disponible, informa el fallo y conserva el mensaje real. Nunca fabriques una respuesta atribuida al otro agente.

## Límites por modo

- `decide`: solo lectura; entrega recomendación o plan especializado y se detiene.
- `execute`: Codex es el único escritor en el árbol actual. Claude deriva o revisa en modo de solo lectura. Verifica y corrige antes de entregar.
- `review`: solo lectura; prioriza hallazgos demostrables y se detiene antes de corregir.

La invocación explícita autoriza las llamadas locales al agente par. Solo `execute` autoriza cambios normales dentro del repositorio y del alcance indicado. No amplía permisos para despliegues, operaciones destructivas, secretos, gastos ni acciones externas.
