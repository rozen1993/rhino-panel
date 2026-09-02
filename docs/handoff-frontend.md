# Contrato de handoff del frontend

**Versión:** 2026-08-28 — contrato de producto vigente.
**Fuente normativa:** `contrato-producto-vigente-2026-08-28.md`.
**Estado:** objetivo bajo implementación por cortes; `estado.md` distingue lo
ya comprobado de lo que aún falta construir.

## Entidades

- **Cuenta:** un rol (`operario`, `admin` o `burson`), estado activo, permiso
  revocable `canCreateOwnActivities`, obligación de cambio de clave y marca
  `bursonLinked` exclusiva de un Operario.
- **Actividad:** canal, autor, responsable, planificación, ejecución, versión,
  baja lógica y auditoría.
- **Conversación privada:** mensajes visibles únicamente para Admin y el
  Operario responsable, con edición y baja lógica auditadas.

## Permisos de interfaz

- Admin ve toda la operación y dispone de acciones para planificar, asignar,
  replanificar, reasignar, dar de baja y restaurar. No muestra acciones de
  iniciar ni entregar.
- El Operario general consulta sus actividades y modifica solamente estado,
  enlace y opinión. No existe una pestaña permanente «Nueva».
- El Operario con `canCreateOwnActivities` recibe un CTA contextual para crear
  una actividad propia. La ruta vuelve a comprobar el permiso en servidor.
- Burson crea y consulta encargos propios, sin auditoría, conversación interna,
  cuentas, papelera ni Histórico.

## Estados, fechas y bloqueo

La transición única es `Programada → En proceso → Entregada` y solo la ejecuta
el Operario responsable. La entrega exige un enlace HTTPS válido y sin
credenciales incrustadas. Una actividad admite uno o más rangos discontinuos.

El primer mensaje de Admin bloquea cambios posteriores al enlace y a la opinión.
Admin conserva la planificación y puede corregirla después de abrir el hilo.

## Histórico y papelera

El Histórico es exclusivo de Admin, comienza en 2026 y permite navegar los años
siguientes. En móvil usa una columna y hoja inferior; en tablet dos columnas y
panel lateral; en laptop y PC una malla anual con detalle persistente cuando el
espacio lo permita. La papelera es una vista distinta y solo Admin restaura.

## Seguridad de datos

El modo Supabase repite autorización en servidor, RPC y RLS. El permiso de
creación se obtiene del perfil autenticado; una cookie demo o un control oculto
no concede capacidad. Una cuenta con clave temporal solo llega al cambio de
clave y no puede leer ni modificar datos de negocio.
