---
name: claudex
description: Orquesta Codex y Claude Code para decidir, ejecutar o revisar tareas con razonamientos independientes y una sola implementación. Úsala cuando el usuario invoque $claudex o solicite doble derivación, ejecución verificada o revisión cruzada en el proyecto actual.
---

# Claudex para Codex

Lee por completo `references/protocolo-doble-derivacion-v1.md` y aplícalo como fuente normativa. Resuelve esta ruta, los esquemas y los scripts respecto del directorio que contiene este `SKILL.md`, nunca respecto del directorio de trabajo del proyecto. Codex es el agente anfitrión; Claude Code es el par independiente.

## Invocación

```text
$claudex [perfil] decide <problema>
$claudex [perfil] execute <orden>
$claudex [perfil] review <cambio o alcance>
```

El perfil tiene la forma `<modelo>/<nivel>`:

- `s` selecciona `sonnet` y `o` selecciona `opus`.
- Los niveles públicos son `low`, `medium`, `high` y `ultracode`.
- `ultracode` equivale a esfuerzo CLI `xhigh` con Dynamic Workflows habilitado solo para esa invocación.

Ejemplos:

```text
$claudex s/low decide <problema>
$claudex o/medium execute <orden>
$claudex o/ultracode review <alcance>
```

Si se omite el perfil, usa `o/low`. Si se omite el modo, infiérelo de la intención y anúncialo antes de actuar. No obligues al usuario a repetir contexto disponible.

## Coordinación con Claude Code

- Antes de pedir una derivación a Claude, termina la derivación de Codex.
- Usa siempre `scripts/invoke-claude.cmd`, resuelto desde el directorio de esta skill; no invoques directamente el ejecutable de Claude Code ni pases el prompt como argumento posicional.
- Determina la raíz absoluta del proyecto actual y pásala siempre mediante `-ProjectPath`.
- Traduce el perfil público directamente a `-Profile`. No escales ni reduzcas el modelo o el esfuerzo elegido por Marco.
- Usa `-Phase derive` para una derivación, `-Phase review` para revisar la implementación y `-Phase compare` para una síntesis limpia.
- Usa contexto `project` para derivar o revisar con acceso de solo lectura al repositorio. La fase `compare` fuerza contexto `neutral`, un directorio vacío y ninguna herramienta.
- Solicita salida `json`. Lee `structured_output` del sobre JSON de Claude y conserva el mensaje real cuando la CLI o la validación del esquema fallen.
- El wrapper comprueba las capacidades de la CLI antes de gastar tokens. Si falta una bandera requerida, informa el fallo; no simules una degradación silenciosa.
- El wrapper aplica `enableWorkflows=true` únicamente a `ultracode` y `false` a los demás niveles mediante un archivo temporal pasado con `--settings`. Nunca modifica `~/.claude/settings.json`; elimina el archivo temporal al terminar, incluso ante errores.
- Mantén `--permission-mode plan`, sesiones sin persistencia y herramientas limitadas a `Read`, `Glob` y `Grep` en contexto de proyecto.

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
  -Phase derive `
  -ContextProfile project `
  -OutputFormat json
```

- Entrega solo el paquete neutral en la fase ciega. No incluyas la respuesta de Codex.
- No invoques `/claudex` dentro de la sesión par: solicita únicamente derivar, comparar o revisar para evitar recursión.
- Si hace falta una síntesis limpia, abre otra sesión con `-Phase compare` y entrégale el paquete neutral más ambas derivaciones.
- Si Claude falla o no está disponible, informa el fallo y conserva el mensaje real. Nunca fabriques una respuesta atribuida al otro agente.

## Límites por modo

- `decide`: solo lectura; entrega recomendación y se detiene.
- `execute`: Codex es el único escritor en el árbol actual. Claude deriva o revisa en modo de solo lectura. Verifica y corrige antes de entregar.
- `review`: solo lectura; prioriza hallazgos demostrables y se detiene antes de corregir.

La invocación explícita autoriza las llamadas locales al agente par. Solo `execute` autoriza cambios normales dentro del repositorio y del alcance indicado. No amplía permisos para despliegues, operaciones destructivas, secretos, gastos ni acciones externas.
