# Instrucciones locales para Codex

## Datos de trabajo reales

Desde la confirmación de Marco, todos los datos del proyecto desplegado son reales.
Nunca usar el proyecto remoto ni la base local del usuario para fixtures, resets,
limpiezas, pruebas destructivas o migraciones de demostración. Usar bases UUID
desechables y retirar solo los recursos creados por la propia prueba.
Conservar actividades, cuentas, entregas, mensajes e historial. Las correcciones
deben ser trazables y las bajas recuperables. Antes de migrar el esquema remoto,
obtener un respaldo privado verificado; no subir dumps ni credenciales a Git.
Un cambio de infraestructura con coste, destino de respaldo externo o eliminación
irreversible requiere una decisión explícita del propietario, no se infiere de
una petición de pruebas o mantenimiento.

Excepción explícita autorizada por Marco el 11/09/2026: implementar eliminación
definitiva de cuentas desactivadas y sus datos relacionados, y vaciado definitivo
de papelera, incluidos historiales y evidencias. Solo mediante el flujo de Admin
con contraseña, vista previa de impacto y confirmación. Esta autorización permite
construir y probar el flujo en bases UUID desechables; no autoriza al agente a
ejecutar eliminaciones de registros reales como prueba. Los respaldos externos
y los archivos enlazados quedan fuera del borrado de la plataforma.

Este repositorio usa **Claudex**, definido normativamente en `claudex/adapters/codex/claudex/references/protocolo-doble-derivacion-v1.md`.

Cuando Marco escriba `$claudex`, «usa Claudex» o pida doble derivación, ejecución verificada o revisión cruzada:

1. lee el protocolo completo;
2. resuelve el modo `decide|execute|review` y el pipeline `core|astro|refine` según la invocación o intención;
3. carga `claudex/adapters/codex/claudex/references/pipeline-astro.md` o `claudex/adapters/codex/claudex/references/pipeline-refine.md` solo cuando corresponda;
4. usa Claude Code como par independiente mediante `claudex/adapters/codex/claudex/scripts/invoke-claude.cmd`;
5. conserva un único escritor y respeta los límites de autorización del protocolo.

El paquete instalable y autónomo de la skill de Codex se mantiene en `claudex/adapters/codex/claudex/`. Se descubre globalmente mediante `~/.codex/skills/claudex`, enlazado a ese directorio.
