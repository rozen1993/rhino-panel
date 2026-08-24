# Historial de Claudex

La versión de la skill y la versión del protocolo son independientes. La línea base de la skill se etiqueta en Git como `claudex-v1.0.0`; el protocolo incluido conserva su versión documental `v1.2`.

## Sin publicar — próxima versión

Cambios todavía no implementados:

- impedir la lectura de `.env`, credenciales, claves y otros secretos;
- añadir timeout, límites opcionales y trazabilidad sin registrar prompts sensibles.

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
