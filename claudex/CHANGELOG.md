# Historial de Claudex

La versión de la skill y la versión del protocolo son independientes. La línea base de la skill se etiqueta en Git como `claudex-v1.0.0`; el protocolo incluido conserva su versión documental `v1.2`.

## Sin publicar — próxima versión

Cambios acordados pero todavía no implementados:

- sustituir el requisito rígido de `enableWorkflows=true` por una comprobación de capacidades de la CLI;
- exigir y validar explícitamente la ruta del proyecto antes de invocar Claude Code;
- impedir la lectura de `.env`, credenciales, claves y otros secretos;
- adaptar modelo, esfuerzo y herramientas al modo y al riesgo;
- separar perfiles de contexto consciente del proyecto y neutral;
- solicitar una salida estructurada para comparar derivaciones;
- añadir timeout, límites opcionales y trazabilidad sin registrar prompts sensibles.

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
