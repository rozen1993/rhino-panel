---
name: claudex
description: Orquesta Codex y Claude Code para decidir, ejecutar o revisar tareas con razonamientos independientes y una sola implementación. Úsala cuando el usuario invoque $claudex o solicite doble derivación, ejecución verificada o revisión cruzada en el proyecto actual.
---

# Claudex para Codex

Lee por completo `references/protocolo-doble-derivacion-v1.md` y aplícalo como fuente normativa. Resuelve esta ruta y las de los scripts respecto del directorio que contiene este `SKILL.md`, nunca respecto del directorio de trabajo del proyecto. Codex es el agente anfitrión de esta invocación; Claude Code es el par independiente.

## Invocación

```text
$claudex decide <problema>
$claudex execute <orden>
$claudex review <cambio o alcance>
```

Si se omite el modo, infiérelo de la intención y anúncialo antes de actuar. No obligues al usuario a repetir contexto disponible.

## Coordinación con Claude Code

- Antes de pedir una derivación a Claude, termina la derivación de Codex.
- Usa siempre `scripts/invoke-claude.cmd`, resuelto desde el directorio de esta skill; no invoques el `claude.cmd` instalado por npm directamente ni pases el prompt como argumento posicional. El lanzador propio evita depender de la política global de ejecución de PowerShell.
- El wrapper fija `opus` con esfuerzo `xhigh` y exige `enableWorkflows=true`. Esta combinación es el equivalente no interactivo de la configuración **Ultracode** solicitada por Marco.
- Codifica el paquete como UTF-8 Base64 y envíalo por la entrada estándar. Esto preserva Unicode, saltos de línea y prompts extensos en Windows. Sustituye `<directorio-de-la-skill>` por la ruta absoluta del directorio que contiene este archivo:

```powershell
$paquete = @'
Describe aquí la consulta neutral para Claude.
'@
$paqueteCodificado = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($paquete))
$scriptClaudex = Join-Path '<directorio-de-la-skill>' 'scripts\invoke-claude.cmd'
$paqueteCodificado | & $scriptClaudex -EncodedStdin
```

- Entrega solo el paquete neutral en la fase ciega. No incluyas la respuesta de Codex.
- No invoques `/claudex` dentro de la sesión par: solicita únicamente la función acotada de derivar, comparar o revisar para evitar recursión.
- Si hace falta una síntesis limpia, abre otra sesión nueva y entrégale el paquete neutral más ambas derivaciones.
- Si Claude falla o no está disponible, informa el fallo y conserva el mensaje real. Nunca fabriques una respuesta atribuida al otro agente.

## Límites por modo

- `decide`: solo lectura; entrega recomendación y se detiene.
- `execute`: Codex es el único escritor en el árbol actual. Claude deriva o revisa en modo de solo lectura. Verifica y corrige antes de entregar.
- `review`: solo lectura; prioriza hallazgos demostrables y se detiene antes de corregir.

La invocación explícita autoriza las llamadas locales al agente par. Solo `execute` autoriza cambios normales dentro del repositorio y del alcance indicado. No amplía permisos para despliegues, operaciones destructivas, secretos, gastos ni acciones externas.
