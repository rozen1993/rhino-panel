# Estado

**Actualizado:** 2026-09-04

**Estado vigente:** el cierre está publicado en `equipo` como `c328b7d`; el
Preview privado está `Ready` sobre staging con siete migraciones y ambas Edge
Functions v2. Es un candidato técnico a RC1, pendiente del smoke autenticado.
La evidencia operacional actual es
[`evidencia-preview-rc1-2026-09-04.md`](evidencia-preview-rc1-2026-09-04.md);
[`evidencia-cierre-local-2026-09-04.md`](evidencia-cierre-local-2026-09-04.md) y
[`evidencia-staging-2026-09-02.md`](evidencia-staging-2026-09-02.md) conservan
los snapshots anteriores y la
[`auditoria-final-cortes-0-a-7.md`](auditoria-final-cortes-0-a-7.md) conserva el
cierre histórico previo al despliegue. Producción permanece en **No-Go** hasta
completar los gates pendientes y contar con autorización separada.

## Fase activa

Sistema R está en ejecución por cortes sobre el checkpoint Git `0be6965`. El
Corte 0 consolidó el contrato objetivo. Los Cortes 1 y 2 de autoridad y cuentas
quedaron cerrados en código tras dos rondas de revisión cruzada Claudex. El
Corte 3 dejó implementado y revisado el flujo Burson real. El Corte 4 dejó
implementada y revisada la conversación privada Admin–Operario; su revisión
Claudex no encontró defectos críticos ni altos. El Corte 5 dejó implementada,
corregida y revisada la baja reversible con Papelera Admin. El Corte 6 dejó
implementado, corregido y verificado localmente el Histórico Supabase desde
2026. El Corte 7 tiene preflight fail-closed, cabeceras, bloqueo de indexación y
runbook. Las siete migraciones compilaron desde cero en Supabase local y están
aplicadas en staging, incluida la optimización RLS del Histórico. Ambas Edge
Functions se publicaron como versión 2, `ACTIVE` y con `verify_jwt=true`; sus
rutas rechazan peticiones sin token con `401`. El nuevo Preview privado está
`Ready` y aprobó preflight y sondas HTTP. El smoke
local real aprobó 51 controles de Auth/RLS/RPC y completó el gate objetivo de
31 puntos en una base desechable. La aceptación autenticada del Preview y las
pruebas en dispositivos reales continúan pendientes. No se dispone de una
sesión Admin autorizada para ejecutar ese recorrido desde el agente; no se
extraerán credenciales ni se resetearán cuentas existentes para obtenerla.

## Decisiones ya consolidadas

- Admin conserva planificación, asignación, baja y restauración.
- El Operario responsable conserva únicamente la ejecución.
- `can_create_own_activities` es individual, revocable y `false` por defecto.
- Burson crea y consulta encargos propios sin acceso interno.
- La clave inicial es temporal y bloquea el negocio hasta que se cambie.
- El Histórico comienza en 2026 y continúa por año.
- El chat IA no se implementa; solo existe su PDF de planificación separado.

La fuente completa es `contrato-producto-vigente-2026-08-28.md`.

## Estado técnico observado

- Las siete migraciones, desde `202608220001_backend_foundation.sql` hasta
  `202609030001_rls_visibility_performance.sql`, compilan desde una base local
  vacía y coinciden con las siete versiones remotas de staging. El dry-run
  posterior no encuentra migraciones, seeds ni roles pendientes. La migración
  `202608280001_activity_authority.sql` agrega el permiso individual y separa
  planificación, creación propia, ejecución y avance de estado.
- La migración `202608290001_account_administration.sql` añade las
  invariantes de cuentas, auditoría, revocación de sesiones y puerta de clave
  temporal. Las Edge Functions mantienen la clave de servicio fuera del
  frontend y completan las operaciones de Auth.
- La planificación toma bloqueos compartidos sobre el Admin y el Operario
  asignado. Una desactivación, cambio de rol o revocación concurrente debe
  esperar y revalidar, por lo que no puede quedar una actividad abierta con un
  responsable inactivo. La carrera forma el punto 30 del gate PostgreSQL.
- La clave temporal se compara mediante una huella PBKDF2-SHA256 con sal
  aleatoria y se elimina al completar el cambio; nunca se persiste en claro.
- La migración `202608300001_burson_channel.sql` añade la única RPC de
  creación Burson. Su idempotencia excluye al responsable derivado y comparte
  el lock de administración de cuentas, por lo que un replay sigue siendo
  válido después de transferir el vínculo especial.
- Burson ya usa datos Supabase con una proyección propia, ruta de detalle
  externa y fronteras directas que impiden abrir la ficha operativa.
- La migración `202608300002_private_conversations.sql` añade mensajes
  internos, apertura exclusiva de Admin, control optimista, autoría por mensaje,
  baja lógica y acceso RLS limitado a Admin y al responsable vigente. El
  frontend real hidrata el hilo solo en el detalle interno y nunca envía al
  cliente mensajes dados de baja.
- La migración `202608310001_activity_trash.sql` añade baja y restauración
  versionadas, motivo obligatorio, auditoría inmutable y un índice parcial de
  Papelera. Admin dispone de la ruta real `/papelera`; una actividad dada de
  baja queda fuera de Actividades, Histórico, Burson y de las consultas de los
  demás roles. Restaurar trabajo abierto exige reemplazar a un responsable
  inactivo; el trabajo entregado conserva su responsable histórico.
- La migración aplicada `202609030001_rls_visibility_performance.sql` conserva la
  matriz de acceso y reemplaza las policies de lectura de actividades y
  jornadas: resuelve sesión, rol e identidad una vez por sentencia, mantiene el
  fast-path Admin y reutiliza el conjunto visible de `activities` bajo la RLS
  real del actor. No crea helpers `SECURITY DEFINER` ni acepta contexto
  suministrado por el llamante. En la carga real de 11 055 jornadas, el
  `EXPLAIN` local Admin bajó desde una línea base de 6 897,950 ms a 3,561 ms en
  la serie B registrada en `validacion-frontend.md`; el Operario recorrió una
  página visible completa en 6,103 ms y una selección de veinte actividades en
  3,170 ms. El owner sin RLS midió 2,047 ms. Los snapshots conservan la serie A
  de otra corrida; no se presupone un orden temporal entre ambas. El conjunto
  masivo se contrastó sin `LIMIT` contra otro Operario, Burson y Admin. No se
  cambiaron timeout, índices ni grants de tabla.
- El Histórico autentica primero a Admin y lee Supabase mediante RLS de sesión,
  sin `service_role` ni fixtures de respaldo. Acota candidatos al año solicitado,
  excluye Papelera, pagina por keyset, conserva todas las jornadas discontinuas,
  revalida el solapamiento final y comparte un único calendario anual con demo.
- Vercel ejecuta un preflight anterior al build que solo lee `process.env`,
  exige Preview→staging o Production→production, bloquea `demo`, coteja el ref
  esperado y rechaza claves legacy/privilegiadas sin imprimir valores. El build
  añade cabeceras defensivas, elimina `X-Powered-By` y mantiene la plataforma
  privada fuera de indexación mediante metadata, encabezado y `robots.txt`.
- El Preview estable de la rama `equipo` usa únicamente las variables de
  Preview, apunta a staging y está protegido por Vercel. Supabase Auth permite
  exactamente ese origen, con signup público y acceso anónimo desactivados.
- `runbook-preview-produccion.md` separa preparación local, autorización,
  staging, Preview, matriz smoke, evidencia, Go/No-Go, producción aislada,
  observabilidad nativa y rollback forward-only.
- El árbol partió desde el punto de restauración `0be6965`. Las operaciones
  remotas posteriores se ejecutaron únicamente tras las autorizaciones de
  Marco; Producción no fue modificada.

## Verificación local vigente

- TypeScript, ESLint, 198 pruebas Vitest en 22 archivos y build de producción,
  aprobados sobre la implementación local del Corte 7.
- `build:vercel` aprobó un ambiente Preview sintético aislado y el preflight sin
  variables de despliegue falló cerrado con 11 diagnósticos genéricos, sin
  cargar `.env.local` ni revelar valores.
- La revisión limpia Claudex del Corte 7 no encontró hallazgos críticos, altos
  ni medios. Sus observaciones bajas válidas también quedaron cerradas: paridad
  de la política `sb_publishable_`, detección de claves legacy/secretas incluso
  embebidas, mensaje de data source sin eco y cabeceras comprobadas sobre una
  redirección privada. Después se repitieron todos los gates locales.
- La revisión prepublicación Claudex inspeccionó la optimización RLS, el arnés
  PostgreSQL, el Histórico y las Edge Functions. Confirmó la equivalencia de la
  migración 7 y pidió cerrar el fallback silencioso del dominio, el smoke del
  runtime real y las sondas remotas. El código ahora falla cerrado sin dominio,
  repara el username desde el perfil canónico, fija `@supabase/server@1.4.1` y el
  runbook contiene los gates exactos. La pasada final terminó `APPROVED` para
  commit, push y publicación controlada; sus dos condiciones exclusivamente
  documentales quedaron corregidas antes del commit.
- Deno 2.9.6: formato y `deno check` de las dos Edge Functions, aprobados. Las
  20 pruebas con fallos inyectados confirman la configuración obligatoria, la
  compensación del alta, la recuperación paginada de usuarios Auth huérfanos,
  la reparación del username canónico y los estados recuperables fail-closed
  del reset, cambio obligatorio y limpieza de huella.
  La derivación PBKDF2 también fue ejecutada con igualdad y diferencia correctas.
- Las revisiones Claudex de solo lectura corrigieron y después cerraron los
  hallazgos de vínculo Burson inactivo, permiso alternativo, errores de Edge,
  fecha mínima, huella temporal, auditoría y canal Burson. La revisión del
  Corte 3 confirmó la RPC, el lock compartido, el replay tras transferencia y
  el DTO externo; sus hallazgos locales fueron corregidos.
- La revisión Claudex del Corte 4 verificó estáticamente sus once cláusulas sin
  hallazgos críticos ni altos. Señaló como gate externo pendiente la ejecución
  real de SQL, RLS, grants, códigos PostgREST y carreras, y como corrección local
  el registro completo de `202608300002` en este procedimiento.
- La revisión cruzada Claudex del Corte 5 no encontró defectos críticos ni
  altos. Sus hallazgos válidos quedaron corregidos: evidencia documental,
  orden único del lock de cuentas, detalle de reasignación en auditoría,
  traducción de `40P01`, eliminación de un lector sin consumidores y espera
  independiente por tarjeta. La ejecución real de `202608310001` forma parte
  del gate externo acumulado.
- Playwright demo: 10 recorridos actuales aprobados. Cubren fronteras de rol y
  acceso directo, concesión/revocación del permiso individual, creación propia
  forzada al Operario autorizado, planificación Admin con ejecución exclusiva
  del responsable, creación y consulta Burson sin superficies internas, cambio
  obligatorio de clave temporal, Papelera con baja/restauración, el Histórico
  en cuatro viewports, navegación anual con piso 2026 y retorno de foco desde el
  detalle móvil. El décimo recorrido comprueba sobre el build real las cabeceras
  de seguridad, la ausencia de `X-Powered-By`, metadata `noindex`, `robots.txt`
  y una redirección privada sin sesión.
- Las pruebas Vitest ejecutan además los Server Actions que llaman las RPC de
  planificación, creación propia, permiso individual y administración. También
  simulan un `max_rows` menor que la página solicitada y verifican keyset para
  actividades, jornadas, auditorías, conversaciones, encargos Burson, perfiles,
  cuentas y el Histórico. El loteo de más de cien UUID se prueba tanto a través
  del lector de actividades como en el Histórico; ninguna lectura conserva
  offset.
- El arnés E2E fija `SISTEMA_R_DATA_SOURCE=demo`, levanta el build de producción
  y nunca reutiliza otro servidor.
- Estas pruebas demo validan el contrato de interfaz, pero no demuestran por sí
  solas los permisos RLS ni las RPC contra una instancia PostgreSQL real.
- `supabase db reset --local --no-seed` recreó PostgreSQL 17 desde cero y
  `npm run verify:supabase:local` aprobó 51 controles reales con identidades
  efímeras de Admin, Operarios y Burson. El gate de 31 puntos cubre claves
  temporales, invariantes del roster, transferencia Burson, Papelera completa,
  carreras de conversación/restauración/cuentas/actividades y los siete
  recursos por encima de `api.max_rows`, además de demostrar que no existe el
  lookup falsificable descartado. La base queda limpia al final.
- El candidato Vercel Preview publicado compiló el commit `c328b7d` de la rama
  `equipo`, registró `preview → staging`, quedó `Ready` y aprobó el smoke HTTP
  de rutas públicas, redirección privada, cabeceras y `robots.txt`. Contiene el
  cierre de producto y apunta a staging con la séptima migración. El catálogo
  remoto confirma las dos policies de lectura esperadas; esto no sustituye el
  smoke por roles ni un `EXPLAIN` remoto autenticado.
- `docs/plan-chat-ia-reutilizable.pdf`: PDF 1.4 válido, tres páginas, 58 620
  bytes al generarse.
- Los mismos gates se repetirán después de cada corte de código.

## Próximos gates

1. Obtener un medio de prueba Admin autorizado o la ejecución del recorrido por
   su titular. Probar alta temporal, login por username, cambio obligatorio y
   acceso sin compartir contraseñas ni cookies.
2. Preparar con autorización las identidades temporales restantes, incluida una
   cuenta Burson, y su limpieza exacta de Auth/perfil para devolver staging a su
   baseline de seis perfiles.
3. Completar el smoke autenticado no destructivo en el candidato publicado y
   registrar el Go de `RC1` solo si aprueba la matriz del runbook.
4. Probar escritorio, móvil real y Safari/iOS, consolidar el feedback del equipo
   y repetir `RC2…RCn` con todos los gates hasta la aceptación.
5. Con autorización separada, crear Producción con proyecto Supabase distinto,
   backup/restauración ensayados, dominio, variables y nuevo Go/No-Go.
