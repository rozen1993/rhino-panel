# Auditoría integral de Sistema R

Fecha de cierre: 10 de septiembre de 2026. Comprobaciones iniciadas el 9 de septiembre. Alcance: árbol local actual, requisitos y decisiones posteriores, frontend, Supabase, autenticación, calidad, despliegue y preparación operativa.

## Dictamen

**El sistema tiene una base funcional amplia, pero no está terminado ni listo para ser el único registro de trabajo real.** El piloto permite recoger comentarios del equipo; no reemplaza las correcciones técnicas y las pruebas integradas que nos corresponden.

Los frentes prioritarios son las dependencias con avisos de seguridad, la recuperación de cuentas, el cierre correcto de sesiones y claves, y una verificación reproducible de la versión realmente publicada. No asigno un porcentaje de avance: no existe todavía una matriz de aceptación vigente y consolidada que lo sustente.

No se corrigió código, no se cambiaron contraseñas, no se crearon datos de prueba ni se publicó otro despliegue durante esta auditoría. Este informe es el único archivo añadido por la auditoría. Se preservaron los cambios que ya estaban en el árbol.

## Evidencia y límites

| Comprobación | Resultado |
|---|---|
| `npm.cmd run test` | 225 pruebas aprobadas en 26 archivos |
| `npm.cmd run test:functions` | 24 pruebas aprobadas; usan dobles de prueba, no integran Auth remoto con SQL |
| `npm.cmd run typecheck` | Aprobado |
| `npm.cmd run lint` | **Falla** por `require()` en `frontend/scripts/check-public-access.cjs:1` |
| `npm.cmd audit --omit=dev --json` | Dos paquetes afectados: Next con severidad crítica y sharp con severidad alta |
| Consulta SQL remota de privilegios | `service_role` no puede seleccionar `profiles`, tampoco sus columnas `id` y `username` |
| Migraciones remotas | 12 versiones, incluida `202609090001` |
| Preparación Aunor, consulta agregada | 12 servicios y **0 publicaciones**; una cuenta Admin activa |
| Claves temporales, consulta agregada | Seis cuentas activas pendientes de cambio en la comprobación |
| HTTP remoto `/acceso` | 200, sin caché compartida y con cabeceras defensivas |
| HTTP remoto `/cuentas`, sin sesión | 307 hacia `/acceso` |
| Navegador, evidencia del cambio inmediatamente anterior | Siete tarjetas; 1440 y 390 px; sin desbordamiento ni errores JS; usuario Aunor precargado y cierre con Escape |
| Build remoto, evidencia anterior | Deployment `dpl_3Z7qX5hF97DhTCXEU6fvxZLa3BuG`, READY; preflight y compilación aprobados |

No se volvió a ejecutar el conjunto E2E ni una reconstrucción de base. El script general de Supabase hace reset de la base local y además conserva el modelo Burson retirado. El E2E predeterminado usa `.next`, compartido con el desarrollo local; había un servidor del usuario en el puerto 3000. No se alteraron esos recursos para auditar.

Las comprobaciones remotas fueron lecturas, sin extraer claves ni contenidos de actividades. Las carreras de autenticación descritas abajo son riesgos fundamentados en código, **no exploits reproducidos**. No se realizó pentest, prueba de carga masiva, restauración de backup ni recorrido autenticado con las cuentas del equipo. La configuración real de alertas, retención y protección de ramas no se inspeccionó en sus paneles; la ausencia de evidencia no demuestra que no existan.

Una revisión auxiliar del backend terminó; otras dos se interrumpieron por cuota y no se contabilizan como revisiones completas. La revisión principal cubrió directamente esos frentes.

## Correcciones prioritarias

### A01 — P1: dependencias con avisos de seguridad

**Confirmado por auditoría de dependencias.** `frontend/package.json` fija Next `16.3.1`; el lock instala sharp `0.35.3`. El registro informa Next afectado por dos avisos y sharp por uno. Next `16.3.3` contiene las correcciones indicadas por los avisos; npm propone `16.3.4`. sharp requiere una versión corregida, como mínimo `0.35.4` para el aviso consultado.

Hay que distinguir exposición de instalación: el aviso de Windows corresponde al servidor alojado sobre ese sistema de archivos, no demuestra vulnerabilidad equivalente en Vercel. La estación local sí usa Windows y el puerto 3000 estaba escuchando en `::`; falta comprobar exposición efectiva mediante firewall. El segundo aviso depende del procesamiento de AVIF. No encontré archivos AVIF en `frontend/public` ni configuración de imágenes remotas, por lo que no afirmo que exista una vía explotable desde las pantallas actuales.

Fuentes oficiales: [Next en Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), [Next y AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4), [sharp/libheif](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c).

**Cierre:** actualizar paquetes y lock de forma controlada, repetir auditoría, build y recorridos; verificar que Vercel use las versiones corregidas. No ejecutar un `audit fix --force` indiscriminado.

### A02 — P1: el reset de claves desde la aplicación falla por permisos

**Confirmado por código y privilegios remotos.** `supabase/functions/admin-accounts/index.ts:245` lee `profiles.username` mediante `supabaseAdmin`; ese rol no tiene SELECT ni permiso de columna. El handler devuelve `profile_username_unavailable` antes de preparar la rotación. La recuperación de un usuario Auth sin perfil también depende de leer `profiles.id` en la línea 172 y puede fallar.

El alta nueva normal sigue otra ruta y no debe confundirse con ese fallo. Las claves entregadas al equipo se generaron por una vía administrativa distinta; su login validado no acredita que funcione el botón de restablecimiento de la aplicación.

**Cierre:** ajustar el acceso mínimo necesario o encapsular esa lectura en una RPC administrativa. Probar el flujo real de Edge Function + Auth + SQL, incluyendo usuario huérfano y fallo intermedio. No otorgar acceso general a todas las tablas para resolver una lectura concreta.

### A03 — P1: una emisión nueva de clave puede ser finalizada por una petición anterior

**Riesgo de concurrencia, no reproducido.** `change-temporary-password/index.ts:107` actualiza Auth y después llama a `complete_temporary_password_change_v1`. La RPC de `202608290001_account_administration.sql:533` solo recibe el perfil; no recibe una versión de la emisión temporal.

Secuencia posible: el usuario actualiza su clave; entre esa escritura y la finalización, Admin emite otra temporal; la primera petición limpia el flag de la emisión nueva. La limpieza de metadatos posterior también puede retirar una huella recién emitida. Actualmente A02 limita el reset por la ruta habitual, pero corregirlo no resuelve esta carrera.

**Cierre:** identificar cada emisión, validar esa identidad al finalizar y al limpiar metadatos, y diseñar recuperación ante escrituras parciales entre Auth y PostgreSQL. Probar dos conexiones/peticiones concurrentes y conservar el bloqueo de la emisión más reciente.

### A04 — P1: la revocación no cubre una sesión anterior aún no registrada

**Riesgo sustentado en código, pendiente de prueba integrada.** `202608220001_backend_foundation.sql:331` registra el `session_id` del JWT si el perfil está activo. El reset y el cambio obligatorio revocan filas existentes en `app_sessions`, pero no hay una marca temporal o versión de credenciales contra la que contrastar sesiones nuevas.

Un JWT anterior que siga válido y nunca haya sido registrado podría registrar su sesión después del cambio. El impacto depende de que Auth siga aceptando ese token. No se ha probado remotamente y no equivale a afirmar que cualquier sesión revocada pueda reactivarse: el conflicto de una fila ya existente conserva su revocación.

**Cierre:** definir una frontera de revocación por usuario y contrastarla con la autenticación de la sesión; verificar también cierre de sesiones Auth cuando corresponda. Probar tokens anteriores registrados y no registrados, refresh y reactivación de cuenta.

### A05 — P2: restablecer la clave del propio Admin rompe la confirmación

**Defecto lógico, actualmente oculto por A02.** La preparación en `202608290001_account_administration.sql:466` marca `must_change_password=true`. La confirmación, línea 505, llama a `private.require_service_admin`, que exige el mismo flag en false, línea 30. Si actor y destinatario son iguales, la confirmación falla tras el cambio de Auth.

Existe un solo Admin activo en el piloto. No debe resolverse con la instrucción genérica de «genera otra clave» desde una sesión que acabamos de revocar. Tampoco significa necesariamente bloqueo irreversible: si Auth aceptó la temporal, el cambio obligatorio puede permitir la recuperación.

**Cierre:** tratar expresamente el cambio propio o impedir el auto-reset administrativo, y disponer de un procedimiento de recuperación probado para el último Admin. No crear un segundo administrador sin definir su responsable.

### A06 — P2: la verificación completa no está verde

**Reproducido.** `frontend/scripts/check-public-access.cjs:1` incumple `@typescript-eslint/no-require-imports`. `npm run verify` incluye lint, por tanto no puede aprobar actualmente. Existe además `check-public-access.mjs`: conviene consolidar ambos scripts.

Este defecto se introdujo en la verificación añadida en el cambio anterior. La comprobación limitada de lint de aquel turno no incluyó ese script; por eso afirmar que todo lint estaba aprobado fue demasiado amplio.

**Cierre:** unificar el script en el formato del proyecto y ejecutar lint completo y `verify` sobre el mismo árbol que se publique.

### A07 — P2: los verificadores SQL no acompañan al esquema actual

**Confirmado estáticamente.** `frontend/scripts/verify-local-supabase.mjs:695–747` crea una cuenta Burson activa y un operario vinculado. La migración `202609080001_retire_burson_external_chat.sql:12–29` lo prohíbe. Además el script conserva llamadas a RPC Burson retiradas y hace reset de la base local al principio y al final, líneas 4494 y 4508.

El verificador más reciente `frontend/scripts/verify-aunor.mjs` usa una base UUID desechable, pero exige que el último archivo sea `202609080001_retire_burson_external_chat.sql`; con la migración de acceso del 9 de septiembre se detiene por diseño. No hay que eliminar esa guardia sin ampliar las comprobaciones.

**Cierre:** mantener casos históricos de migración separados del contrato actual, actualizar el límite del esquema y probar la RPC pública nueva. Unificar un comando que ejecute la cadena vigente en una base desechable, incluyendo Auth real donde sea necesario.

### A08 — P2: Aunor puede perder filas durante la paginación

**Defecto condicional confirmado por algoritmo.** `frontend/lib/supabase/aunor.ts:8–24` utiliza offset y considera final una página de menos de 200 filas. Si PostgREST aplica un máximo menor, termina antes de leer el resto. Con inserciones o retiradas concurrentes, los offsets pueden desplazar filas entre páginas.

La configuración local actual permite más de 200 filas; no se observó truncamiento en el piloto vacío. Aun así, este lector no conserva la robustez que ya tienen los lectores internos con cursores.

**Cierre:** cursor estable por recurso, incluyendo desempate donde corresponda; pruebas con un límite inferior a 200 y cambios entre páginas, sin duplicados ni omisiones.

### A09 — P2: reemplazos sustentados en acuerdos corregidos

**Confirmado por lectura; requiere precisar la regla de producto.** `202609080001_retire_burson_external_chat.sql:448` acepta el acuerdo asociado sin verificar si tiene una corrección posterior. La confirmación del reemplazo, línea 530, tampoco comprueba esa vigencia. `frontend/components/aunor-space.tsx:87` presenta el cuerpo del acuerdo anterior sin advertir que fue corregido.

Conservar la evidencia histórica es correcto; presentarla como base de una confirmación actual sin advertencia es lo que debe resolverse.

**Cierre:** acordar si corresponde bloquear, exigir nueva relación o advertir expresamente la corrección; mostrar el vínculo al acuerdo vigente y probar una corrección posterior a la publicación del reemplazo.

### A10 — P2: conflictos de edición Aunor sin recuperación clara

**Confirmado en el estado del componente.** `frontend/components/admin-aunor-panel.tsx` inicializa `publicationVersion` y campos desde la primera carga. El polling actualiza `w`, pero no esa versión. Cuando otro Admin publica, guardar puede devolver conflicto; el botón de recarga de datos tampoco sincroniza automáticamente la base de edición. Una recarga completa permite recuperarse, pero no hay reconciliación explícita en el formulario.

**Cierre:** mostrar que existe una versión nueva y ofrecer recargar/comparar sin sobrescribir silenciosamente el borrador; actualizar la versión esperada tras aceptar los nuevos datos.

## Trabajo que todavía falta para terminar

| Frente | Qué falta | Criterio de cierre |
|---|---|---|
| Prueba integrada de cuentas | Login, cambio obligatorio, reset desde Admin, baja/reactivación, último Admin y expiración | Matriz con Auth + Edge + RPC reales, incluyendo fallos y concurrencia |
| Actividades | Validar en el entorno real planificación, creación autorizada, jornadas discontinuas, ejecución, entrega y reasignación | Admin y dos operarios; datos ajenos inaccesibles por UI y llamadas directas |
| Chat interno | Validar apertura tras entrega, bloqueo de enlace/opinión, edición/baja propia y reasignación | Aislamiento entre responsables y auditoría sin cuerpos eliminados |
| Papelera e Histórico | Prueba integrada de baja/restauración y exclusión de registros, años y jornadas | No resurrección de mensajes borrados; restauración correcta con responsable inactivo |
| Preparación Aunor | Publicar actividades de prueba desde Admin; hoy hay cero | Casos programado, entregado, por relacionar, acuerdo, reemplazo y confirmaciones separadas |
| Paridad visual | Las tarjetas públicas conservan guiones y «Disponible al ingresar», no métricas reales | Aceptar esa variante o definir una proyección pública de datos aprobada; no afirmar paridad total |
| Rendimiento | Aunor lee seis colecciones completas y repite la carga cada 30 s en pestañas visibles | Medir con volumen representativo; acotar por pantalla/año/actividad y definir objetivos de latencia |
| Producción definitiva | Piloto y staging comparten Supabase, decisión autorizada para pruebas | Entorno aislado para operación final, variables y plan de promoción/reversión comprobados |
| Recuperación | Hay evidencia de dump, no de restauración completa ensayada | Restaurar en destino desechable, verificar datos y Auth, tiempos objetivo y responsable |
| Entrega reproducible | El último cambio de tarjetas/migración/script permanece con modificaciones sin consolidar en Git | Commit revisado, respaldo remoto y correspondencia exacta Git–migración–deployment |
| Automatización | No hay `.github/workflows` en el repositorio inspeccionado | Pipeline acordado con lint, tipos, tests, build y dependencias; comprobar protección de rama |
| Operación | Alertas, revisión de logs, retención y limpieza de sesiones/idempotencia no acreditadas como implantadas | Responsables, señales de fallo, procedimiento de atención y política que no borre evidencia |
| Accesibilidad/dispositivos | No se acredita cobertura completa de Safari/iOS, lector de pantalla y todas las fichas autenticadas | Teclado/foco/errores/zoom y recorridos reales en dispositivos del equipo |
| Documentación | `docs/estado.md` y el «contrato vigente» de agosto describen Burson y pendientes ya resueltos | Una fuente actual con Admin–Operario–Aunor, decisiones del piloto y matriz de aceptación |

El equipo puede aportar problemas de uso, claridad, tiempos y compatibilidad. **Las comprobaciones de permisos directos, carreras, recuperación y despliegue son responsabilidad técnica nuestra**, no tareas que debamos delegarles como sustituto de validación.

## Observaciones de seguridad y alcance

- El directorio público de cuentas fue solicitado y ya expone nombre, usuario y rol sin login. No se clasifica como fuga accidental ni como bypass de RLS. Debe quedar explícito en el contrato y evaluarse junto con la protección contra intentos de acceso. No se comprobó la política remota de límites/CAPTCHA; el TOML local no demuestra la configuración remota.
- Las cabeceras observadas protegen frente a enmarcado y otros usos, pero la CSP no define `script-src`/`default-src`. Es una mejora de defensa adicional, no evidencia de XSS explotable. Debe probarse antes de endurecerla para no romper Next.
- El Admin recibió una clave por recuperación administrativa y no quedó sujeto al mismo cambio obligatorio que las otras seis cuentas. Falta formalizar un cambio privado y un mecanismo seguro de recuperación propia; este informe no repite credenciales.
- La cuenta compartida Aunor es una decisión aprobada: atribuye acciones a Aunor, no identifica a la persona física. No planteo convertirla en múltiples cuentas como requisito nuevo.
- El código heredado Burson y sus identificadores conservados no son por sí mismos un defecto: su retirada preserva histórico. Sí lo son los scripts y documentos que aún lo tratan como rol activo.

## Lo que ya está implementado y no hay que reconstruir

Hay separación demo/Supabase y prohibición de demo en Vercel; planificación Admin y ejecución del responsable; permisos individuales de creación; claves temporales; auditoría; papelera; histórico anual; publicación y confirmaciones de Aunor; servicios contractuales y reemplazos; chat interno Admin–Operario; retirada del canal Burson y chat externo; cabeceras y preflight de despliegue. Existen pruebas unitarias, pruebas de handlers, evidencia SQL aislada y capturas de navegador.

Esto acredita implementación y pruebas parciales. No acredita automáticamente funcionamiento integrado de todas las rutas en la versión pública.

No son pendientes obligatorios del alcance actual: chat IA dentro del sistema, WhatsApp, notificaciones, sincronización avanzada de OneDrive, carga de archivos, exportaciones no definidas, migración del Excel, cálculo de pagos o porcentajes contractuales. No se deben reintroducir funciones expresamente retiradas.

## Orden de cierre recomendado

1. **Seguridad y cuentas:** A01–A05; añadir pruebas integradas que reproduzcan los fallos antes de corregirlos.
2. **Verificación reproducible:** A06–A07; separar builds/bases de prueba; actualizar CI y consolidar el cambio publicado en Git.
3. **Aunor y recuperación de errores:** A08–A10; preparar publicaciones de prueba y medir carga. Revisar la variante visual pública.
4. **Aceptación funcional:** incorporar resultados del equipo y ejecutar nosotros aislamiento, concurrencia y flujos completos del backend.
5. **Operación definitiva:** separar entornos, ensayar restauración, fijar alertas/responsables y cerrar una matriz de aceptación vigente.

La condición final no es «la página abre» ni «todas las pruebas unitarias pasan»: debe poder demostrarse que el mismo código publicado cumple los recorridos por rol, mantiene la integridad bajo fallos y puede recuperarse.
