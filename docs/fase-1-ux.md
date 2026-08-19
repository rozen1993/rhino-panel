# Fase 1 — UX y desarrollo visual

Cómo se verá y cómo se usará el producto descrito en `docs/fase-0-concepcion.md`.

Esta fase produce **diseño, no código de producto**: no se instala nada, no se andamia la aplicación y
no se conecta ningún backend. Mobile-first: el caso que manda es una persona en vía, con el teléfono en
una mano.

**Puerta de salida:** Marco aprueba la dirección visual y entiende todos los recorridos principales
desde las pantallas.

> ## Fase cumplida el 2026-08-17
>
> Todas las dudas que suspendieron esta fase están resueltas: el catálogo de roles (D-022, D-048,
> D-051), los siete estados (D-019), el patrón compartido de pantalla (D-030), la dirección visual
> (D-031, la pieza 2) y el flujo de acceso (D-026).
>
> **Marco dio la fase por cumplida con D-044**, con las imperfecciones visuales conocidas de INC-002, y
> la corrección se hizo sobre el frontend en código durante la Fase 2.
>
> Este documento se conserva porque su inventario de pantallas, su arquitectura de información y sus
> patrones transversales siguen siendo la referencia de lo que hay construido.

---

## 1. Inventario de pantallas

Nueve pantallas, heredadas de la concepción (§7) y agrupadas aquí por a quién sirven.

| # | Pantalla | Quién la ve |
|---|---|---|
| P-1 | Acceso | Todos |
| P-2 | Mis actividades | Roles de trabajo |
| P-3 | Detalle de actividad | Roles de trabajo, Supervisión |
| P-4 | Formulario de actividad | Roles de trabajo, Coordinación |
| P-5 | Panel de supervisión | Supervisión |
| P-6 | Vista mensual de AUNOR | AUNOR |
| P-7 | Módulo Burson | Coordinación, Supervisión |
| P-8 | Administración de cuentas | Administración |
| P-9 | Histórico *(enlace al Excel, D-055)* | Administración |
| P-10 | Historial mensual *(requerimiento v2)* | Roles de trabajo |

P-6 vive en una interfaz aparte. No comparte navegación, ni cabecera, ni menú con el resto: AUNOR no
debe ver siquiera que existe una aplicación interna detrás.

---

## 1 bis. Cuántas pantallas hay que dibujar de verdad

Diez pantallas de producto **no son diez dibujos**. Cada una se multiplica por tres cosas: el ancho, el
rol que la mira, y el estado en que está. Este es el recuento real del trabajo que queda en la Fase 1.

### Vistas de móvil — el bloque obligatorio, y el primero

| Pantalla | Vistas | Por qué más de una |
|---|---|---|
| P-1 · Acceso | 1 | *Su forma depende de D-026, aún abierta* |
| P-2 · Mis actividades | 5 | Colaborador y Coordinación son distintas (D-016), más vacío, carga y error |
| P-3 · Detalle | 4 | Normal, **Observada**, Aprobada (bloqueada), y la vista de supervisión con sus acciones |
| P-4 · Formulario | 3 | Con ubicación obligatoria y sin ella (D-008), más el aviso de borrador sin enviar |
| P-5 · Supervisión | 2 | Bandeja de observaciones y **bandeja de feedback de AUNOR** (D-033) |
| P-6 · AUNOR | 2 | La consulta del mes, y cómo deja su comentario |
| P-7 · Burson | 2 | El tablero y la ficha de una solicitud |
| P-8 · Cuentas | 2 | La lista y el alta o edición |
| P-9 · Histórico | 1 | Solo el enlace al Excel: abrirlo y cambiarlo (D-055) |
| P-10 · Historial | 2 | La tabla y su estado vacío |
| | **26** | |

### Vistas de escritorio

No todas cambian de verdad. Un formulario ancho es el mismo formulario. Las que **sí** cambian de forma
son las que muestran muchas filas o mucha comparación:

**P-2, P-5, P-6, P-7, P-9 y P-10** — unas **14 vistas** más.

El **laptop** casi nunca es un dibujo nuevo: es el punto intermedio entre los dos anteriores. Solo se
dibuja donde se rompa algo.

### Total

**Alrededor de 40 pantallas dibujadas**, sobre 10 pantallas de producto. El orden es el de D-042:
**móvil primero**, luego laptop, luego escritorio.

### Tres decisiones abiertas mueven este número

- **D-030 — ¿el patrón de pantalla vale igual para todos los perfiles?** Es la que más pesa con
  diferencia. Si cada perfil necesita su propio panel, **P-2 se multiplica por cinco** y el total pasa
  de 40 a más de 60. Los mockups del cliente solo enseñan el panel de Johann, así que no se sabe.
- **D-026 — el flujo de acceso.** Define si P-1 es una pantalla o dos (roster más modal).
- **D-022 — el catálogo de roles.** Si desaparece Coordinación, P-2 pierde su segunda variante y P-7 se
  queda sin dueño. Si aparece Locuciones, hay un tipo de actividad más que representar.

**Conviene cerrar D-030 antes de empezar**, porque es la única que puede cambiar el alcance en un 50 %.

---

## 2. Arquitectura de información

Tres territorios que no se mezclan:

**Interno — trabajo.** Lo que usa un colaborador todos los días: sus actividades, el detalle y el
formulario. Es el territorio que tiene que funcionar con una mano y con mala señal.

**Interno — gobierno.** Supervisión, Burson, cuentas e importación. Se usa sentado, casi siempre en
escritorio, y puede permitirse tablas y filtros.

**Externo — AUNOR.** Una sola pantalla, de solo lectura, sin puertas hacia lo demás.

La consecuencia práctica es que **la navegación no es igual para todos**. Un colaborador de Grabación
ve dos destinos; administración ve seis. Eso ya venía decidido: el módulo Burson solo existe para
Coordinación y Supervisión (D-011).

### Destinos por rol

| Rol | Destinos |
|---|---|
| Grabación, Edición, Creatividad, Locución | Mis actividades · Perfil |
| Coordinación | Actividades · Burson · Perfil |
| Supervisión / Administración | Supervisión · Historial · Burson · Cuentas · Histórico · Perfil |
| AUNOR | Ninguno. Una sola pantalla |
| Burson | Ninguno. Solo su tablero, y solo lectura (D-052) |

En Coordinación el destino se llama **Actividades**, no «Mis actividades», porque con D-016 ve las de
todo el equipo. Es la misma pantalla P-2 con otro alcance: muestra actividades ajenas, así que necesita
decir de quién es cada una, cosa que en el resto de los roles sobra.

«Perfil» es el destino mínimo donde vive cerrar sesión y poco más. No es una pantalla de la concepción
porque no aporta función de negocio, pero tiene que existir para poder salir de la aplicación.

---

## 3. Navegación

**Barra inferior fija** con los destinos del rol (D-017), siempre visible. En escritorio pasa a un
lateral y el contenido gana el ancho para las tablas de supervisión y de Burson.

Tiene entre dos y cinco entradas según quién entre, así que no se diseña una barra de contenido fijo.

Dos consecuencias que los wireframes deben respetar:

- Los formularios largos no pueden dejar el último campo ni el botón de guardar debajo de la barra.
- El acceso (P-1) y la vista de AUNOR (P-6) no llevan barra: no tienen a dónde navegar.

---

## 4. Patrones transversales

Se diseñan **una vez** y se reutilizan en todas las pantallas. Que estén aquí y no repartidos evita que
cada pantalla invente su propia versión.

**Vacío.** Toda lista puede estar vacía. Un vacío dice qué falta y ofrece la acción que lo resuelve, no
solo «no hay datos». El vacío de «Mis actividades» es la primera pantalla que verá un colaborador el
primer día, así que es parte de la bienvenida.

**Carga.** Nunca una pantalla en blanco: la silueta de lo que va a llegar, para que la persona sepa que
no se rompió.

**Error.** Dice qué pasó y qué puede hacerse. Nunca un código técnico. El error de red es el más
frecuente y el más importante: no es un fallo del usuario y no debe hacerle perder lo escrito.

**Borrador local.** Mientras se llena un formulario, lo escrito se guarda en el teléfono. La pantalla
tiene que distinguir con claridad tres situaciones, porque la persona necesita saber si puede irse:

| Situación | Qué ve |
|---|---|
| Guardado en el teléfono, aún no enviado | Aviso persistente, no un mensaje que se desvanece |
| Enviado y confirmado | Confirmación clara |
| Falló el envío | El texto sigue ahí, con un botón de reintentar |

**Acciones según rol y estado.** Una acción que la persona no puede ejecutar **no se muestra**, no se
muestra desactivada. Un colaborador no debe ver nunca un botón de aprobar, ni siquiera gris.

**Obligaciones heredadas de las decisiones** (concepción §12), que no son opinables al diseñar:

1. El detalle muestra cuándo se modificó por última vez (D-007).
2. El panel de supervisión destaca las observaciones respondidas y pendientes de cerrar (D-015).
3. La navegación cambia según el rol (D-011).

---

## 5. Qué falta en esta fase

1. **Dirección visual** — dos propuestas comparables que Marco pueda abrir en su celular. Encargo
   `docs/encargos/E-001-direccion-visual.md`.
2. **Wireframes** de las nueve pantallas en la dirección elegida, en móvil y en escritorio.
3. **Sistema de diseño**, que se congela en `docs/sistema-diseno.md` cuando Marco lo apruebe.
