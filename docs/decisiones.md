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

---

## D-005 — Burson no tiene cuenta

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

El módulo Burson es un tablero **interno de Rhino** sobre lo que se coordina con Burson. Nadie de
Burson entra al sistema.

**Consecuencias**

- No se abre ninguna superficie externa nueva que asegurar, filtrar y probar. Los únicos usuarios
  externos siguen siendo los de AUNOR.
- Los pendientes de Burson los registra Rhino según lo que sabe: son una anotación propia, no una
  declaración del cliente.
- Si más adelante Burson quisiera ver su estado, se puede añadir una cuenta de solo lectura sin
  rehacer el módulo. El camino inverso sería más caro.

---

## D-006 — Excel histórico

Pendiente. Ver `docs/decisiones-pendientes.md`.

---

## D-007 — El colaborador puede editar su actividad hasta que se apruebe

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

Entregar no bloquea la ficha. El responsable sigue pudiendo editarla mientras no esté Aprobada.

**Consecuencias**

- Corregir un enlace mal pegado, una fecha o una descripción no exige pedir una observación.
- **Riesgo asumido:** supervisión puede estar revisando una ficha que cambia mientras la lee. Para que
  eso no sea invisible, el diseño de la Fase 1 debe mostrar en el detalle **cuándo se modificó por
  última vez**, de forma que supervisión note que lo que aprueba no es lo que abrió.
- Aprobada sigue siendo el cierre: a partir de ahí no se edita.

---

## D-008 — El enlace al material es obligatorio para entregar, salvo en Coordinación y Operación

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

| Tipo | Enlace para pasar a Entregada |
|---|---|
| Grabación | Obligatorio |
| Edición | Obligatorio |
| Creatividad | Obligatorio |
| Coordinación | Opcional |
| Operación | Opcional |

**Consecuencias**

- En los tres tipos que producen material, «Entregada» significa siempre lo mismo: existe algo y se
  sabe dónde está.
- Coordinación y Operación pueden entregar sin archivo, porque no siempre producen uno.
- La validación ocurre **al cambiar a Entregada**, no al crear la actividad: nadie tiene el enlace
  cuando registra una grabación que aún no hizo.

---

## D-009 — Solo supervisión puede cancelar

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

Cancelar es una acción exclusiva de Supervisión / Administración, en cualquier estado salvo Aprobada.
Un colaborador no cancela ni siquiera una actividad suya que nunca empezó.

**Consecuencias**

- Ninguna actividad comprometida desaparece sin que supervisión lo sepa.
- Cuando una cobertura se cae en campo, el colaborador tiene que avisar por fuera del sistema. Si eso
  resulta incómodo en el uso real, se revisa; por ahora prima el control.
- Una actividad Aprobada no puede cancelarla nadie.

---

## D-010 — Entregar exige avance 100

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

El avance se escribe a mano y es independiente del estado durante el trabajo, con dos reglas: pasar a
**Entregada** exige avance 100, y **Aprobada** lo mantiene en 100.

**Consecuencias**

- Se conserva el matiz de «voy por la mitad» mientras la actividad está En proceso o Por subir.
- No existen actividades Entregadas al 60 %, que es lo que confundiría a quien lee la lista, incluido
  AUNOR.
- El formulario debe explicar por qué no deja entregar cuando el avance no llegó a 100, en vez de
  fallar en silencio.
