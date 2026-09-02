# Decisión operativa: modelo de tres roles

**Actualización normativa:** 2026-08-28. El detalle ejecutable vive en
`contrato-producto-vigente-2026-08-28.md` y sustituye cualquier regla anterior
incompatible.

- Roles: Operario, Admin y Burson.
- Estados: Programada, En proceso y Entregada.
- Admin crea, planifica, asigna, modifica, reasigna, da de baja y restaura las
  actividades ordinarias; no las ejecuta.
- Un Operario crea una actividad propia únicamente con el permiso individual y
  revocable `can_create_own_activities`; por defecto no puede crear.
- El Operario responsable controla solo estado, enlace y opinión.
- Burson crea y consulta sus propios encargos; el sistema los asigna al único
  Operario especial activo y Burson no ve información interna.
- El Histórico es un calendario anual interactivo desde 2026 y para los años
  siguientes.
- El material se entrega mediante un enlace HTTPS seguro; no existe un Excel
  histórico independiente.
