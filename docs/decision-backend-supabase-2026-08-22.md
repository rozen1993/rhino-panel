# Decisión de arquitectura: cimiento Supabase

**Estado:** aprobada e implementada como primer corte vertical
**Fecha:** 2026-08-22

## Resultado

Sistema R conserva el frontend de demostración y suma un modo real, explícito y
sin respaldo silencioso a fixtures:

- `SISTEMA_R_DATA_SOURCE=demo`: simulación local existente.
- `SISTEMA_R_DATA_SOURCE=supabase`: Auth, PostgreSQL, RLS y RPC reales.

El primer corte real cubre:

`login → perfil/rol → listar → crear → editar → iniciar → entregar`

La actividad admite uno o más rangos discontinuos, enlace de material y opinión
opcional. El enlace puede pertenecer a cualquier dominio, pero debe ser HTTPS y
no puede incluir usuario o contraseña en la URL.

## Ambientes

| Ambiente | Aplicación | Datos |
|---|---|---|
| Desarrollo local | Next.js local | demo por defecto; Supabase CLI cuando haya Docker |
| Staging | Vercel Preview, funciones en `pdx1` | proyecto Supabase `sistema-r`, Oregon |
| Producción | Vercel Production | un segundo proyecto Supabase, todavía no creado |

Staging y producción nunca comparten base de datos. El repositorio no contiene
credenciales ni queda vinculado automáticamente a un proyecto remoto.

## Identidad y sesión

- No hay registro público. Las cuentas se crean administrativamente.
- La interfaz recibe `username + contraseña`; internamente Auth usa un alias
  determinista como `ana@auth.sistema-r.invalid`. No es un correo de contacto.
- Las contraseñas pertenecen solo a Supabase Auth y nunca a tablas propias.
- Las cookies son `HttpOnly`, `Secure` fuera de desarrollo y de sesión: el
  navegador las elimina al cerrarse.
- `app_sessions` impone además un máximo absoluto de 12 horas y permite
  revocación inmediata.
- Cada lectura y mutación vuelve a comprobar token, sesión, perfil activo y rol.

## Datos y autorización

El cimiento contiene cinco tablas: `profiles`, `app_sessions`, `activities`,
`activity_date_spans` y `audit_events`.

RLS es obligatoria en las cinco. Los clientes autenticados solo reciben `SELECT`
explícito; no tienen `INSERT`, `UPDATE` ni `DELETE` directo. Las mutaciones del
corte pasan por funciones `SECURITY DEFINER` con `search_path` vacío, actor
obtenido desde `auth.uid()`, bloqueo de fila, control optimista por `version`,
idempotencia con huella del contenido y auditoría atómica.

Visibilidad actual:

- Admin: todas las actividades y su auditoría.
- Operario: sus actividades y su auditoría.
- Operario especial: además, encargos Burson.
- Burson: sus encargos, pero nunca auditoría ni conversación interna.
- Anónimo o perfil inactivo: ningún dato.

## Fuera de este corte

Quedan para cortes posteriores: alta y administración de cuentas desde la
aplicación, encargos Burson reales, conversaciones, versiones de enlace,
reapertura, eliminación lógica desde UI, Histórico real, carga inicial de 2026 y
roster recordado por dispositivo. En modo Supabase esas pantallas no mezclan
fixtures: muestran un aviso de fase pendiente.

También continúan fuera de alcance Microsoft Graph, subida de archivos,
notificaciones y el asistente de IA.

## Puerta de salida del corte

Staging se considera aprobado cuando se compruebe con cuentas reales que:

1. una cookie demo falsificada no concede acceso;
2. un Operario no puede leer ni modificar actividades ajenas;
3. un reintento idéntico no duplica y uno distinto con la misma clave falla;
4. dos ediciones concurrentes no se sobrescriben;
5. HTTP y credenciales incrustadas se rechazan;
6. un perfil desactivado pierde acceso;
7. el flujo completo persiste después de recargar.

La aplicación y la migración están preparadas para esa prueba. Aplicar cambios
al Supabase remoto y configurar Vercel requiere el paso manual descrito en
`supabase/README.md`.
