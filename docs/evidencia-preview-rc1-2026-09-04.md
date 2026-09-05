# Evidencia del candidato técnico a Preview RC1

**Fecha:** 2026-09-04 (America/Lima)

**Resultado:** código publicado y sondas de infraestructura aprobadas. El Go de
RC1 sigue pendiente del smoke autenticado; `Ready` no significa aceptación
funcional por roles. Producción no fue modificada.

## Artefacto y alcance

- Rama: `equipo`; commit de producto y `origin/equipo` al publicar:
  `c328b7de757beadcfa5ea14eb82b0aef6b23eb37`.
- Vercel: proyecto `rhino-panel`, destino **Preview**, deployment
  `dpl_3XwtCyZRGEANL9J2HqSmcR9Fzn4U`, estado `Ready`.
- Creado el 2026-09-04 a las 17:59:42; publicación terminada a las 18:00:07 Lima.
- [Artefacto inmutable](https://rhino-panel-ol79q3jql-marcos-projects-65572cc0.vercel.app).
- [Alias estable de equipo](https://rhino-panel-git-equipo-marcos-projects-65572cc0.vercel.app).
- Protección Vercel conservada. No se creó ni se publicó una llave compartible
  nueva; no se presupone que el enlace compartible anterior cubra este artefacto.
- Supabase: `sistema-r`, staging, Oregon (`us-west-2`), ref enmascarada `***qmnf`.
- Operador técnico: Codex, tras la autorización de Marco para commit, push de
  `equipo`, migración 7, ambas funciones en staging y Preview. Esto no autoriza
  cambiar cuentas existentes, limpiar usuarios ni desplegar Producción.

El build remoto identificó rama `equipo` y commit `c328b7d`, ejecutó
`npm run build:vercel`, registró `Preflight de despliegue aprobado: preview → staging.`
y terminó el build Next.js 16.3.1. El build corrió en `iad1`; las funciones del
artefacto están en `pdx1`, como indica la configuración versionada.

Este documento fija el artefacto de producto indicado. Un commit posterior que
solo actualice documentación o pruebas documentales no cambia retrospectivamente
su hash ni su evidencia; el alias de rama sí puede avanzar.

## Backend observado después de publicar

| Comprobación | Resultado |
|---|---|
| Antes de la escritura | Seis migraciones remotas; dry-run anunció solo `202609030001_rls_visibility_performance.sql`. |
| Después de `db push --skip-vault --linked --yes` | Siete versiones local/remoto emparejadas, desde `202608220001` hasta `202609030001`. |
| Segundo dry-run | `upToDate: true`; `migrations`, `seeds` y `roles` vacíos. |
| `admin-accounts` | Versión 1 → 2; `ACTIVE`; `verify_jwt: true`; digest de bundle presente. |
| `change-temporary-password` | Versión 1 → 2; `ACTIVE`; `verify_jwt: true`; digest de bundle presente. |
| POST sin token a ambas funciones | `401` en las dos rutas. No prueba su ejecución autenticada. |
| Configuración Edge | Existe el nombre `SISTEMA_R_USERNAME_DOMAIN`; no se leyó su valor. |
| Roster, consulta agregada de solo lectura | Seis perfiles, seis activos, un Admin activo, cero Burson activos, un Operario vinculado a Burson. |

**Configuración Auth:** la última observación de Site URL, redirect exacto,
signup público y acceso anónimo está en el
[snapshot del 2026-09-02](evidencia-staging-2026-09-02.md). El alias estable no
cambió y esta publicación no modificó esa configuración; no se volvió a leer
la configuración Auth hospedada. Su revalidación permanece en el checklist de
Go, junto con el recorrido de dominio interno, no se deduce del HTTP 200.

**Backup de staging:** no se creó ni se verificó un backup en esta publicación.
No se afirma disponer de uno restaurable ni se sustituyó por un backup de
Producción. La reversión de la migración es correctiva hacia delante; esta
observación no autoriza restauraciones ni escrituras de prueba adicionales.

La consulta de `pg_policy` en una transacción de solo lectura devolvió exactamente
las dos policies esperadas: `activities_select_authorized` y
`activity_date_spans_select_authorized`. Ambas son SELECT permisivas, exclusivas
de `authenticated`, con RLS activo y sin `WITH CHECK`.

La primera resuelve sesión y rol mediante subconsultas y un `CASE`: Admin ve el
conjunto autorizado, Operario solo lo no eliminado de su responsabilidad y
Burson solo sus encargos no eliminados de origen Burson. No invoca
`can_view_activity`. La segunda usa la sesión/rol y delega visibilidad mediante
`activity_id IN (SELECT id FROM activities)` con RLS, sin
`can_view_activity_id`. Esto verifica el catálogo aplicado, no reemplaza un
recorrido con JWT real ni constituye un `EXPLAIN` remoto medido por rol.

### Huellas de los fuentes y bundles

| Fuente | SHA-256 local |
|---|---|
| `supabase/migrations/202609030001_rls_visibility_performance.sql` | `C9FD9C48BDEAF8E82974123FBC3D5E2129E3EC74B05AFBD594ECE3CF7EFC864F` |
| `supabase/functions/admin-accounts/index.ts` | `D4D3ABE61066CE8200B005F882D415BEC73FE43F04B51952F9EE210AB99411E2` |
| `supabase/functions/change-temporary-password/index.ts` | `FA9016DE5517B292D38556C3B05B7D0A572B45D176120F847D21DBA746CA2C27` |

Digests remotos de bundles v2 (no son hashes del archivo fuente individual):

- `admin-accounts`: `adaa1c1fc094dee85f6785ce0e8e581c20decaa76d8ff5802fa08e9140dd8bd4`.
- `change-temporary-password`: `a755c2dac4f8db06667443e5a7f117a3d9128a1bd1ca526e50668f0a31d004b9`.

## Sondas HTTP de Preview

Ejecutadas por la CLI Vercel autenticada, con su acceso administrado a la
protección del deployment; sin extraer ni registrar la llave de bypass.

| Ruta sin sesión de aplicación | Resultado |
|---|---|
| `/` | `200` |
| `/acceso` | `200` |
| `/actividades` | `307`, `Location: /acceso` |
| `/robots.txt` | `200`, `User-Agent: *` y `Disallow: /` |

Se observaron `X-Robots-Tag: noindex, nofollow` y `nosniff`, también en la
redirección privada. La respuesta de `/` confirmó CSP estructural
(`base-uri`, `object-src`, `frame-ancestors`, `form-action`), COOP `same-origin`,
Permissions Policy, Referrer Policy `strict-origin-when-cross-origin`, HSTS
`max-age=63072000`, `X-Frame-Options: DENY` y ausencia de `X-Powered-By`.

## Evidencia local y revisión Claudex

El [cierre local](evidencia-cierre-local-2026-09-04.md) registra TypeScript,
ESLint, build, 198 Vitest en 22 archivos, 10 Playwright demo, 20 pruebas Deno y
51 controles reales de Auth/RLS/RPC en una base local desechable. No se atribuyen
los resultados demo o locales al runtime hospedado. La comprobación documental
posterior pasó `npm --prefix frontend test`: 198/198 pruebas en 22 archivos,
incluida la prueba de contrato actualizada a 20 casos Deno sin imponer cifras
nuevas a snapshots históricos. El ejemplo SQL corregido del runbook se ejecutó
tal como está documentado y devolvió las dos policies esperadas. No se cambió
código de aplicación, migraciones ni funciones durante este cierre documental;
por ello no se repitieron los escenarios destructivos locales ni los E2E demo.

La revisión final independiente de Claude Code (`o/max`, `execute`, `core`)
terminó `APPROVED` para la publicación controlada, no para omitir el smoke real.
Su journal completo es
`claudex-20260904T224558420Z-7d5d4dc8d85b47cb86657f0f250c02ba.jsonl`, en la carpeta
local de recuperación Claudex; SHA-256
`F160D56B17A6FB8432DA7CF7109C6A327660DFEF42CE8C25712635BC966C2155`.
La [revisión incompleta por cuota](checkpoint-rc1-claudex-2026-09-04.md) de ese
mismo día queda como registro histórico, no como aprobación. No se copian
prompts, secretos ni razonamientos internos.

La revisión documental posterior de Claude terminó **APROBADO con hallazgos
menores**, sin bloqueantes, en el journal
`claudex-20260904T235527956Z-cec616455e3c4cebbd5e1380437dc6be.jsonl`; SHA-256
`BB6293F927201727FE061355E5FCEE93CD62B361D323D8985E2538542588AA7B`.
Se corrigieron las etiquetas de las dos corridas EXPLAIN, el alcance del
`APPROVED`, el registro de Auth/backup y las precisiones del ejemplo SQL. La
aserción de 51 controles ahora tolera saltos de línea, sin cambiar su cifra.
La revisión auxiliar anterior de Codex terminó por cuota y no se cuenta como
revisión completada; no hubo fallo de Claude en esta pasada.

Además se inspeccionó el paquete instalado `@supabase/server@1.4.1`: el runtime
normaliza `sub → userClaims.id` y `app_metadata → userClaims.appMetadata` antes
de llamar al handler. Los nombres usados por las dos funciones son correctos.
El pin y esta inspección reducen la incertidumbre de integración; no reemplazan
la ejecución Edge con una cuenta de clave temporal. El uso de `ctx: any` y la
resolución de transitivas sin lock son riesgos residuales de mantenimiento.

## Pendiente para el Go de RC1

1. Contar con una sesión Admin operada por su titular, o con un medio de prueba
   temporal expresamente autorizado, sin extraer cookies ni resetear cuentas
   existentes. Esta sesión no está disponible para el agente.
2. Probar en el Preview `alta → login por username → cambio obligatorio de clave
   → acceso`. Así se verifica también la coherencia del dominio interno entre
   frontend y Edge sin revelar sus valores.
3. Completar el smoke no destructivo por roles del runbook: planificación Admin,
   ejecución del responsable, aislamiento de otro Operario, permiso revocable,
   conversación, Papelera e Histórico. Burson requiere cuenta temporal y un plan
   autorizado para limpiar exactamente Auth/perfil y sus datos de prueba.
4. Registrar resultados sin contraseñas, JWT ni cookies y demostrar el retorno
   al baseline acordado. No ejecutar pruebas de carreras, volumen o cambios del
   roster real en staging: ya se comprobaron en la base desechable.

No hay un proceso de pruebas autenticadas ejecutándose en segundo plano. Se
solicitó al titular probar el acceso y cambio temporal sin enviar credenciales;
su respuesta sigue pendiente al registrar esta evidencia. Esto es un gate de
acceso/autorización externo, no una cuota de Claude ni un build pendiente.

Después del Go de RC1: UAT del equipo y dispositivos reales, feedback agrupado y
`RC2…RCn` si corresponde. La preparación de Producción está documentada en el
runbook; crear su proyecto aislado, ensayar restauración y desplegar necesitan
autorización separada y no son condiciones para empezar las pruebas preliminares.

## Reversión identificada

- Frontend anterior: commit `6d52d8fc247b3ab263ad1d82d530ab6f34d57d57`, deployment
  `dpl_2QwNo6Pgt2oev8C47zdaaChodCmf`,
  [artefacto previo](https://rhino-panel-hrx8ysyxe-marcos-projects-65572cc0.vercel.app).
- Edge: fuentes anteriores en ese commit para un redespliegue compatible
  autorizado; no se ejecutó rollback.
- Base: nunca `reset` remoto ni edición de migraciones aplicadas; una corrección
  exige una migración nueva forward-only. No se creó ni se certificó un backup
  de Producción en esta publicación.
