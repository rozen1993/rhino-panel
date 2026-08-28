# Supabase de Sistema R

Este directorio es la fuente versionada del backend. El proyecto remoto
`sistema-r` se trata como **staging**; producción usará otro proyecto.

## Qué está listo

- Configuración local sin signup público, Storage ni Realtime.
- Migración con tablas, RLS, sesiones, auditoría y RPC del primer corte.
- Frontend con modo `demo` o `supabase` explícito.
- Región Vercel `pdx1`, cercana a la base en Oregon.

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

## 2. Aplicar la migración a staging

**Completado en `sistema-r` el 2026-08-22.** El historial local y remoto muestra
la migración `202608220001` en ambos lados. Los comandos se conservan como
procedimiento reproducible para futuros ambientes.

Desde la raíz del repositorio:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref TU_PROJECT_REF
npx.cmd supabase migration list
npx.cmd supabase db push --dry-run
npx.cmd supabase db push
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
mismo dominio que utilizará la aplicación y se marcó **Auto confirm user**:

```text
admin@auth.sistema-r.invalid
martin@auth.sistema-r.invalid
cesar@auth.sistema-r.invalid
kiara@auth.sistema-r.invalid
johann@auth.sistema-r.invalid
eduardo@auth.sistema-r.invalid
```

SQL Editor vinculó los UUID de Auth con `public.profiles`: `admin` tiene rol
Admin; Martin, Cesar, Kiara, Johann y Eduardo tienen rol Operario; únicamente
Eduardo está marcado como Operario especial. La cuenta Burson sigue pendiente.

La contraseña se define en Auth, no en SQL. El índice impide tener dos
Operarios especiales activos. Las RPC administrativas que garantizarán además
un mínimo de un Admin y una sola cuenta Burson pertenecen al siguiente corte.
Los UUID y contraseñas no se documentan. En un ambiente nuevo deben obtenerse de
sus propias cuentas Auth; no se reutilizan los usuarios de staging.

## 4. Configurar Vercel Preview

La raíz del proyecto Vercel debe ser `frontend/`. Añadir estas variables solo al
ambiente **Preview**:

```text
SISTEMA_R_DATA_SOURCE=supabase
SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SISTEMA_R_USERNAME_DOMAIN=auth.sistema-r.invalid
```

La URL y la publishable key están en **Supabase → Connect / API Keys**. No
copiar `sb_secret_...`, `service_role` ni la contraseña de PostgreSQL a variables
de la aplicación. Después, crear un nuevo despliegue Preview y registrar su URL
estable en **Authentication → URL Configuration**.

## 5. Prueba de aceptación

1. Iniciar como Ana y crear una actividad con dos jornadas discontinuas.
2. Recargar: debe persistir.
3. Editarla, iniciarla y entregarla con un enlace HTTPS.
4. Iniciar como Carlos: no debe aparecer ni abrirse la actividad de Ana.
5. Iniciar como Admin: debe ver la actividad y su trazabilidad.
6. Desactivar el perfil de Ana: la siguiente operación debe fallar.
7. Restaurarla solo para continuar las pruebas.

Guardar el resultado de esta prueba antes de iniciar el siguiente corte.
