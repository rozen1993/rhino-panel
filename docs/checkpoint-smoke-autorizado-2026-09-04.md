# Checkpoint de smoke autenticado autorizado

**Fecha:** 2026-09-04 19:37 America/Lima.

**Estado:** intento detenido por cuota de Claude Code, antes de implementar o
ejecutar el runner remoto. No equivale a Go de RC1 ni a goal completo.

## Autorización vigente

Marco respondió «autorizado estas» a la solicitud de crear y eliminar únicamente
cuentas y datos temporales de prueba en staging, usando la credencial
administrativa de Supabase solo en memoria, sin mostrarla ni modificar las seis
cuentas actuales. No volver a pedir esa misma autorización al reanudar. No cubre
Producción, gastos, cambio del vínculo Burson existente, reset remoto ni
desactivación global de controles de seguridad.

## Trabajo preservado y estado externo

- `HEAD` y `origin/equipo`: `2895b6d436c69b8306af15b2ca822f57d6392378`.
- Preview del cierre documental: `dpl_BGkS3nf8N9hPSTUQpvYZUDZTJmk1`,
  `https://rhino-panel-isfo9p9xh-marcos-projects-65572cc0.vercel.app`.
- Alias estable:
  `https://rhino-panel-git-equipo-marcos-projects-65572cc0.vercel.app`.
- No se creó ningún usuario, perfil ni actividad temporal en este intento.
  No se leyó la credencial administrativa; no se leyeron `.env.local`, archivos
  de tokens ni `supabase/.temp/project-ref`.
- No hubo commit, push, despliegue ni cambio remoto en este intento. Solo se
  ejecutó una consulta de catálogo en transacción de solo lectura.
- La consulta confirmó `current_user=postgres`; las siete tablas de producto
  pertenecen a postgres, tienen RLS activo y el rol tiene INSERT/DELETE. No hay
  triggers públicos no internos. Se confirmaron las FKs de producto y Auth.
- `profiles.id → auth.users` es RESTRICT. Auditorías y mensajes restringen la
  retirada de perfiles/actividades; jornadas y sesiones de aplicación tienen
  CASCADE. En Auth, identidades/sesiones/MFA y otros recursos dependientes tienen
  CASCADE hacia el usuario; refresh_tokens depende de sessions. Los logs de
  seguridad del proveedor no se deben borrar ni prometer que desaparezcan.

## Claudex: resultado incompleto

Modo `execute`, pipeline `core`, perfil `o/max`, fase `derive`. El DryRun aprobó
con Claude Code 2.1.226. La sesión real emitió advertencia al 93 % y terminó con
código 1, estado de cuota `rejected`, máximo observado 99 %.

- Sesión de ejecución terminal: `1816` (no hay proceso esperando).
- Journal exacto:
  `C:\Users\MARCO\AppData\Local\Claudex\recovery\claudex-20260905T002744667Z-32cecf913d044765b2b2d961711b9f78.jsonl`.
- SHA-256: `DFB8904D694E8EFCF21F2484C8A7A9B50AA6DF4B01FD62A781DFDF6E0604753B`.
- Sobre recibido: `claudex_recovery`, `complete=false`,
  `structured_output=null`, 78 líneas válidas, ninguna inválida.
- Renovación informada por el proveedor: **2026-09-04 22:20 Lima**
  (2026-09-05 03:20 UTC). Es una hora reportada, no garantía de disponibilidad.

El texto recuperado observó que las superficies de producto no permiten borrar
cuentas/actividades físicamente ni desactivar la única Burson. Esto coincide
con las restricciones de RPC/FK ya inspeccionadas, pero no es un dictamen final
sobre la limpieza administrativa autorizada. No adoptar ni descartar el plan
basándose en esa salida parcial.

## Derivación previa de Codex, aún sin comparación final

La propuesta a contrastar es un runner separado del E2E demo, con contextos
efímeros, sin traces, capturas, dumps ni storageState. Identificar cada fixture
por UUID/runId y guardar un manifiesto de recuperación sin secretos. Capturar
credenciales de la CLI autorizada solo en memoria. No cargar el arnés local:
reinicia toda su base y altera el vínculo especial durante sus pruebas.

Bootstrap explícito de un Admin temporal mediante Auth Admin y perfil propio,
sin suplantar al Admin real; ese bootstrap no certifica el alta de producto.
Después probar altas normales de dos Operarios y Burson mediante UI/Edge,
siempre `is_burson_operator=false`, login, puerta de clave temporal, cambio y
reingreso. Completar la matriz de permisos, conversación, Papelera e Histórico.

La limpieza propuesta usa el rol administrativo de PostgreSQL, no las RPC de
producto: validación exacta de manifiesto/baseline, advisory lock existente,
bloqueos de filas propias en orden estable y DELETE acotados de auditorías,
mensajes, actividades y perfiles; luego Auth Admin por UUID exacto. No alterar
RLS, triggers, grants ni reiniciar secuencias. Si Auth se retira después del
commit de producto, reconocer las dos fases y permitir reintento exacto ante
fallo parcial. El diseño definitivo aún requiere comparación Claudex.

Burson referencia al Operario especial real sin modificar su perfil. Si un
usuario real interactúa con un fixture, detener su limpieza para no borrar
trabajo ajeno. Comprobar ausencia de referencias externas a cuentas temporales
y que las seis cuentas, su vínculo y datos previos no cambien. Mantener los
logs de seguridad del proveedor.

## Reanudación exacta

1. Después de renovarse la cuota, repetir DryRun y pedir una derivación limpia
   sobre el mismo alcance autorizado, incluyendo los hechos del catálogo.
   No recuperar la salida parcial como si fuera aprobación.
2. Comparar ambas derivaciones en sesión neutral. Resolver con sondas seguras
   cualquier discrepancia empírica antes de crear fixtures.
3. Implementar el runner y su limpieza con un único escritor; probar primero
   sus guardas sin escritura remota y obtener revisión independiente.
4. Revalidar destino, estado de Preview, baseline y ausencia de colisiones de
   identidades antes de provisionar. Ejecutar primero alta/cambio temporal;
   extender al resto solo si pasa. Limpiar también ante fallo.
5. Registrar resultados reales, limpieza exacta y Go/No-Go. La autorización no
   permite marcar pruebas como aprobadas antes de ejecutarlas.

Transporte localizado: Vercel CLI `curl` gestiona el bypass. Su opción
`x-vercel-set-bypass-cookie:true` devuelve una cookie mediante redirección,
según la [documentación oficial](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).
Capturar cabeceras solo en memoria y dar la cookie únicamente al origen Preview;
no usar `--debug` ni `--trace`. Aún no se probó ese transporte en navegador.
El cambio Supabase vuelve a `/acceso?clave=actualizada`: probar nuevo login,
no asumir el comportamiento demo.
