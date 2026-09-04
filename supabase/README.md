# Supabase de Sistema R

Este directorio es la fuente versionada del backend. El proyecto remoto
`sistema-r` se trata como **staging**; producción usará otro proyecto.
El orden operativo de Preview y producción está centralizado en
`../docs/runbook-preview-produccion.md`; este archivo conserva el detalle del
backend y su matriz de aceptación.

## Qué está listo

- Configuración local sin signup público, Storage ni Realtime.
- Migración base con tablas, RLS, sesiones y auditoría.
- Migración local de autoridad de actividades con permiso individual
  revocable y RPC separadas para planificación y ejecución.
- Migración local de administración de cuentas con una sola cuenta Burson
  activa, mínimo de un Admin, transferencia atómica del vínculo especial,
  auditoría y revocación de sesiones.
- Migración local del canal Burson con creación idempotente, asignación
  automática serializada con la transferencia del vínculo y lectura externa
  por RLS sin auditoría ni conversación interna.
- Migración local de conversación privada Admin–Operario con apertura exclusiva
  de Admin, versión optimista, autoría por mensaje, baja lógica y lectura RLS
  limitada al responsable vigente.
- Migración local de Papelera con baja reversible, motivo obligatorio,
  restauración versionada, auditoría atómica y reasignación segura cuando el
  responsable de una actividad abierta ya no está activo.
- Migración local de rendimiento RLS para las jornadas del Histórico, sin
  cambiar la matriz de visibilidad, el timeout ni los índices existentes. La
  policy de actividades resuelve el contexto una vez por sentencia y la de
  jornadas reutiliza esa RLS; ninguna confía en argumentos de rol, identidad o
  sesión ni añade un nuevo helper `SECURITY DEFINER`.
- Edge Functions autenticadas para crear usuarios, regenerar claves temporales
  y completar el cambio obligatorio sin exponer una clave de servicio al
  frontend.
- Huella temporal PBKDF2-SHA256 con sal aleatoria, auditoría en dos fases,
  recuperación de usuarios Auth huérfanos y revocación de sesiones.
- Frontend con modo `demo` o `supabase` explícito.
- Lector Admin del Histórico desde 2026 sobre las tablas existentes, con RLS de
  sesión, exclusión de Papelera, paginación keyset y jornadas completas. El
  Corte 6 no requiere una migración nueva.
- Región Vercel `pdx1`, cercana a la base en Oregon.

Aquí, «listo» significa implementado como artefacto local y cubierto por las
verificaciones locales indicadas. No significa aplicado en staging o
producción ni aceptado todavía por personas en dispositivos reales.

No hay claves, contraseñas ni identificadores remotos guardados en Git.

## 1. Validación local posterior

Supabase local necesita Docker Desktop. Cuando esté disponible:

```powershell
npx.cmd supabase start
npx.cmd supabase db reset
npx.cmd supabase status
```

El seed está desactivado: no se fabrican cuentas ni contraseñas. `db reset`
debe recrear el esquema únicamente desde las migraciones.

Las Edge Functions sí son verificables sin Docker:

```powershell
npx.cmd --yes deno fmt --check supabase/functions
npx.cmd --yes deno check supabase/functions/admin-accounts/index.ts supabase/functions/change-temporary-password/index.ts
npm.cmd --prefix frontend run test:functions
```

Los tres gates se aprobaron localmente con Deno 2.9.6. El último ejecuta 17
pruebas de compensación y recuperación con fallos inyectados en Auth, RPC y
limpieza de metadatos, incluida la reparación paginada de un usuario Auth
huérfano.

## 2. Aplicar migraciones y funciones a staging

**Completado en staging el 2026-09-02 para las seis primeras migraciones.** Las
migraciones desde `202608220001` hasta `202608310001` coinciden en staging. La
séptima, `202609030001_rls_visibility_performance.sql`, está validada solo en
Supabase local y no se aplicará remotamente sin autorización. Antes del push,
`supabase db push --dry-run` identificó exactamente las cinco pendientes. Las
funciones `admin-accounts` y `change-temporary-password` están activas en su
versión 1. La compilación desde una base vacía también quedó aprobada mediante
`supabase db reset --local --no-seed` sobre PostgreSQL 17. La evidencia sin
secretos está en `../docs/evidencia-staging-2026-09-02.md`.

Los comandos siguientes se conservan como procedimiento reproducible para un
ambiente nuevo y no se ejecutan sin autorización explícita:

Desde la raíz del repositorio:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref TU_PROJECT_REF
npx.cmd supabase migration list
npx.cmd supabase db push --dry-run
npx.cmd supabase db push
npx.cmd supabase functions deploy admin-accounts
npx.cmd supabase functions deploy change-temporary-password
```

Antes de `db push`, confirmar en el dashboard que el destino es `sistema-r` y no
producción. No usar `db reset --linked`: borra los datos del proyecto remoto.

`config.toml` configura el entorno local y conserva URLs de localhost, por lo
que no debe enviarse íntegro al proyecto hospedado. En staging, el Site URL y el
único redirect permitido apuntan al origen estable del Preview; **Allow new
users to sign up** y el acceso anónimo están desactivados.

## 3. Crear las cuentas mínimas

**Completado para el primer roster de staging.** En
**Authentication → Users → Add user → Create new user** se usaron aliases del
dominio interno que utilizará la aplicación y se marcó **Auto confirm user**. Los
aliases concretos de ambientes activos no se publican en el repositorio.

SQL Editor vinculó los UUID de Auth con `public.profiles`: `admin` tiene rol
Admin; Martin, Cesar, Kiara, Johann y Eduardo tienen rol Operario; únicamente
Eduardo está marcado como Operario especial. La cuenta Burson sigue pendiente.

La contraseña se define en Auth, no en SQL. Una vez desplegado el corte local,
Admin gestiona las cuentas desde `/cuentas`: el alta genera una credencial
temporal de un solo uso visual, y el usuario queda limitado a
`/cambiar-clave` hasta reemplazarla. Los UUID y contraseñas no se documentan. En
un ambiente nuevo deben obtenerse de sus propias cuentas Auth; no se reutilizan
los usuarios de staging.

## 4. Configurar Vercel Preview

La raíz del proyecto Vercel debe ser `frontend/`. Añadir estas variables solo al
ambiente **Preview**:

```text
SISTEMA_R_DATA_SOURCE=supabase
SISTEMA_R_DEPLOYMENT_TARGET=staging
SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF=TU_PROJECT_REF
SISTEMA_R_SITE_URL=https://TU-PREVIEW.vercel.app
SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SISTEMA_R_USERNAME_DOMAIN=auth.sistema-r.invalid
```

La URL y la publishable key están en **Supabase → Connect / API Keys**. No
copiar `sb_secret_...`, `service_role` ni la contraseña de PostgreSQL a variables
de la aplicación. `frontend/vercel.json` ejecuta `npm run build:vercel`; su
preflight rechaza `demo`, un target incorrecto, refs inconsistentes, HTTP y
claves legacy o privilegiadas antes de compilar. También exige las variables de
sistema Vercel y que `SISTEMA_R_SITE_URL` coincida con la URL de rama (o la URL
del despliegue como fallback). Confirmar que el dashboard no reemplace ese Build
Command ni desactive las System Environment Variables. Después, crear un nuevo despliegue Preview
autorizado y registrar su URL estable en **Authentication → URL Configuration**.

La misma variable `SISTEMA_R_USERNAME_DOMAIN` debe configurarse como secreto de
las Edge Functions. `@supabase/server` recibe sus claves del entorno administrado
por Supabase; ninguna clave privilegiada pertenece a Vercel ni al repositorio.

## 5. Gates de aceptación por versión

### Registro histórico del cimiento `202608220001` — no ejecutar

Este recorrido describía el modelo anterior, antes de aplicar los Cortes 1 a 6.
Se conserva únicamente como trazabilidad de la migración inicial: ya no es un
gate ejecutable contra local ni staging y no certifica el contrato vigente. En
ese modelo, Martin creaba una actividad propia, Cesar quedaba aislado, Admin
conservaba la trazabilidad y la desactivación de Martin cerraba sus operaciones.
El gate vigente comienza en la sección siguiente.

### Gate objetivo de los Cortes 1 a 6 (`202608280001` a `202608310001`)

Las siete migraciones ya compilaron localmente; las seis primeras están
aplicadas en staging. El arnés `npm run verify:supabase:local` ejecutó 51
controles reales con GoTrue, PostgREST y JWT independientes en un proyecto
desechable aislado. Junto con 20 pruebas Deno de configuración y compensaciones de Edge
Functions, el recorrido local de 31 puntos quedó aprobado y revalidado el
2026-09-04. Este
resultado no sustituye el smoke autenticado de staging: la séptima migración
todavía no está publicada allí. Los 51 controles son solo la salida del arnés:
su cantidad no equivale a puntos aprobados.
Cada punto se registra solo con evidencia de códigos de error, RLS, carreras y
estado final correspondiente:

1. Iniciar como Admin y planificar para Martin una actividad con dos jornadas
   discontinuas; recargar y confirmar que persiste.
2. Iniciar como Martin: debe verla, añadir un enlace HTTPS, iniciarla y
   entregarla; no debe poder cambiar su planificación.
3. Iniciar como Cesar: no debe aparecer ni abrirse la actividad de Martin.
4. Iniciar como Admin: debe ver la actividad y su trazabilidad.
5. Conceder y luego retirar a Martin el permiso de creación propia. Tras
   retirarlo, la ruta y la RPC deben fallar, pero la ejecución de lo asignado
   debe seguir disponible.
6. Desactivar el perfil de Martin: su siguiente operación debe fallar.
7. Crear una cuenta con clave temporal: no debe acceder al negocio hasta cambiar
   la clave; la clave nunca debe aparecer al volver a cargar `/cuentas`.
8. Regenerar una clave temporal y comprobar que las sesiones anteriores quedan
   revocadas.
9. Intentar desactivar el último Admin o la única cuenta Burson activa: ambas
   operaciones deben fallar sin cambios parciales.
10. Iniciar como Burson, crear un encargo con referencia HTTPS y comprobar que
    queda `Programada`, asignada al único Operario especial y visible solo para
    esa cuenta Burson, Admin y el responsable.
11. Iniciar como el Operario especial, ejecutar y entregar el encargo; Burson
    debe consultar estado y material, pero nunca auditoría, conversación,
    cuentas, papelera ni Histórico.
12. Repetir la misma clave idempotente después de transferir el vínculo
    especial: debe devolver el mismo `activity_id`; el encargo abierto queda en
    el nuevo responsable y uno entregado conserva su responsable histórico.
13. Ejecutar en paralelo creación y transferencia para comprobar que el lock
    `sistema-r-account-administration` evita asignaciones parciales o un
    `SR009` falso.
14. Sobre una actividad ordinaria entregada, iniciar como Admin la conversación
    usando la versión vigente: debe existir un solo mensaje `opens_thread`,
    fijarse `thread_opened_at` e incrementarse una sola vez la versión de la
    actividad.
15. Comprobar que el Operario no puede responder antes de la apertura y que,
    después de abrirse, solo Admin y el responsable vigente pueden listar o
    publicar mensajes; otro Operario y Burson deben fallar cerrados.
16. Editar y dar de baja mensajes como su autor: debe incrementarse únicamente
    la versión del mensaje, conservarse la versión de la actividad y excluirse
    la fila dada de baja de toda respuesta al cliente.
17. Abrir en paralelo el mismo hilo desde dos sesiones Admin con idéntica
    versión esperada: debe quedar un solo mensaje de apertura y un solo
    incremento de `activities.version`.
18. Ejecutar en paralelo una respuesta del Operario y una replanificación o
    reasignación Admin: no debe haber escritura parcial y el acceso debe quedar
    exclusivamente en el nuevo responsable.
19. Provocar `SR001`, `SR002`, `SR003`, `SR007` y `SR008` en las RPC de
    conversación y registrar el `error.code` literal propagado por PostgREST.
20. Ejecutar `supabase db reset` desde una base vacía y confirmar que
    `202608310001_activity_trash.sql` crea el índice parcial y ambas RPC sin
    errores ni amplía los grants directos de tabla.
21. Dar de baja una actividad y ejecutar la matriz RLS sobre `activities`,
    `activity_date_spans`, `audit_events` y `activity_messages`: Admin conserva
    la lectura permitida; el responsable, otro Operario y Burson no reciben la
    actividad ni sus relaciones. Tras restaurarla vuelve la visibilidad
    ordinaria.
22. Provocar y registrar los `error.code` literales `SR001`, `SR002`, `SR003`,
    `SR009` y `SR010` en `soft_delete_activity_v1` y
    `restore_activity_v1`; confirmar que el cliente nunca envía actor ni rol.
23. Lanzar dos bajas Admin con la misma versión esperada: debe existir un solo
    `deleted_at`, un solo incremento de versión y un solo evento de auditoría;
    la segunda operación termina en `SR010` o `SR001` sin escritura parcial.
24. Correr en paralelo la restauración de una actividad abierta y
    `update_account_v1` desactivando o cambiando el rol del responsable. El lock
    `sistema-r-account-administration` debe serializar ambas operaciones; la
    actividad solo vuelve activa con un Operario activo. Repetir con una
    actividad entregada y confirmar que conserva al responsable histórico.
25. Completar un ciclo de baja/restauración sobre una actividad entregada con
    jornadas discontinuas, hilo abierto y un mensaje ya dado de baja. Estado,
    entrega, material, opinión, jornadas y mensajes deben permanecer idénticos;
    el mensaje sigue dado de baja, el evento original conserva el motivo y el
    número de filas de `activities` no cambia.
26. Iniciar como Admin y consultar el Histórico para 2026 y un año posterior:
    deben aparecer solapamientos inclusivos y todas las jornadas discontinuas,
    sin actividades en Papelera ni datos internos ajenos a su DTO.
27. Repetir la lectura del Histórico como Operario responsable, otro Operario,
    Burson, perfil inactivo y anónimo: todos deben quedar denegados por la ruta o
    por RLS, sin depender de ocultamiento visual.
28. Paginar más de `api.max_rows` actividades, jornadas, eventos de auditoría,
    mensajes, encargos Burson, perfiles e historial de cuentas; confirmar que
    el keyset no omite ni duplica filas bajo mutaciones concurrentes. Ejecutar
    `EXPLAIN (ANALYZE, BUFFERS)` antes de crear índices nuevos.
29. Dar de baja una actividad mientras se lee el Histórico: una respuesta ya en
    curso puede reflejar el snapshot anterior, pero la siguiente lectura debe
    excluirla y nunca debe mezclar una actividad sin jornadas válidas para el
    año solicitado.
30. Ejecutar en paralelo `plan_activity_v1`, `create_own_activity_v1` y
    `replan_activity_v1` contra `update_account_v1` al desactivar, cambiar el rol
    o retirar el permiso del mismo Operario. Los bloqueos compartidos de
    `profiles` deben serializar el resultado: la escritura falla cerrada con
    `SR002`, `SR003` o `SR009`, o queda una actividad abierta cuyo responsable
    continúa activo y autorizado; nunca una actividad abierta asignada a un
    perfil inactivo o que dejó de ser Operario.
31. Ejecutar dos `update_account_v1` en paralelo con dos Admin que intentan
    modificar la cuenta del otro, y cruzar la degradación o desactivación del
    Admin actor contra `create_account_profile_v1`,
    `prepare_temporary_password_reset_v1` y
    `confirm_temporary_password_reset_v1`. Todas las rutas deben adquirir el
    advisory global antes de bloquear el perfil actor: las operaciones quedan
    serializadas, un actor ya revocado falla con `SR002` y no se admite
    `40P01`. Confirmar también los estados fail-closed documentados por cada
    Edge Function: el alta elimina el usuario Auth si falla crear el perfil o
    informa limpieza pendiente; el reset conserva `must_change_password=true`,
    sesiones revocadas y la auditoría de inicio si Auth o la confirmación
    fallan; el cambio obligatorio conserva el bloqueo si falla su RPC final y
    puede informar limpieza pendiente de la huella. Nunca debe quedar acceso de
    negocio activo ni una auditoría que declare una fase que no ocurrió.

Semántica conocida de idempotencia: mientras una actividad idempotente está en
la Papelera, repetir su solicitud conserva el fallo cerrado vigente (`SR006`).
Después de restaurarla, el mismo replay vuelve a devolver la actividad. El Corte
5 documenta esta conducta y no modifica las RPC de creación.

**Estado actualizado al 2026-09-04: gate local completo.** La revisión estática
Claudex cerró las once cláusulas de conversación del Corte 4 sin hallazgos
críticos ni altos. La revisión de Papelera tampoco encontró defectos críticos
ni altos; sus hallazgos locales quedaron corregidos y el gate completo del
frontend pasó con 198 pruebas en 22 archivos y 10 recorridos E2E. Docker,
PostgreSQL local y Supabase CLI están disponibles; las siete migraciones
compilaron y los 51 controles reales de Auth/RLS/RPC aprobaron. El recorrido
cubre los 31 puntos mediante identidades efímeras y una base desechable:
conversación, Papelera, claves temporales, transferencia Burson, invariantes
del roster, carreras entre cuentas y actividades, los siete recursos por
encima de `api.max_rows`, Histórico concurrente y `EXPLAIN` bajo RLS para Admin
y Operario. Las 20 pruebas Deno adicionales inyectan los fallos documentados
de las Edge Functions, cubren la recuperación de usuarios Auth huérfanos y
confirman los estados de compensación o recuperación fail-closed. El arnés
rechaza además el lookup privilegiado falsificable
descartado y prueba el cierre de jornadas por clave temporal, sesión revocada,
perfil inactivo y Papelera. La séptima migración no está aplicada en staging;
por ello el smoke autenticado de staging sigue siendo un gate distinto.
La revisión final Claudex del cierre local terminó `APPROVED`, sin hallazgos
críticos, altos ni medios; la evidencia canónica está en
[`evidencia-cierre-local-2026-09-04.md`](../docs/evidencia-cierre-local-2026-09-04.md).

Cada gate se registra solo después de ejecutarse contra la versión que declara.
Las pruebas textuales del frontend no sustituyen `supabase db reset`, la matriz
RLS ni las pruebas reales de carrera y replay.
