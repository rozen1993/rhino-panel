# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

---

## D-001 — ¿Los perfiles son personas o roles?

**Fase:** 0
**Bloquea:** modelo de perfiles, pantalla de cuentas, matriz de permisos, formulario de actividad
(campo responsable) y todo el filtrado "mis actividades".

`CLAUDE.md` nombra a Johann, Eduardo, Chiara y Martín como perfiles funcionales. No está resuelto si
el sistema piensa en personas concretas o en roles que una persona ocupa.

**Opciones**

- **A. Roles, y una persona ocupa uno o varios.** Johann es un usuario con rol *Grabación*.
  Consecuencia: entra alguien nuevo sin tocar el sistema; Johann puede además editar sin que haya que
  inventar un perfil "Johann que también edita"; los permisos se escriben una sola vez por rol. Cuesta
  una pantalla de administración de cuentas algo más completa.
- **B. Perfiles fijos por persona.** El sistema conoce a Johann, Eduardo, Chiara y Martín.
  Consecuencia: más simple hoy; cada alta, baja o cambio de función obliga a tocar código o
  configuración; una persona con dos funciones no tiene representación limpia.

**Recomendación:** A. Es la que no obliga a rehacer permisos cuando cambie el equipo.

---

## D-002 — ¿Quién crea la actividad?

**Fase:** 0
**Bloquea:** recorrido principal completo, pantalla de inicio de cada perfil, permisos de creación y
el significado real del estado `Programada`.

**Opciones**

- **A. Cada colaborador registra lo suyo.** El estado `Programada` es casi siempre un paso propio.
  Consecuencia: supervisión ve lo que ya ocurrió; la planificación vive fuera del sistema.
- **B. Coordinación/supervisión programa y asigna; el colaborador solo avanza el estado.**
  Consecuencia: `Programada` tiene dueño claro y el sistema sirve también para planificar; el
  colaborador tiene menos que llenar desde el celular; si nadie programa, el colaborador no puede
  registrar lo que hizo.
- **C. Ambas.** El colaborador puede crear la suya y coordinación también puede programarle
  actividades. Consecuencia: cubre la operación real de los dos modos; exige decidir qué pasa cuando
  el colaborador hace algo no programado (¿lo crea él y queda igual de válido?).

**Recomendación:** C, si la operación real mezcla trabajo programado con coberturas que salen sobre
la marcha. Conviene confirmarlo contra cómo trabajan hoy.

---

## D-003 — ¿Qué ve un colaborador?

**Fase:** 0
**Bloquea:** pantalla de listado, permisos de lectura, y más adelante las políticas RLS.

**Opciones**

- **A. Solo sus actividades.** Consecuencia: pantalla limpia en celular; aislamiento fácil de probar;
  nadie ve el trabajo del resto aunque le sirva para coordinarse.
- **B. Todas, pero solo edita las suyas.** Consecuencia: el equipo se ve entre sí y coordina; hay que
  decidir si eso incluye notas y observaciones internas de otros.
- **C. Las suyas más las de su área.** Consecuencia: intermedio; obliga a definir qué es "área" y a
  mantener esa agrupación.

**Recomendación:** A para la primera versión, porque es la más segura y la más simple de verificar.
B se puede abrir después sin rehacer nada; el camino inverso sí obliga a rehacer.

---

## D-004 — ¿Cómo entra AUNOR?

**Fase:** 0
**Bloquea:** la vista AUNOR completa, su seguridad y el trabajo mensual de supervisión.

**Opciones**

- **A. Cuenta con usuario y contraseña, rol de solo lectura.** Consecuencia: se sabe quién entró y
  cuándo; la cuenta se desactiva; exige crear y entregar credenciales a un cliente externo.
- **B. Enlace mensual de solo lectura, sin cuenta.** Consecuencia: cómodo para el cliente, cero
  gestión de contraseñas; el enlace es la credencial, así que hay que decidir si caduca y qué pasa si
  se reenvía a terceros.
- **C. Cuenta ahora, enlace como añadido posterior.** Consecuencia: la más segura de arranque; el
  enlace queda como mejora si el cliente se queja de la fricción.

**Recomendación:** A. `CLAUDE.md` ya exige cuentas individuales, autorización en servidor y cuentas
desactivables; un enlace público sin cuenta tensiona ese requisito.

---

## D-005 — ¿Burson necesita cuenta propia?

**Fase:** 0
**Bloquea:** el alcance del módulo Burson y su matriz de permisos.

`CLAUDE.md` dice expresamente que no se asuma que Burson necesita cuenta salvo decisión de Marco, y
describe el módulo como *"seguimiento separado de las actividades internas de Rhino"*, con pendientes
de Rhino y pendientes de Burson.

**Opciones**

- **A. Sin cuenta.** Es un tablero interno de Rhino sobre lo que se coordina con Burson. Nadie de
  Burson entra al sistema.
- **B. Con cuenta de solo lectura.** Burson ve el estado de sus requerimientos pero no escribe.
- **C. Con cuenta que puede escribir** en sus propios pendientes.

**Recomendación:** A para esta entrega. Es lo que literalmente pide el requerimiento y evita abrir
una superficie externa que después hay que asegurar y probar.

---

## D-006 — Excel histórico: disponibilidad y forma real

**Fase:** 0 (informativa) / 7 (bloqueante)

No bloquea la concepción, pero conviene resolverlo temprano: conocer las columnas reales del Excel
—sobre todo las coberturas de Johann— evita diseñar campos que el histórico no puede llenar y
descubrirlo recién en la Fase 7.

**Qué hace falta:** una copia del archivo en el proyecto, o al menos la lista de columnas y unas
filas de ejemplo.
