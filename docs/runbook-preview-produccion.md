# Runbook de Preview y producción

**Versión:** 2026-09-04

**Estado:** el candidato técnico a RC1 del commit `c328b7d` está publicado;
staging tiene siete migraciones y ambas funciones v2. Preflight, catálogo y
sondas HTTP aprobaron; el smoke autenticado sigue pendiente. Producción no fue
creada ni modificada. Evidencia:
[`evidencia-preview-rc1-2026-09-04.md`](evidencia-preview-rc1-2026-09-04.md).

Este es el procedimiento operativo único del Corte 7. La implementación del
backend y la matriz detallada de aceptación viven en `../supabase/README.md`;
este runbook ordena su aplicación sin convertir una preparación local en
evidencia remota.

## 0. Límites y punto de autorización

- Los pasos de lectura y validación local pueden ejecutarse sin modificar
  servicios externos.
- Vincular proyectos, aplicar migraciones, desplegar funciones, crear proyectos,
  cambiar variables o dominios y promover a producción requieren autorización
  explícita para ese ambiente.
- No guardar en Git ni copiar a Vercel una contraseña, `service_role`,
  `sb_secret_...`, JWT privilegiado o clave de PostgreSQL.
- Nunca ejecutar `supabase db reset --linked`. El rollback de base de datos es
  hacia delante mediante una migración correctiva.
- Antes del primer comando con efecto remoto, registrar: ambiente, proyecto
  destino, operador, cambio autorizado, ventana y plan de reversión.

## 1. Mapa inmutable de ambientes

| Superficie | Datos | Contrato | Estado actual |
|---|---|---|---|
| Local | fixtures `demo` o Supabase local | solo desarrollo | disponible |
| Vercel Preview | proyecto `sistema-r` en Oregon | `VERCEL_ENV=preview` y target `staging` | `c328b7d`, siete migraciones y funciones v2; candidato a RC1, sin Go autenticado todavía |
| Vercel Production | otro proyecto Supabase | `VERCEL_ENV=production` y target `production` | proyecto/dominio aún por autorizar |

El Preview es accesible para pruebas preliminares e incluye el cierre de
producto; que esté publicado no implica aceptación autenticada ni Go de RC1.

La raíz Vercel es `frontend/`, la región declarada es `pdx1` y el build remoto
debe usar el `buildCommand` versionado en `frontend/vercel.json`. Preview y
Production no pueden compartir project ref, usuarios, datos ni credenciales.

## 2. Preflight local

Desde `frontend/`:

```powershell
npm ci
npm run verify
npm run test:e2e
npm run test:functions
npm run verify:supabase:local
```

El último comando requiere Docker Desktop y opera únicamente sobre el Supabase
local: reinicia su base al comienzo y la deja limpia al finalizar.

La evidencia local repetida el 2026-09-04, registrada en
[`evidencia-cierre-local-2026-09-04.md`](evidencia-cierre-local-2026-09-04.md),
es:

- TypeScript y ESLint aprobados;
- 198 pruebas Vitest en 22 archivos;
- build optimizado aprobado;
- 10 recorridos Playwright aprobados;
- 20 pruebas Deno de configuración, compensación y recuperación de Edge Functions;
- 51 controles reales de Auth/RLS/RPC contra Supabase local;
- `build:vercel` aprobado con un ambiente sintético aislado;
- preflight sin variables de despliegue rechazado con 11 diagnósticos genéricos
  y sin revelar valores.

El preflight lee solo variables del proceso: no carga `.env.local`, no imprime
valores y acumula todos los errores. Vercel lo ejecuta automáticamente mediante
`npm run build:vercel` antes de `next build`. Confirmar en el dashboard que no
exista un Build Command manual que sustituya `frontend/vercel.json` y que estén
habilitadas las [System Environment Variables de Vercel](https://vercel.com/docs/environment-variables/system-environment-variables).
No definir manualmente `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`,
`VERCEL_BRANCH_URL` ni `VERCEL_PROJECT_PRODUCTION_URL`.

Variables obligatorias en cada ambiente Vercel:

```text
SISTEMA_R_DATA_SOURCE=supabase
SISTEMA_R_DEPLOYMENT_TARGET=staging | production
SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF=<ref del ambiente>
SISTEMA_R_SITE_URL=https://<origen exacto sin barra final>
SUPABASE_URL=https://<ref del ambiente>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SISTEMA_R_USERNAME_DOMAIN=<dominio interno>
```

El preflight exige `VERCEL=1`, `preview → staging` y
`production → production`; comprueba que URL y project ref coincidan y rechaza
claves legacy o privilegiadas en cualquier variable. Para Preview, el origen
declarado debe ser `https://VERCEL_BRANCH_URL` o, si esa variable no existe,
`https://VERCEL_URL`. Para Production debe ser
`https://VERCEL_PROJECT_PRODUCTION_URL`. Así un HTTPS bien formado pero de otro
ambiente también falla. La desigualdad entre los refs de staging y producción
se verifica en el checklist humano porque los builds conocen un solo ambiente.
La topología vigente admite únicamente proyectos hospedados en
`<ref>.supabase.co`; un futuro dominio propio o backend self-hosted exige revisar
el preflight antes de adoptarlo.

## 3. Checkpoint de autorización

Antes de continuar, el registro debe responder **sí** a todo:

1. ¿El ambiente y el project ref fueron identificados sin ambigüedad?
2. ¿Existe autorización explícita para escribir en ese ambiente?
3. ¿Se conoce el artefacto anterior y el procedimiento de reversión?
4. ¿Las variables se cargarán por el dashboard/CLI autorizado y no por Git?
5. ¿Existe una ventana para ejecutar smoke tests inmediatamente después?

Una respuesta negativa es **No-Go**. Detenerse no invalida la preparación local.

## 4. Backend de staging

Los pasos 1 a 7 se ejecutaron para las seis primeras migraciones el 2026-09-02.
Con autorización posterior, el 2026-09-04 se aplicó la séptima, se desplegaron
ambas funciones v2 y se aprobaron las sondas remotas de la sección 4.1. El
dominio interno aún debe comprobarse de extremo a extremo sin leer su valor.
El punto 9 ya quedó ejecutado mediante
el Supabase local desechable: 51 controles PostgreSQL/Auth más 20 pruebas de
fallos de Edge Functions cubren los 31 puntos. El smoke autenticado del paso 8
continúa pendiente; ninguna evidencia local sustituye esa prueba de staging.

Con autorización y desde la raíz:

1. Autenticar la CLI y vincular explícitamente `sistema-r`.
2. Comparar `supabase migration list` con las migraciones versionadas.
3. Ejecutar `supabase db push --dry-run` y conservar la salida.
4. Aplicar las migraciones pendientes en orden.
5. Desplegar `admin-accounts` y `change-temporary-password`.
6. Configurar `SISTEMA_R_USERNAME_DOMAIN` como secreto de ambas funciones.
7. Confirmar signup público desactivado y las URL Auth exactas de Preview.
8. Ejecutar en staging únicamente el smoke autenticado no destructivo de la
   sección 6, con identidades temporales autorizadas y limpieza comprobable.
9. **Completado localmente:** recrear un Supabase desechable desde las siete
   migraciones y ejecutar allí los 31 puntos de “Gate objetivo de los Cortes 1
   a 6” de `../supabase/README.md`, incluida la matriz RLS, SQLSTATE, carreras,
   compensaciones de Auth, volúmenes mayores que `api.max_rows` y `EXPLAIN`.

La matriz completa nunca se ejecuta sobre el roster vigente de staging. Dentro
de esa matriz, los casos que intentan alterar o retirar la única cuenta Burson,
transferir su vínculo especial, compensar Auth, cambiar roles o permisos
globales, o fabricar volumen de paginación son exclusivos del proyecto
desechable. La identidad Burson temporal de la sección 6 pertenece solo al
smoke funcional de staging: requiere autorización separada, no ensaya esas
invariantes y debe limpiarse de forma exacta.

No marcar este bloque como aprobado a partir de pruebas simuladas o lectura de
SQL. Cada resultado debe corresponder a la versión realmente aplicada.

### 4.1 Sondas remotas obligatorias de RC1

Para la publicación de `c328b7d`, antes de escribir se observaron las seis
versiones remotas sincronizadas y el dry-run anunció **solo**
`202609030001_rls_visibility_performance.sql`. Ahora debe mostrar siete versiones
y ningún pendiente; no volver a aplicar la migración. En futuras publicaciones,
comparar contra el conjunto autorizado de esa versión. Ejecutar los comandos
de base secuencialmente, sin compartir en paralelo la inicialización de login:

```powershell
$stagingRef = "<STAGING_REF_CONFIRMADO>"
npx.cmd --no-install supabase migration list --linked --project-ref $stagingRef
npx.cmd --no-install supabase db push --dry-run --skip-vault --linked --project-ref $stagingRef
$functionsBeforeJson = npx.cmd --no-install supabase functions list `
  --project-ref $stagingRef --output json
$functionsBefore = ($functionsBeforeJson -join "`n") | ConvertFrom-Json
```

Cualquier diferencia adicional produce **No-Go**. Después del `db push`, repetir
los dos primeros comandos: las siete versiones deben quedar emparejadas y el
segundo dry-run no debe encontrar trabajo pendiente. Consultar además el
catálogo efectivo en una transacción de solo lectura:

```powershell
$policySql = @'
begin transaction read only;
select c.relname as table_name, p.polname as policy_name,
       p.polcmd::text as command_code, p.polpermissive,
       c.relrowsecurity as rls_enabled,
       p.polroles = array[(select oid from pg_catalog.pg_roles
                           where rolname = 'authenticated')]::oid[]
         as authenticated_only,
       coalesce(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid, true), '')
         as check_expression,
       pg_catalog.pg_get_expr(p.polqual, p.polrelid, true) as using_expression
from pg_catalog.pg_policy p
join pg_catalog.pg_class c on c.oid = p.polrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('activities', 'activity_date_spans')
order by c.relname, p.polname;
'@
$policySql = $policySql -replace '\r?\n', ' '
npx.cmd --no-install supabase db query $policySql --linked `
  --project-ref $stagingRef --output json
```

Con la CLI instalada, `db query --project-ref` necesita `--linked`. El SQL se
aplana para cruzar `npx.cmd` en Windows. `SELECT` debe ser la última sentencia
para devolver sus filas; no añadir `COMMIT`, que devolvería un resultado vacío.
La transacción de solo lectura termina al liberarse la conexión de la CLI.
El bloque no admite comentarios SQL de línea `--`: al aplanarlo comentarían
también el resto de la consulta. Mantenerlo sin esos comentarios.

El resultado debe contener exactamente `activities_select_authorized` y
`activity_date_spans_select_authorized`, ambas de lectura, permisivas, con RLS
activo, `authenticated_only=true` y sin `WITH CHECK`. La primera expresión debe resolver sesión, rol,
responsable, creador, origen y papelera sin invocar `can_view_activity`; la
segunda debe delegar mediante una subconsulta RLS sobre `activities`, sin
`can_view_activity_id`.

Valores literales a comprobar en ambas filas: `command_code="r"`,
`polpermissive=true`, `rls_enabled=true`, `authenticated_only=true` y
`check_expression=""`.

Tras desplegar las dos funciones **sin** `--no-verify-jwt` ni `--prune`:

```powershell
$functionsAfterJson = npx.cmd --no-install supabase functions list `
  --project-ref $stagingRef --output json
$functionsAfter = ($functionsAfterJson -join "`n") | ConvertFrom-Json
```

Cada función debe quedar `ACTIVE`, con `verify_jwt=true`, versión mayor que en
`$functionsBefore` y digest remoto presente. Un despliegue parcial es No-Go.
Comprobar también la existencia del secreto por nombre, sin imprimir ni guardar
su valor o digest, y registrar el commit más los SHA-256 de los tres fuentes.

Finalmente, ambas rutas deben rechazar una petición sin token:

```powershell
$stagingUrl = "https://$stagingRef.supabase.co"
foreach ($functionName in @("admin-accounts", "change-temporary-password")) {
  $status = curl.exe --silent --show-error --output NUL `
    --write-out "%{http_code}" --connect-timeout 10 --max-time 30 `
    --request POST --header "Content-Type: application/json" --data "{}" `
    "$stagingUrl/functions/v1/$functionName"
  if ($status -ne "401") { throw "$functionName respondió $status; se esperaba 401" }
}
```

La igualdad del dominio interno entre Vercel y Supabase no se demuestra leyendo
solo los nombres de variables. Debe quedar probada sin revelar el valor mediante
el recorrido real `alta temporal -> login por username -> cambio obligatorio de
clave -> acceso`, seguido de la limpieza autorizada y el retorno al baseline.

## 5. Vercel Preview

La configuración inicial se completó el 2026-09-02 para `equipo`. La publicación
del cierre `c328b7d` del 2026-09-04 está `Ready`, protegida por Vercel, con alias
estable y artefacto inmutable registrados en su evidencia. No se generó una
llave compartible nueva ni se presupone que la anterior cubra este artefacto.
Preflight y smoke HTTP aprobaron; el smoke por identidad sigue pendiente.

1. Configurar las siete variables obligatorias solo para Preview y, si se usa
   una rama dedicada, hacer que `SISTEMA_R_SITE_URL` coincida con su URL de rama
   estable.
2. Confirmar que no existe ninguna variable privilegiada o `NEXT_PUBLIC` con
   secretos.
3. Crear el despliegue Preview autorizado. El preflight debe aparecer antes del
   build en el log y terminar `preview → staging`.
4. Registrar el origen HTTPS estable en Supabase Auth: Site URL y redirect URLs
   exactas; no usar comodines más amplios de lo necesario.
5. Repetir el despliegue si el cambio de URL lo exige.
6. Comprobar encabezados en una respuesta HTML y en `/robots.txt`:
   CSP estructural, COOP, Permissions Policy, Referrer Policy, HSTS, `nosniff`,
   antiframing, ausencia de `X-Powered-By` y `X-Robots-Tag: noindex, nofollow`.

La CSP actual protege `base-uri`, objetos, framing y formularios. No pretende
ser todavía una política completa de scripts. `Cross-Origin-Opener-Policy` debe
revisarse si en el futuro se incorpora OAuth por popup.

Esta limitación se acepta solo para el Preview privado: antes del Go de
producción se debe inventariar cada origen efectivo y ensayar una CSP completa
con `default-src` y `script-src` mediante nonces o hashes compatibles con el
build real. HSTS permanece deliberadamente limitado al host actual;
`includeSubDomains` y `preload` solo se habilitan después de comprobar que todos
los subdominios sirven HTTPS de forma permanente. La validación se registra con
cabeceras de una respuesta HTTPS desplegada, no solo leyendo la configuración.

## 6. Smoke test por identidad

El roster vigente de staging no incluye una cuenta Burson. Antes de ejecutar su
fila, Admin debe crear una identidad temporal mediante `/cuentas` y
`admin-accounts`, con autorización y un plan de limpieza que retire exactamente
su usuario Auth y su perfil y devuelva staging al baseline de seis perfiles. Si
esa limpieza no está autorizada o no puede demostrarse, el escenario Burson se
ejecuta solo en el proyecto desechable y permanece pendiente en staging.

| Identidad | Prueba mínima | Resultado obligatorio |
|---|---|---|
| Anónima | abrir rutas privadas | redirección a acceso, sin datos |
| Admin | planificar, reasignar, baja/restauración e Histórico | control total de planificación; auditoría íntegra |
| Operario responsable sin permiso | ejecutar asignación y abrir creación directa | ejecución disponible; creación denegada |
| Operario autorizado | crear actividad propia y luego perder el permiso | responsable forzado a sí mismo; revocación inmediata |
| Otro Operario | abrir actividad ajena por URL | denegado por servidor/RLS |
| Burson | crear y consultar su encargo | solo DTO externo; sin superficies internas |
| Cuenta con clave temporal | intentar entrar al negocio | forzada a cambiar clave primero |
| Perfil inactivo | reutilizar sesión anterior | operación denegada y sesión revocada |

Repetir en Preview los escenarios no destructivos de conversación, Papelera e
Histórico. Las carreras o invariantes que alteren el roster se reservan al
proyecto desechable. Probar al menos escritorio, móvil real y Safari/iOS antes
del Go de producción.

## 7. Evidencia requerida

Guardar en el registro de la versión, sin secretos ni contraseñas:

| Campo | Evidencia |
|---|---|
| Identidad | fecha/hora Lima, operador, commit y artefacto Vercel |
| Destino | ambiente, URL y huella enmascarada del project ref |
| Backend | lista de migraciones, dry-run, versiones de funciones y backup |
| Local | resultados de `verify`, E2E, `verify:supabase:local` y `git diff --check` |
| Vercel | URL o ID inmutable del deployment, alias estable, build log con `preview → staging` y artefacto anterior recuperable; nunca guardar la llave del enlace compartible |
| Seguridad | salida aprobada del preflight y encabezados observados |
| Datos | matriz RLS, SQLSTATE, carreras y planes `EXPLAIN` |
| Producto | matriz smoke con resultado y captura cuando aporte evidencia |
| Decisión | Go/No-Go, aprobador y plan de reversión confirmado |

No registrar cuerpos de mensajes, claves temporales, tokens, cookies ni datos
personales innecesarios.

## 8. Go/No-Go de Preview

Preview solo obtiene **Go** si:

- gates locales y preflight están verdes;
- el build usa Supabase staging, nunca `demo`;
- migraciones y funciones coinciden con Git;
- las sondas posteriores confirman las dos policies reales, versiones mayores,
  `verify_jwt=true` y rechazo 401 sin token en ambas funciones;
- el smoke autenticado no destructivo de staging se ejecutó y aprobó;
- los 31 gates PostgreSQL/RLS se ejecutaron y aprobaron en un proyecto
  desechable creado desde las mismas migraciones;
- signup, dominio interno y redirects son exactos;
- matriz smoke, encabezados y logs no muestran errores críticos;
- existe un artefacto anterior recuperable.

Cualquier secreto privilegiado en Vercel, ref ambiguo, migración no verificada,
fallo RLS, error de build o evidencia ausente produce **No-Go**.

El primer artefacto que cumpla estos gates se denomina `RC1`: es un candidato
para la validación del equipo, no una versión inmutable ni una autorización de
Producción. Consolidar el feedback, clasificarlo como defecto, mejora o cambio
de alcance y aplicar cada lote sobre commits nuevos. Si afecta datos o permisos,
añadir una migración forward-only; nunca modificar una ya aplicada. Cada
`RC2…RCn` repite los gates pertinentes y solo la aceptación explícita del equipo
permite solicitar el Go separado de Producción.

## 9. Preparar y promover producción

No “promover” la base de staging. Con autorización separada:

1. Crear el proyecto Supabase de producción y demostrar que su ref difiere del
   de staging.
2. Configurar backup/retención y ensayar restauración antes de cargar datos
   reales.
3. Aplicar desde cero las mismas migraciones y funciones; repetir el gate RLS.
4. Crear cuentas de producción con claves temporales nuevas, nunca copiadas.
5. Configurar dominio propio, TLS, Auth URL y las siete variables de Production.
6. Confirmar `production → production` en el preflight.
7. Ejecutar la matriz smoke y registrar el Go autorizado.
8. Observar la versión durante la ventana acordada antes de cerrar el cambio.

Los cambios de esquema deben seguir expansión–migración–contracción: primero
añadir estructuras compatibles, después migrar/validar datos y solo en otra
versión retirar lo antiguo.

## 10. Observabilidad sin proveedor adicional

- Vercel: logs de build, runtime y funciones, estado del despliegue y latencia.
- Supabase: Auth, Postgres, API y Edge Function logs, conexiones y recursos.
- Correlacionar por ventana horaria, ruta, función, código SQLSTATE y UUID
  técnico; nunca por credenciales ni cuerpos sensibles.
- Durante la ventana, vigilar fallos de login/cambio de clave, tasas 5xx, errores
  de RPC, denegaciones inesperadas y saturación de conexiones.
- Registrar síntoma, primera/última ocurrencia, alcance, artefacto, decisión y
  responsable. Una anomalía de autoridad o fuga es incidente y **No-Go**.

## 11. Rollback

- **Frontend:** redeploy del artefacto Vercel anterior compatible.
- **Edge Functions:** volver a desplegar la versión anterior compatible.
- **Base de datos:** no usar down/reset remoto; aplicar una migración correctiva
  hacia delante. El patrón expansión–contracción mantiene compatible el
  frontend anterior.
- **Seguridad:** retirar acceso, rotar la credencial afectada y revocar sesiones
  solo con autorización de incidente.
- **Datos:** restaurar únicamente desde un backup verificado, con autorización y
  registro del punto de recuperación.

Después de revertir, repetir smoke y documentar causa, alcance y corrección. Un
rollback técnico no borra evidencia de auditoría.

## 12. Indexación y gates todavía externos

La plataforma privada publica metadata `noindex`, `X-Robots-Tag` y `robots.txt`
con `Disallow: /`. Estas señales son complementarias, pero no se leen a la vez:
un crawler que respeta `Disallow` no llega a consultar el encabezado ni la
metadata, y robots por sí solo no garantiza desindexación. El encabezado y la
metadata protegen las respuestas que sí se solicitan. Si una URL apareciera
indexada, permitir temporalmente el crawl mientras se conserva `noindex`
permite al robot leer la orden de retirada. Si algún día el producto debe ser
público, retirar las tres señales en un cambio revisado; no cambiar una sola de
forma aislada.

Al cerrar esta publicación ya se ejecutaron la compilación PostgreSQL desde
cero y el gate local de 31 puntos. Staging tiene siete migraciones, ambas Edge
Functions v2 y el Preview `c328b7d`, con sondas de catálogo y HTTP aprobadas.
Siguen pendientes para el Go de RC1: acceso de prueba Admin autorizado,
identidades temporales —incluida Burson— con limpieza exacta y smoke autenticado.
Después corresponde UAT y Safari/iOS real. La preparación de Producción está
definida aquí; crear su proyecto, ejecutar backup/restauración y desplegar
requieren autorización separada. Ningún punto pendiente equivale a aprobado.
