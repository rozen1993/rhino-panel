# Historial de Claudex

La versión de la skill y la versión del protocolo son independientes. La línea base de la skill se etiqueta en Git como `claudex-v1.0.0`; el protocolo incluido usa su propia versión documental.

## Sin publicar — próxima versión

Implementado en el árbol actual:

- expone `xhigh` y `max` como niveles públicos normales para Sonnet y Opus;
- pasa `low|medium|high|xhigh|max` directamente a la CLI con Dynamic Workflows deshabilitado;
- conserva `ultracode` como el único perfil que activa Dynamic Workflows/subagentes y lo traduce a esfuerzo `max`;
- separa el modo `decide|execute|review` del pipeline `core|astro|refine`;
- añade los alias de ejecución `astro` y `refine` sin ampliar permisos;
- incorpora referencias progresivas para componización Astro + Tailwind y refinamiento verificable;
- amplía las salidas estructuradas con contexto opcional de pipeline, clasificación, gates, artefactos y desviaciones;
- valida `-Pipeline` en el wrapper y prueba los valores válidos e inválidos;
- añade un checkpoint informativo predeterminado de 95% que nunca bloquea una llamada ni interrumpe el trabajo en curso;
- cambia las llamadas JSON a streaming durable interno y guarda solo texto visible recuperable, estado mínimo de cuota y resultado final, sin registrar el prompt, herramientas ni razonamiento interno; los journals se conservan 72 horas y cada operación real purga únicamente los `claudex-*.jsonl` vencidos de su directorio de recuperación;
- permite recuperar el archivo exacto o el journal más reciente y distingue explícitamente una salida parcial de una respuesta final validada;
- anuncia checkpoints de uso observables para conservar la ruta de recuperación mientras Claude continúa trabajando;
- añade pruebas de continuación con uso conocido alto, recuperación parcial, resultado final vacío y recuperación final sin consumir tokens del modelo;
- mantiene alineadas las entradas de Codex y Claude Code.

Cambios todavía no implementados:

- impedir la lectura de `.env`, credenciales, claves y otros secretos;
- añadir un timeout duro y bloqueo preventivo de archivos secretos;
- investigar una fuente no interactiva garantizada para el porcentaje global de cuota; la recuperación no depende de ese dato.

## 1.1.1 — 2026-08-24

- cambia el perfil predeterminado de la invocación sin selector de `o/ultracode` a `o/low`;
- mantiene `o/ultracode` disponible únicamente cuando Marco lo solicita explícitamente.

Los hashes exactos del paquete están en `versions/claudex-1.1.1.sha256`.

## 1.1.0 — 2026-08-24

- añade perfiles públicos `s|o` con niveles `low`, `medium`, `high` y `ultracode`;
- conserva la invocación sin selector como `o/ultracode`;
- define `ultracode` como `xhigh` con Dynamic Workflows habilitado únicamente para la sesión;
- mantiene Dynamic Workflows deshabilitado para los demás niveles sin reescribir la configuración persistente;
- exige y valida `ProjectPath` antes de invocar Claude Code;
- comprueba que la CLI instalada exponga las capacidades necesarias;
- separa contexto `project` de contexto `neutral` para comparaciones limpias;
- limita las herramientas a lectura en el proyecto y a ninguna en contexto neutral;
- añade esquemas JSON para derivaciones, revisiones y comparaciones;
- incorpora `DryRun` y pruebas de la matriz de perfiles sin consumir tokens.

Los hashes exactos del paquete están en `versions/claudex-1.1.0.sha256`.

## 1.0.0 — 2026-08-24

Línea base recuperable del comportamiento original de la skill global:

- invocación no interactiva de Claude Code por su CLI local;
- modelo `opus` y esfuerzo `xhigh` fijos;
- modo de permisos `plan`;
- herramientas `Read`, `Glob` y `Grep`;
- sesiones sin persistencia;
- paquete neutral enviado como UTF-8 Base64 por la entrada estándar;
- requisito rígido de `enableWorkflows=true`;
- directorio del proyecto heredado implícitamente del proceso anfitrión.

Los hashes exactos del paquete están en `versions/claudex-1.0.0.sha256`.
