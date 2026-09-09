# Contrato y retirada de Burson/chat — entrega local

Implementado solo por Codex por autorización expresa de Marco. Respaldo anterior de1cbe1, rama equipo. No se hizo commit, push, despliegue ni modificación del goal/protocolo.

## Revisar

- Preview comprobado: http://127.0.0.1:3108/acceso (usar ventana privada para separar almacenamiento de sus pruebas).
- Accesos ficticios exclusivos de la demo: Aunor, usuario aunor / clave aunor2026; Admin, usuario admin / clave admin2026.
- Servidor nuevo limitado a 127.0.0.1, PID 27820 al iniciarlo. No se detuvo el servidor existente del puerto 3000.
- Datos Aunor de esta demostración en memoria: desaparecen al detener el proceso. No son registros contractuales reales ni usuarios de Supabase.
- [Galería de capturas reales](GALERIA.html). Se inspeccionaron visualmente Contrato en escritorio y móvil. Las capturas completas móviles muestran la barra fija en el límite del viewport original; no es una barra insertada entre servicios.

## Cambios

1. No hay chat externo por actividad ni avisos de mensajes en Aunor o en su sección Admin. Las acciones antiguas message/read son rechazadas antes del RPC y por la nueva migración, incluso al repetir una solicitud anterior.
2. El chat interno Admin–Operario, el bloqueo de entrega y las confirmaciones explícitas se mantienen.
3. Solo Admin, Operario y Aunor son roles activos seleccionables. Burson no figura en accesos, navegación ni altas; sus rutas ya no muestran contenido. En respuestas transmitidas por streaming, Next puede devolver HTTP 200 junto a la página not-found, sin exponer el canal.
4. Las cuentas/IDs y el origen Burson se conservan como archivo. La migración desactiva el cliente, revoca sesiones y retira el vínculo especial del operario, manteniéndolo activo con sus actividades. Los encargos históricos abiertos admiten responsables normales; las entregas conservan sus bloqueos previos.
5. Contrato reemplaza «Lo acordado». Cada servicio relacionado con un original o sustituto documentado muestra «! Observado: tiene reemplazo», con icono y texto; persiste tras confirmaciones/correcciones. No se atribuye incumplimiento ni aprobación de pagos.
6. Original, sustituto, motivo, evidencia y confirmación siguen separados. Los trabajos Por relacionar continúan visibles. No se inventaron cantidades, vigencia o equivalencias.

Los mensajes externos anteriores no se borran: quedan archivados en privado, sin lectura a través de la aplicación ni del antiguo recurso público. Se conservan tipos/enum e identificadores heredados para no romper los históricos; no son permisos activos.

## Verificación

- TypeScript y ESLint: sin errores.
- 222 pruebas unitarias en 25 archivos: pasan.
- 24 pruebas de Edge Functions: pasan; incluyen rechazo de rol y vínculo Burson antes de crear usuarios Auth.
- Build Next aislado y 15 pruebas Playwright: pasan. Admin, Operario, Aunor, acceso directo, rutas retiradas, Contrato observado antes/después de confirmar, claves temporales, planificación/ejecución, chat interno, papelera y calendario en cuatro tamaños.
- Resultado del navegador: frontend/.verificacion/aunor-2026-09-09T02-56-38-346Z. 22 PNG copiados en capturas/ sin reemplazar propuestas anteriores.
- scripts/verify-aunor.mjs: cadena histórica con datos ficticios y posterior migración 202609080001, exclusivamente en bases nuevas UUID desechables. Pasa conservación de registros, bloqueo de sesiones/roles antiguos, archivo de mensajes, rechazo de replay, reasignación/restauración normal, aislamiento y confirmaciones desde dos conexiones concurrentes.
- La última base temporal fue sr_aunor_test_76e6aed521444b9ab993118005360cf7 y fue eliminada. También se limpiaron las bases temporales de intentos previos. No se modificaron las bases del usuario.
- Smoke del preview final: Aunor/Admin y páginas cliente sin errores JavaScript, mediante contextos efímeros.
- git diff --check: pasa.

## Pendientes antes de uso real — requieren autorización aparte

1. Mantener los pendientes de la entrega Aunor anterior: migraciones 202609050001 y 202609060001/2, bootstrap/credenciales, aceptación del equipo y Auth real. Ver ../implementacion-aunor-2026-09-06/ENTREGA.md; sus funcionalidades Burson/chat quedan sustituidas por esta entrega, no sus controles pendientes.
2. Revisar respaldos de base y aplicar, en el entorno elegido, las migraciones que realmente falten, incluida 202609080001_retire_burson_external_chat.sql. No aplicar contra una base existente sin permiso. La retirada real de cuentas y permisos de base requiere esa migración; el preview no equivale a haberla aplicado.
3. Publicar la actualización de admin-accounts, preparar la cuenta Aunor si falta y comprobar autenticación real, revocación, aislamiento Data API/RPC y rutas. No se crearon ni alteraron cuentas reales.
4. Publicar solo tras aprobación. La verificación SQL con Auth simulado y los mocks no reemplazan el smoke integrado con Auth real.

No se amplían OneDrive, exportaciones, WhatsApp, chat IA ni retención automática de idempotencia. Los pendientes técnicos anteriores se mantienen; esta entrega no declara completo ningún goal.
