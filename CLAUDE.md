# Contexto vigente de Sistema R

Esta es la fuente breve y vigente para trabajar en el repositorio. El contrato
normativo completo está en
`docs/contrato-producto-vigente-2026-08-28.md`. Los documentos anteriores se
conservan como historia, pero no pueden contradecir ese contrato.

## Objetivo

Construir la plataforma de gestión de actividades de Rhino Audiovisuales.
Marco Vargas es el único decisor del producto.

## Modelo operativo

- Existen exactamente tres roles: **Operario**, **Admin** y **Burson**.
- Existen exactamente tres estados: **Programada**, **En proceso** y
  **Entregada**.
- Admin crea, planifica, asigna, modifica, reasigna, da de baja y restaura las
  actividades ordinarias. No inicia ni entrega actividades.
- Un Operario solo puede crear una actividad propia cuando Admin le concede el
  permiso individual y revocable `can_create_own_activities`. El permiso es
  `false` por defecto y no permite asignar la actividad a otra persona.
- El Operario responsable controla únicamente la ejecución: enlace, opinión y
  transición `Programada → En proceso → Entregada`.
- Burson crea y consulta sus propios encargos. Cada encargo se asigna al único
  Operario especial activo; Burson no accede a conversaciones, auditoría ni
  información interna.
- `origin` representa el canal (`operario` ordinario o `burson`) y
  `created_by_role` representa la autoría. Una actividad planificada por Admin
  usa el canal ordinario y autoría Admin.
- La baja es lógica, restaurable y exclusiva de Admin. Motivo, actor y momento
  sobreviven en auditoría inmutable aun después de restaurar.

## Cuentas y acceso

- No existe registro público.
- Admin administra las cuentas y puede conceder o retirar el permiso de
  creación propia a un Operario concreto.
- Admin genera una clave temporal. La cuenta queda fuera de toda operación de
  negocio hasta que el usuario la cambie al ingresar.
- Las operaciones de Auth que requieren privilegios viven en una Edge Function
  de Supabase. Ninguna clave `service_role` entra al frontend ni a Vercel.
- Desactivar una cuenta revoca sus sesiones. Siempre debe quedar al menos un
  Admin activo, una sola cuenta Burson activa y un único Operario especial
  activo.

## Histórico y diseño

- El Histórico comienza el **1 de enero de 2026** y admite los años siguientes.
- Es exclusivo de Admin y usa un calendario anual interactivo, no una hoja
  Excel.
- Representa días, rangos continuos y jornadas discontinuas; una fecha puede
  contener varias actividades.
- La dirección aprobada está en `diseno/direccion-final-traducida/` y su
  contrato en `diseno/direccion-final-traducida/CONTRATO-VISUAL.md`.
- La interfaz debe funcionar de 390 a 1920 px, con teclado, foco visible y
  contraste legible.

## Datos y alcance

- `SISTEMA_R_DATA_SOURCE=demo` conserva una simulación que debe reflejar el
  mismo contrato de permisos que el modo real.
- `SISTEMA_R_DATA_SOURCE=supabase` activa Auth, PostgreSQL, RLS y RPC; nunca
  vuelve silenciosamente a fixtures.
- Las mutaciones se autorizan en SQL/RPC usando `auth.uid()`. Ocultar controles
  no constituye autorización.
- El chat IA no forma parte de esta implementación. Solo se mantiene el plan
  independiente `docs/plan-chat-ia-reutilizable.pdf`; su primera versión será
  exclusiva de Admin y de solo lectura.
- Microsoft Graph, carga de archivos y despliegues externos requieren una orden
  separada.

## Verificación

Trabajar desde `frontend/` y ejecutar `npm run verify`. Los recorridos de
navegador se ejecutan con `npm run test:e2e`. Las migraciones deben recrearse
desde cero en Supabase local antes de declararse listas para producción.
