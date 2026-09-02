# Bitácora de aprendizaje: backend de Sistema R

**Audiencia:** desarrollador con experiencia en frontend y sin experiencia
previa en backend  
**Actualizada:** 2026-08-23  
**Estado:** documento vivo; se actualizará durante cada corte del backend

## 1. Qué estamos construyendo

Sistema R ya tenía una interfaz Next.js capaz de simular cuentas y actividades
en el navegador. El trabajo actual agrega un backend real para que identidad,
permisos y datos no dependan de `localStorage`, cookies de demostración ni datos
incluidos en el código.

El recorrido simplificado es:

```text
Navegador
  → Next.js (interfaz y acciones de servidor)
  → Supabase Auth (comprueba usuario y contraseña)
  → PostgreSQL + RLS (guarda datos y decide qué filas puede ver cada persona)
```

Una forma útil de entenderlo desde frontend:

- Next.js presenta controles y recoge formularios.
- Auth responde «quién es esta persona».
- El perfil responde «qué rol tiene y si sigue activo».
- PostgreSQL conserva la información de forma persistente.
- RLS vuelve a comprobar «qué información puede ver esta persona», aunque
  intente saltarse la interfaz.
- Las RPC realizan operaciones de negocio completas y seguras dentro de la base.

## 2. Los tres ambientes

| Ambiente | Para qué sirve | Estado actual |
|---|---|---|
| Desarrollo local | Programar y revisar rápidamente en la PC | El modo `demo` funciona; la conexión local a staging es el siguiente paso |
| Staging | Probar el sistema real antes de producción | Supabase `sistema-r` en Oregon, con esquema y cuentas de prueba |
| Producción | Uso cotidiano del equipo | Pendiente; tendrá otro proyecto Supabase y no compartirá datos con staging |

Staging sí guarda datos reales y persistentes, pero su finalidad es permitir
pruebas seguras. Lo que se valide allí se repetirá de forma controlada en el
proyecto de producción.

## 3. Trabajo realizado

### 3.1 Cimiento versionado

El commit `e158957` incorporó:

- clientes Supabase compatibles con Next.js y renderizado de servidor;
- autenticación mediante usuario y contraseña;
- cookies de sesión `HttpOnly`;
- modo explícito `demo` o `supabase`;
- migración PostgreSQL del primer corte;
- políticas RLS;
- acciones para crear, editar, iniciar y entregar actividades;
- pruebas de contrato, tipos, lint y build;
- configuración y procedimiento de staging.

### 3.2 Conexión del repositorio con Supabase

Desde la raíz `Sistema_R` se ejecutó:

```powershell
npx.cmd supabase login
npx.cmd supabase projects list
npx.cmd supabase link --project-ref <STAGING_PROJECT_REF>
```

Significado:

- `login` autorizó la CLI en esta PC;
- `projects list` permitió comprobar el proyecto y la región;
- `link` indicó que este repositorio usa `sistema-r` como staging.

El token de la CLI se guarda fuera del repositorio. El enlace local tampoco
añade contraseñas al código versionado.

### 3.3 Despliegue del esquema

Primero se comparó el estado:

```powershell
npx.cmd supabase migration list
```

La migración local `202608220001` no existía todavía en remoto. Después se hizo
una simulación:

```powershell
npx.cmd supabase db push --dry-run
```

Al confirmar que el único cambio era
`202608220001_backend_foundation.sql`, se aplicó:

```powershell
npx.cmd supabase db push
```

La comprobación final mostró `202608220001` tanto en `Local` como en `Remote`.
Esto significa que el archivo versionado y el historial de staging coinciden.

### 3.4 Configuración de Auth

En el Dashboard se dejó:

- registro de usuarios nuevos desactivado;
- vinculación manual desactivada;
- cuentas anónimas desactivadas;
- confirmación de correo activada;
- proveedor Email activado.

Las cuentas se crean manualmente con **Auto confirm user**. La aplicación pide
un nombre de usuario, pero Supabase Auth necesita internamente un identificador
con formato de correo. Por eso `martin` se transforma en
`martin@auth.sistema-r.invalid`. Es un alias técnico, no un buzón real.

### 3.5 Cuentas y perfiles actuales de staging

| Usuario | Nombre visible | Rol | Especial de Burson |
|---|---|---|---|
| `admin` | Admin | Admin | No |
| `martin` | Martin | Operario | No |
| `cesar` | Cesar | Operario | No |
| `kiara` | Kiara | Operario | No |
| `johann` | Johann | Operario | No |
| `eduardo` | Eduardo | Operario | Sí |

Las contraseñas existen únicamente en Supabase Auth y no se documentan. Los
perfiles se vincularon a los UUID de Auth mediante una operación ejecutada en
SQL Editor. El resultado confirmó seis perfiles activos y un solo Operario
especial.

La cuenta del rol Burson todavía no fue creada.

### 3.6 Validación técnica previa

Antes de conectar staging se aprobaron TypeScript, ESLint, 33 pruebas Vitest,
el build de producción y tres recorridos Playwright en modo demo. La migración
también fue aceptada por un parser real de PostgreSQL.

Estas comprobaciones demuestran que el código compila y que sus contratos
estáticos son coherentes. No sustituyen la prueba real de RLS: esa requiere
iniciar sesión contra staging con varias cuentas e intentar accesos permitidos y
prohibidos.

## 4. Conceptos aprendidos

### Migración

Es un archivo SQL versionado que lleva una base desde un estado conocido al
siguiente. Permite aplicar el mismo diseño en staging y, después, en producción
sin construir tablas manualmente una por una.

### Auth user y perfil

Son objetos distintos:

- `auth.users` conserva identidad, contraseña cifrada y UUID;
- `public.profiles` conserva usuario visible, nombre, rol, estado y condición
  especial.

Separarlos evita guardar contraseñas en tablas de la aplicación y permite que
RLS consulte datos de negocio sin exponer el esquema interno de Auth.

### UUID

Es el identificador único de una cuenta. No es una contraseña. El perfil usa el
mismo UUID que Auth para asegurar que ambos registros representan a la misma
persona.

### PostgreSQL

Es el motor de base de datos que guarda perfiles, actividades, fechas, sesiones
y auditoría. El SQL Editor no es una simulación: una consulta ejecutada modifica
la base seleccionada aunque el texto del snippet no se guarde.

### RLS

Row Level Security aplica permisos por fila dentro de PostgreSQL. Por ejemplo,
un Operario puede recibir sus actividades, pero no las de otro Operario. Ocultar
un botón en React mejora la interfaz; RLS constituye la barrera de seguridad.

### RPC

Es una función de base invocada desde la aplicación. El primer corte usa RPC
para registrar sesiones y modificar actividades. Cada función valida actor,
rol, estado y datos dentro de una sola transacción.

### Variables de entorno

Permiten cambiar de ambiente sin cambiar el código. La URL y la publishable key
identifican staging y pueden usarse desde la aplicación protegida por RLS. Una
secret key o `service_role` elude esas restricciones y nunca debe entrar en el
frontend, Git o una captura.

### Modo demo y modo Supabase

- `demo` usa fixtures, cookies de prueba y almacenamiento del navegador.
- `supabase` usa Auth y PostgreSQL reales y falla de forma explícita si falta
  configuración.

Los despliegues nunca deben mezclar ambos modos ni volver silenciosamente a los
datos de demostración.

## 5. Tablas del primer corte

| Tabla | Responsabilidad |
|---|---|
| `profiles` | Rol, nombre, estado y Operario especial |
| `app_sessions` | Sesiones de aplicación, expiración de 12 horas y revocación |
| `activities` | Información principal y estado de cada actividad |
| `activity_date_spans` | Una o varias jornadas, incluso fechas discontinuas |
| `audit_events` | Trazabilidad de operaciones importantes |

## 6. Estado real al 2026-08-23

Completado:

- cimiento del backend versionado;
- proyecto staging enlazado;
- migración aplicada y verificada;
- registro público cerrado;
- seis cuentas Auth y seis perfiles creados;
- Eduardo marcado como único Operario especial;
- `frontend/.env.local` configurado con los valores públicos de staging y
  correctamente ignorado por Git;
- build de producción aprobado en modo Supabase con la configuración real;
- login real y navegación protegida de Admin revisados manualmente desde
  `localhost` sin errores de servidor.

Pendiente antes de aprobar el primer corte:

- iniciar sesión y completar un recorrido de actividad como Operario;
- ejecutar la matriz de permisos RLS y persistencia;
- crear la cuenta Burson cuando se definan sus credenciales;
- desplegar un Preview de Vercel;
- registrar resultados y corregir cualquier fallo.

## 7. Siguiente paso

El frontend local ya usa, mediante `frontend/.env.local`, esta configuración:

```text
SISTEMA_R_DATA_SOURCE=supabase
SUPABASE_URL=https://<STAGING_PROJECT_REF>.supabase.co
SUPABASE_PUBLISHABLE_KEY=[valor no documentado]
SISTEMA_R_USERNAME_DOMAIN=auth.sistema-r.invalid
```

El archivo pasó validación de formato, está fuera de Git y el build terminó sin
errores. El servidor local se inició en `http://localhost:3000`. La siguiente
prueba es iniciar sesión como `admin` y confirmar que Auth, sesión, perfil y RLS
permitan abrir `/actividades`. La secret key, `service_role` y la contraseña de
PostgreSQL no se usan.

## 8. Reglas de seguridad durante el aprendizaje

1. No pegar contraseñas, tokens ni secret keys en chat, Git o capturas.
2. Revisar siempre el proyecto enlazado antes de `db push`.
3. Ejecutar `--dry-run` antes de una migración remota.
4. No usar `db reset --linked`; puede borrar la base remota.
5. Tratar SQL Editor como acceso administrativo real.
6. Probar permisos con más de un usuario; una interfaz correcta no demuestra
   por sí sola que RLS sea correcta.
7. Mantener staging y producción separados.

## 9. Plantilla para próximas entradas

Cada avance nuevo registrará:

- fecha y objetivo;
- acción realizada;
- explicación conceptual;
- resultado y evidencia;
- intervención manual de Marco;
- riesgos o datos pendientes;
- siguiente paso seguro.

## 10. Referencias internas

- `decision-backend-supabase-2026-08-22.md`: decisiones arquitectónicas.
- `estado.md`: estado ejecutivo actual.
- `../supabase/README.md`: instrucciones operativas.
- `../supabase/migrations/202608220001_backend_foundation.sql`: esquema y reglas.
