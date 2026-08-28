# Instrucciones locales para Codex

Este repositorio usa **Claudex**, definido normativamente en `claudex/adapters/codex/claudex/references/protocolo-doble-derivacion-v1.md`.

Cuando Marco escriba `$claudex`, «usa Claudex» o pida doble derivación, ejecución verificada o revisión cruzada:

1. lee el protocolo completo;
2. resuelve el modo `decide|execute|review` y el pipeline `core|astro|refine` según la invocación o intención;
3. carga `claudex/adapters/codex/claudex/references/pipeline-astro.md` o `claudex/adapters/codex/claudex/references/pipeline-refine.md` solo cuando corresponda;
4. usa Claude Code como par independiente mediante `claudex/adapters/codex/claudex/scripts/invoke-claude.cmd`;
5. conserva un único escritor y respeta los límites de autorización del protocolo.

El paquete instalable y autónomo de la skill de Codex se mantiene en `claudex/adapters/codex/claudex/`. Se descubre globalmente mediante `~/.codex/skills/claudex`, enlazado a ese directorio.
