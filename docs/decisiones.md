# Decisiones

Decisiones de producto y arquitectura que deben sobrevivir al chat. Una decisión aquí solo cambia si
Marco la cambia expresamente, y el cambio se escribe en este archivo.

---

## D-001 — Los perfiles son roles, no personas

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

El sistema modela **roles**, y una persona ocupa uno o varios. Johann no es un perfil: es un usuario
con el rol *Grabación*.

Roles derivados del requerimiento:

| Rol | Alcance |
|---|---|
| Grabación | Grabaciones y coberturas |
| Edición | Edición y postproducción |
| Coordinación | Coordinación y seguimiento |
| Operación | Operaciones |
| Creatividad | Producción y desarrollo creativo |
| Supervisión / Administración | Vista global, observaciones, aprobaciones, cuentas e importación |
| AUNOR | Consulta mensual de solo lectura |

**Consecuencias**

- Entra o sale gente sin tocar el sistema; basta crear la cuenta y asignarle rol.
- Una persona con dos funciones se representa limpiamente (Johann puede grabar y editar).
- Los permisos se escriben una sola vez por rol, no por persona.
- Hace falta una pantalla de administración de cuentas que asigne y revoque roles.
- Los cinco roles de trabajo coinciden con los cinco tipos de actividad, pero **no son lo mismo**: el
  rol dice qué puede hacer una persona; el tipo dice qué es la actividad. No se asume que un rol solo
  pueda registrar actividades de su tipo homónimo mientras Marco no lo decida.

---

## D-002 — La actividad la crea tanto el colaborador como coordinación

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

Ambas vías conviven: el colaborador registra lo suyo, y coordinación/supervisión puede además
programar y asignar actividades a otros.

**Consecuencias**

- El sistema sirve para planificar y para registrar lo que salió sobre la marcha.
- `Programada` puede tener dos orígenes: una actividad asignada por coordinación, o una que el propio
  colaborador agenda.
- Una actividad no programada que el colaborador registra al vuelo es igual de válida que una
  programada. No existe una categoría de segunda.
- La actividad debe distinguir **quién la creó** de **quién es responsable**, porque pueden ser
  personas distintas.

---

## D-003 — Un colaborador ve solo sus actividades

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

Quien tiene un rol de trabajo ve únicamente las actividades de las que es responsable. Supervisión y
administración ven todo.

**Consecuencias**

- La pantalla principal en celular es corta y no exige filtrar.
- El aislamiento entre usuarios es fácil de probar de forma negativa, en la Fase 8.
- Marca la regla base de las políticas RLS que se diseñen en la Fase 4.
- Es la dirección reversible: abrir la visibilidad más adelante no obliga a rehacer nada; cerrarla
  después de haberla abierto, sí.
- Queda abierto —y no urge— qué ve el responsable de una actividad que otro creó para él: por
  defecto, la ve, porque es suya.

---

## D-004 — AUNOR entra con cuenta y contraseña

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

AUNOR accede con cuenta individual y rol de solo lectura. No se usa un enlace público.

**Consecuencias**

- Queda registro de quién entró y cuándo, y la cuenta puede desactivarse.
- Es coherente con lo que `CLAUDE.md` ya exige: cuentas individuales, autorización validada en
  servidor y cuentas desactivables.
- Hay que crear y entregar credenciales a un cliente externo, y prever el restablecimiento de
  contraseña.
- La separación de datos de AUNOR debe existir igual en el servidor: la cuenta no es la protección,
  solo la puerta.
