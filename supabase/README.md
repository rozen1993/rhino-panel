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
verificaciones locales indicadas. No significa compilado contra PostgreSQL,
aplicado en staging ni certificado mediante una matriz RLS o pruebas reales de
concurrencia.

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
```

Ambos gates se aprobaron localmente el 2026-08-30 con Deno 2.9.6.

## 2. Aplicar migraciones y funciones a staging

**Solo `202608220001` está aplicado en `sistema-r` desde el 2026-08-22.** Las
migraciones `202608280001`, `202608290001`, `202608300001`, `202608300002` y
`202608310001`, y
las funciones `admin-accounts` y `change-temporary-password`, son artefactos
locales todavía no desplegados. Ninguna de esas cinco migraciones se ha
compilado desde cero mediante `supabase db reset` en este entorno. Los comandos
siguientes son el procedimiento reproducible y no se ejecutan sin autorización
explícita.

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

`config.toml` configura el entorno local. En el dashboard de staging también se
debe desactivar **Allow new users to sign up**. No ejecutar todavía
`supabase config push`: el archivo local contiene URLs de localhost y la URL
definitiva de Preview aún no existe.

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

### Gate ejecutable del cimiento `202608220001`

Este recorrido corresponde exclusivamente al modelo anterior que hoy existe en
staging. Sirve para comprobar que el cimiento no retrocedió; no certifica el
contrato objetivo del 2026-08-28.

1. Iniciar como Martin, crear una actividad propia con dos jornadas
   discontinuas y recargar para confirmar su persistencia.
2. Iniciar como Cesar: no debe aparecer ni abrirse la actividad de Martin.
3. Iniciar como Admin: debe poder consultarla y ver su trazabilidad.
4. Desactivar el perfil de Martin: su siguiente operación debe fallar.
5. Restaurarlo solo para continuar las pruebas.

### Gate objetivo de los Cortes 1 a 6 (`202608280001` a `202608310001`)

Las pruebas locales cubren el contrato de interfaz, el wiring de Server Actions
y propiedades estáticas del SQL. **El recorrido siguiente no se ha ejecutado
contra PostgreSQL local ni staging** y ningún punto debe registrarse como
aprobado hasta aplicar
`202608280001_activity_authority.sql` y
`202608290001_account_administration.sql` y
`202608300001_burson_channel.sql` y
`202608300002_private_conversations.sql` y
`202608310001_activity_trash.sql`, conservar evidencia de los códigos de
error, la matriz RLS y las carreras. La aplicación remota requiere autorización
separada y este gate todavía no es ejecutable en staging:

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
    `40P01`. Confirmar también la compensación de Auth documentada por cada Edge
    Function, sin perfil, sesión ni auditoría parcial.

Semántica conocida de idempotencia: mientras una actividad idempotente está en
la Papelera, repetir su solicitud conserva el fallo cerrado vigente (`SR006`).
Después de restaurarla, el mismo replay vuelve a devolver la actividad. El Corte
5 documenta esta conducta y no modifica las RPC de creación.

**Estado del gate hasta el Corte 7 al 2026-09-01: no ejecutado.** La revisión
estática Claudex cerró las once cláusulas de conversación del Corte 4 sin
hallazgos críticos ni altos. La revisión de Papelera tampoco encontró defectos
críticos ni altos; sus hallazgos locales quedaron corregidos y el gate completo
del frontend pasó con 191 pruebas en 21 archivos y 10 recorridos E2E, incluidos el lector
Histórico con clientes simulados y las defensas del build de despliegue. Este
equipo no dispone de
Docker, `psql` ni Supabase CLI. Por tanto, sintaxis SQL, RLS, grants,
propagación de SQLSTATE y carreras permanecen como evidencia externa
obligatoria.

Cada gate se registra solo después de ejecutarse contra la versión que declara.
Las pruebas textuales del frontend no sustituyen `supabase db reset`, la matriz
RLS ni las pruebas reales de carrera y replay.
