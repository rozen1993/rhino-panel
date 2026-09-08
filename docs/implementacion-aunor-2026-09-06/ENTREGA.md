# Espacio Aunor — entrega local

Estado: implementación, pruebas locales y revisión cruzada de Claude completadas. Preview local listo para revisión de Marco; no publicado ni validado todavía con Auth remoto. Rama equipo, respaldo aec14fe; cambios sin commit.

## Preview

- http://127.0.0.1:3108/acceso
- Aunor: usuario `aunor`, clave ficticia `aunor2026`.
- Admin: usuario `admin`, clave ficticia `admin2026`.
- Estas claves existen solo en la demostración local; no son credenciales de Supabase ni de producción.
- Servidor nuevo aislado, PID 7244 al iniciarlo con el build final; limitado a 127.0.0.1. No se detuvo ni modificó el servidor del usuario en localhost:3000. Use 127.0.0.1 (no localhost) y preferiblemente una ventana privada para no compartir storage con sus pruebas.
- Para reiniciarlo tras cerrar: desde frontend, establecer `SISTEMA_R_DATA_SOURCE=demo` y `SISTEMA_R_ISOLATED_TEST=aunor`; ejecutar `npm.cmd run build` y después `npm.cmd run start -- -H 127.0.0.1 -p 3108`. Primero comprobar que el puerto está libre. El estado Aunor demo desaparece al detener el proceso.

## Disponible

Cuarto rol Aunor con navegación propia. Actividades publicadas, jornadas y lugares; calendario anual y coincidencias; material publicado y confirmación explícita por objeto; conversación externa Admin–Aunor con correcciones conservadas y avisos de lectura; «Lo acordado», servicios abreviados y trabajos Por relacionar; original, sustituto, motivo y evidencia; confirmación de reemplazo independiente de entrega y de pagos.

Admin administra todo dentro de la ficha existente: publicación/resumen/referencia, motivo de no realización, entrega, llamada/acuerdo, reemplazo, correcciones y conversación externa separada de la interna. No cambia el bloqueo de entrega ni las funciones del Operario.

Las jornadas/estado se leen vivos en Supabase. En la demo interna previa están en localStorage; al publicar/actualizar la proyección Admin se sincronizan al nuevo canal externo en memoria. Esta demo no sustituye pruebas de autenticación real y nunca se permite en Vercel.

## Verificado

- Compilación Next, TypeScript y lint.
- 218 pruebas unitarias en 24 archivos.
- 22 pruebas Edge Functions: administración, compensación Auth y cambio de clave temporal; incluye rechazo de Aunor duplicado.
- 20 pruebas Playwright: Aunor, Admin, Operario, Burson; acceso directo, chat/confirmaciones, papelera, claves temporales y Histórico aprobado, escritorio/móvil. Último resultado: `.verificacion/aunor-2026-09-07T04-12-57-396Z`.
- 21 capturas finales en `capturas-02`: 16 pantallas/estados y 5 capturas nativas de formularios móviles para leer el texto sin reducción. `capturas-01` se conserva. Galería HTML al lado.
- Recorrido adicional de formularios en proceso demo desechable 3111, superado en escritorio y móvil de 390 px: Admin publica resumen, registra llamada, relaciona original/sustituto; Aunor ve y confirma el reemplazo. Comprueba que un enlace de evidencia de la llamada no se herede por accidente. Los botones se accionaron mediante clics normales de Playwright, sin forzar interacción; la barra inferior no impidió completar el recorrido móvil. Se cerró solo ese proceso; preview 3108 intacto.
- Cadena SQL completa aplicada exclusivamente a bases UUID nuevas desechables. Se verificaron RLS, todas las vistas, anon, roles, conversaciones internas con datos existentes, unicidad Aunor mediante RPC, dos conexiones concurrentes al confirmar, reintentos, objetos antiguos, A→B→A del material, correcciones de acuerdo/reemplazo, sesión revocada y baja interna. Se eliminaron únicamente esas bases de prueba.
- Smoke del preview final: acceso Aunor/Admin y rutas cliente sin errores JavaScript, navegadores efímeros sin perfiles/cookies del usuario.
- Claudex: derivaciones independientes y comparación limpia conservadas; revisión de código y de imágenes reales completada mediante el lanzador. `REVISION-FINAL-CLAUDE-01.json` y `REVISION-FINAL-CLAUDE-02.json` documentan hallazgos, correcciones y cierre de la legibilidad de los cinco formularios móviles. Claude no ejecutó las suites: fueron ejecutadas por Codex. Sin bloqueantes nuevos identificados para la revisión local; se mantienen los límites y pendientes descritos abajo.

## Antes de publicar (no autorizados aquí)

1. Autorizar/aplicar migraciones pendientes sobre el entorno elegido: jornadas/lugares 202609050001 y Aunor 202609060001/2. Cada archivo en su transacción; confirmar el enum antes de usarlo. No provisionar el rol hasta terminar la cadena.
2. Actualizar la Edge Function admin-accounts en ese entorno y provisionar por Admin la cuenta Aunor con clave temporal. No se creó ninguna cuenta real.
3. Smoke integrado con Auth real y Data API/RPC autenticados sobre ese entorno, no confundirlo con SQL aislado ni mocks de servidor. Verificar aislamiento de datos reales, refresh/revocación, errores y todas las rutas.
4. Conservar cierre de bootstrap/credenciales del preview anterior y aceptación del equipo en sus dispositivos. Aprobación explícita para publicar.

No se modificaron goal, protocolo Claudex, datos existentes ni cookies del usuario. No push ni despliegue. Retención de idempotencia y escalado del cerrojo quedan documentados, sin purgas automáticas nuevas. Véanse ALCANCE.md y RESOLUCION-REVISIONES.md.

## Dos detalles visuales para revisar con Marco

- Admin: las conversaciones externa e interna están separadas y apiladas, en vez del conmutador de la maqueta. Hay cuatro pasos de gestión para distinguir publicación de actividad, entrega, acuerdo y reemplazo. No se declara paridad visual exacta de ese detalle.
- Calendario móvil: se conserva el diálogo del Histórico vigente con foco y cierre accesibles. La maqueta estática de Aunor lo representaba en línea. No se cambia el patrón aprobado del Histórico durante esta ampliación.

La revisión visual detectó además códigos inconsistentes en reemplazos, dos CTA sin verde y un filtro ausente en el calendario. Esos tres puntos se corrigieron y las capturas finales ya reflejan los cambios.
