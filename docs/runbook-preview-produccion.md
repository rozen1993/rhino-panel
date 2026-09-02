# Runbook de Preview y producción

**Versión:** 2026-09-01

**Estado:** preparación local aprobada; ningún despliegue ejecutado por este
documento.

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
| Vercel Preview | proyecto `sistema-r` en Oregon | `VERCEL_ENV=preview` y target `staging` | preparado, no desplegado por el Corte 7 |
| Vercel Production | otro proyecto Supabase | `VERCEL_ENV=production` y target `production` | proyecto/dominio aún por autorizar |

La raíz Vercel es `frontend/`, la región declarada es `pdx1` y el build remoto
debe usar el `buildCommand` versionado en `frontend/vercel.json`. Preview y
Production no pueden compartir project ref, usuarios, datos ni credenciales.

## 2. Preflight local

Desde `frontend/`:

```powershell
npm ci
npm run verify
npm run test:e2e
```

La evidencia local del 2026-09-01 es:

- TypeScript y ESLint aprobados;
- 191 pruebas Vitest en 21 archivos;
- build optimizado aprobado;
- 10 recorridos Playwright aprobados;
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

Con autorización y desde la raíz:

1. Autenticar la CLI y vincular explícitamente `sistema-r`.
2. Comparar `supabase migration list` con las migraciones versionadas.
3. Ejecutar `supabase db push --dry-run` y conservar la salida.
4. Aplicar las migraciones pendientes en orden.
5. Desplegar `admin-accounts` y `change-temporary-password`.
6. Configurar `SISTEMA_R_USERNAME_DOMAIN` como secreto de ambas funciones.
7. Confirmar signup público desactivado y las URL Auth exactas de Preview.
8. Ejecutar los 31 puntos de “Gate objetivo de los Cortes 1 a 6” de
   `../supabase/README.md`, incluida la matriz RLS, SQLSTATE, carreras y
   `EXPLAIN`.

No marcar este bloque como aprobado a partir de pruebas simuladas o lectura de
SQL. Cada resultado debe corresponder a la versión realmente aplicada.

## 5. Vercel Preview

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

Añadir los escenarios de conversación, carreras, Papelera e Histórico del gate
de Supabase. Probar al menos escritorio, móvil real y Safari/iOS antes del Go de
producción.

## 7. Evidencia requerida

Guardar en el registro de la versión, sin secretos ni contraseñas:

| Campo | Evidencia |
|---|---|
| Identidad | fecha/hora Lima, operador, commit y artefacto Vercel |
| Destino | ambiente, URL y huella enmascarada del project ref |
| Backend | lista de migraciones, dry-run, versiones de funciones y backup |
| Local | resultados de `verify`, E2E y `git diff --check` |
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
- los 31 gates PostgreSQL/RLS se ejecutaron y aprobaron;
- signup, dominio interno y redirects son exactos;
- matriz smoke, encabezados y logs no muestran errores críticos;
- existe un artefacto anterior recuperable.

Cualquier secreto privilegiado en Vercel, ref ambiguo, migración no verificada,
fallo RLS, error de build o evidencia ausente produce **No-Go**.

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

Al cerrar este documento siguen sin ejecutarse: compilación PostgreSQL desde
cero, migraciones pendientes en staging, matriz RLS/RPC/SQLSTATE, carreras,
planes reales del Histórico, despliegue Preview, Safari/iOS real, proyecto de
producción, backup/restauración y Go productivo. Son gates externos explícitos,
no defectos ocultos ni resultados aprobados.
