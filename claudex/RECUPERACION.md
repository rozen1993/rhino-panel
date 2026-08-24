# Recuperación de Claudex

La línea base estable se identifica con la etiqueta Git `claudex-v1.0.0`. Antes de restaurarla, conserva cualquier cambio posterior que quieras mantener y comprueba el estado del repositorio.

## Restauración del paquete en el árbol actual

Restaura únicamente los archivos relacionados con Claudex desde la etiqueta, sin afectar `frontend`, `docs`, `supabase` ni el resto del proyecto:

```powershell
git restore --source claudex-v1.0.0 -- `
  .agents/skills/claudex/SKILL.md `
  .claude/skills/claudex/SKILL.md `
  AGENTS.md `
  claudex `
  protocolo-doble-derivacion-v1.md
```

Si una versión posterior añadió archivos no rastreados dentro de `claudex/`, revísalos manualmente antes de retirarlos. No uses `git clean` ni una restauración destructiva de todo el repositorio.

## Restauración aislada recomendada

Cuando el árbol actual tenga trabajo en curso, crea un worktree separado desde la etiqueta y apunta temporalmente la skill global hacia su paquete. Esto conserva intacto el proyecto activo:

```powershell
git worktree add --detach C:\Users\MARCO\Desktop\Sistema_R-claudex-1.0 claudex-v1.0.0
```

El paquete recuperado quedará en:

```text
C:\Users\MARCO\Desktop\Sistema_R-claudex-1.0\claudex\adapters\codex\claudex
```

Antes de cambiar el enlace global `C:\Users\MARCO\.codex\skills\claudex`, verifica siempre que tanto el destino actual como el nuevo sean rutas absolutas válidas. El cambio del enlace debe hacerse como una operación separada y explícitamente solicitada.

## Verificación

Después de restaurar, compara los hashes SHA-256 del paquete con `claudex/versions/claudex-1.0.0.sha256` y abre una sesión nueva de Codex para actualizar el descubrimiento de skills.
