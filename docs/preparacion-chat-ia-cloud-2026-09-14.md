# Preparacion del chat IA para Codex Cloud

Fecha: 14/09/2026. Estado: copia local independiente preparada; **sin tarea
iniciada en la nube, sin implementacion del chat y sin despliegue**.

Marco autorizo construir el chat en una copia de la plataforma, probarlo con
aislamiento y preparar su posterior acoplamiento. La auditoria es la entrada
principal y remite al plan tecnico para los contratos y las fases.

## Copia preparada

- Origen: `rozen1993/rhino-panel`, base `41d6f6015387b097fb659ead6aa9745561c20803`.
- Copia: `C:/Users/MARCO/AppData/Local/Temp/davinci-chat-cloud-002eb36d`.
- Rama propia: `codex/chat-ia-cloud-20260914`.
- Commit del encargo: `d6052be67b66108f23dbeccf03071eb082d43bc3`.
- Git independiente, clonado con `--no-hardlinks`, sin alternates hacia el
  repositorio de trabajo. El origin de la copia es el GitHub existente.
- No se realizo push; la rama solo existe en la copia local.
- Se incorporaron auditoria, plan, catalogo publico, encargo y runner de pruebas.
- No se copio `frontend/.env.local`, archivos locales ignorados ni bases reales.

Copias duraderas de las instrucciones preparadas:
[encargo](chat-ia-cloud/encargo.md) y [runner](chat-ia-cloud/chat-ia.sh).
En la rama cloud sus rutas son `docs/encargo-chat-ia-cloud-2026-09-14.md` y
`scripts/cloud/chat-ia.sh`, respectivamente.

## Acceso comprobado y bloqueo

`codex login status` confirmo sesion ChatGPT activa. `codex cloud list` devolvio
una lista de tareas vacia. El selector de entornos no mostro un entorno del
repositorio y devolvio:

> environment_repo_access_failed: Codex can't access this repository. Confirm Codex has access on GitHub and try again.

No se solicitaron ni inspeccionaron claves de la cuenta. La conexion de GitHub
de Codex debe permitir acceso a `rozen1993/rhino-panel` antes de poder delegar.
El usuario puede hacerlo desde [Codex Cloud](https://chatgpt.com/codex), conectando
GitHub y seleccionando ese repositorio. No necesita proporcionar `.env.local`,
claves Supabase ni OpenRouter para este desarrollo con datos sinteticos.

## Comprobaciones realizadas

- `frontend/` y `supabase/` de la copia no tienen diferencias respecto a la base.
- SHA-256 de auditoria, plan y catalogo coincide entre origen y copia.
- Sintaxis Bash del runner valida; modo `check` paso sin consultar base/proveedor.
- Diff del commit sin errores de whitespace; rama de copia con arbol limpio.
- Revision independiente del encargo y runner sin bloqueantes detectados.

No se instalaron dependencias ni se ejecutaron las baterias de frontend, e2e o
PostgreSQL. La comprobacion del runner reconoce variables/rutas concretas; no
es un escaner completo de secretos ni un bloqueo tecnico de red.

## Continuacion concreta

1. Confirmar que Codex Cloud ya accede a `rozen1993/rhino-panel`.
2. Antes del push de la rama, verificar/suprimir cualquier despliegue automatico
   de esa rama de desarrollo; nunca usar un preview con configuracion real como
   entorno de pruebas. Mantener master intacta.
3. Enviar solo la rama preparada al repositorio existente y crear/seleccionar su
   entorno Cloud, Node 24, sin secretos de produccion. Setup desde raiz:
   `bash scripts/cloud/chat-ia.sh setup`. Acceso a Internet del agente apagado
   salvo necesidad tecnica concreta; la fase de setup necesita red.
4. Enviar el encargo con `codex cloud exec --env <ID_REAL> --branch
   codex/chat-ia-cloud-20260914`, una sola tentativa. Usar el archivo preparado
   como argumento mediante lectura segura, sin reconstruir texto como shell.
5. Registrar ID/URL y confirmar estado running en Codex Cloud. Solo entonces
   indicar que la laptop ya no es necesaria para esa tarea.
6. Revisar resultado, regresiones y pruebas de base reales en recursos UUID
   desechables. No equiparar mocks con validacion RLS. Continuar fases pendientes
   antes de afirmar que el chat esta terminado.
7. Preparar integracion revisable y desactivable. Activacion real, inferencias
   pagadas y migraciones remotas conservan sus decisiones pendientes; cualquier
   migracion remota requiere respaldo privado verificado conforme a AGENTS.md.

Fuentes oficiales verificadas: [Codex Cloud](https://learn.chatgpt.com/es-419/docs/cloud),
[delegacion desde CLI](https://learn.chatgpt.com/es-419/docs/codex/cli) y
[entornos](https://learn.chatgpt.com/es-419/docs/environments/cloud-environment).
