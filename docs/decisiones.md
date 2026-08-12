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

---

## D-011 — El tablero de Burson lo mantienen Coordinación y Supervisión

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

**Consecuencias**

- Lo actualiza quien realmente habla con Burson, sin cargar a una sola persona.
- El resto de los roles **no ve el módulo**, ni siquiera su entrada en la navegación. La navegación
  deja de ser igual para todos los colaboradores.

---

## D-012 — Burson usa sus propios estados

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

Una solicitud de Burson no recorre los siete estados de una actividad. Usa un conjunto propio y corto:

**Solicitado · En proceso · Entregado · Aprobado · Cancelado**

**Consecuencias**

- Encaja con lo que el módulo es: el seguimiento de un requerimiento de un tercero, sin «Por subir» ni
  observación interna.
- El sistema mantiene **dos máquinas de estados distintas**. No deben mezclarse ni compartir pantallas
  de filtro, y hay que probarlas por separado.
- Los pendientes de Rhino y de Burson siguen siendo el dato que de verdad mueve el tablero; el estado
  resume, no sustituye.

---

## D-013 — «Por subir» es obligatorio solo en los tipos que producen material

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

| Tipo | Camino hasta Entregada |
|---|---|
| Grabación, Edición, Creatividad | En proceso → **Por subir** → Entregada |
| Coordinación, Operación | En proceso → Entregada, con Por subir opcional |

**Consecuencias**

- Coincide con D-008: los mismos tres tipos que deben dejar un enlace son los que tienen algo que subir.
- «Por subir» significa siempre lo mismo donde es obligatorio, y el panel de supervisión puede confiar
  en ese estado para saber qué falta publicar.
- Es una regla más que explicar en el formulario cuando alguien intente saltarse el paso.

---

## D-014 — El colaborador puede retroceder, salvo desde Entregada

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

El responsable puede volver a un estado anterior mientras trabaja —de Por subir a En proceso, de En
proceso a Programada—. Desde **Entregada no puede retroceder**: ahí el control pasa a supervisión.

**Consecuencias**

- Corregir un cambio de estado por error no exige molestar a nadie mientras el trabajo está en curso.
- Lo que entró en revisión no sale de la bandeja de supervisión sin que supervisión lo sepa.
- Si el colaborador entregó por error, tiene que pedir una observación o avisar por fuera. Es el mismo
  precio que ya se aceptó en D-009 con la cancelación.

---

## D-015 — Supervisión resuelve las observaciones

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

El colaborador responde y corrige; **supervisión lee y decide** si la observación queda resuelta. Al
resolverse, la actividad vuelve exactamente al estado que tenía antes de ser observada.

**Consecuencias**

- Quien objeta es quien levanta la objeción: observar tiene fuerza real y no puede desactivarse desde
  el lado observado.
- Sostiene la trazabilidad que pide la meta final: se sabe quién observó, quién respondió y quién dio
  por buena la respuesta.
- Supervisión se vuelve un paso obligatorio para desbloquear. El panel de supervisión debe mostrar de
  forma destacada las observaciones **respondidas y pendientes de cerrar**, o las actividades se quedan
  detenidas esperando a que alguien mire.

---

## D-016 — Coordinación ve todas las actividades, sin poder observar, aprobar ni cancelar

**Fecha:** 2026-08-12 · **Fase:** 1 · **Decide:** Marco

Coordinación es un rol de trabajo con **lectura global**. Ve todas las actividades del equipo, pero
sus acciones siguen siendo las de un colaborador: no observa, no aprueba y no cancela.

Esta decisión **acota D-003**, que sigue vigente para los demás roles de trabajo: Grabación, Edición,
Operación y Creatividad ven solo las suyas.

**Consecuencias**

- Resuelve la contradicción que hacía inútil la mitad del rol: se puede seguir lo que se programó.
- El aislamiento entre usuarios deja de ser una regla única. Hay **tres niveles de lectura** —solo lo
  propio, todo sin gobierno, y todo con gobierno— y los tres se prueban por separado en la Fase 8.
- Las políticas RLS de la Fase 4 tienen que contemplar el caso, no derivarse solo de «responsable = yo».
- La pantalla P-2 de Coordinación no es la misma que la de Grabación: muestra actividades ajenas y
  necesita saber de quién es cada una.

---

## D-017 — Navegación con barra inferior fija

**Fecha:** 2026-08-12 · **Fase:** 1 · **Decide:** Marco

Los destinos del rol viven en una **barra inferior fija**, siempre visible. En escritorio, esa misma
barra pasa a un lateral y el contenido gana el ancho.

**Consecuencias**

- El pulgar alcanza la navegación sin recolocar el teléfono, que es lo que pide ser mobile-first.
- Cuesta una franja permanente de una pantalla pequeña. Los formularios largos deben tenerlo en cuenta
  para que la barra no tape el último campo ni el botón de guardar.
- Como el número de destinos cambia por rol (D-011, D-016), la barra tiene entre dos y cinco entradas
  según quién entre. No se diseña una barra fija de contenido fijo.
- El acceso (P-1) y la vista de AUNOR (P-6) no llevan barra: no tienen a dónde navegar.
