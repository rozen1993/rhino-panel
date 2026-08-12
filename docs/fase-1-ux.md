# Fase 1 — UX y desarrollo visual

Cómo se verá y cómo se usará el producto descrito en `docs/fase-0-concepcion.md`.

Esta fase produce **diseño, no código de producto**: no se instala nada, no se andamia la aplicación y
no se conecta ningún backend. Mobile-first: el caso que manda es una persona en vía, con el teléfono en
una mano.

**Puerta de salida:** Marco aprueba la dirección visual y entiende todos los recorridos principales
desde las pantallas.

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
| P-9 | Importación del histórico | Administración |

P-6 vive en una interfaz aparte. No comparte navegación, ni cabecera, ni menú con el resto: AUNOR no
debe ver siquiera que existe una aplicación interna detrás.

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
| Grabación, Edición, Operación, Creatividad | Mis actividades · Perfil |
| Coordinación | Mis actividades · Burson · Perfil *(pendiente de D-016)* |
| Supervisión / Administración | Supervisión · Burson · Cuentas · Importar · Perfil |
| AUNOR | Ninguno. Una sola pantalla |

«Perfil» es el destino mínimo donde vive cerrar sesión y poco más. No es una pantalla de la concepción
porque no aporta función de negocio, pero tiene que existir para poder salir de la aplicación.

---

## 3. Navegación

Pendiente de **D-017**. La propuesta es una **barra inferior fija** con los destinos del rol, porque
todos los roles tienen entre dos y cinco, todos caben, y en móvil el borde inferior es lo único que el
pulgar alcanza sin recolocar el teléfono.

En escritorio esa misma barra pasa a un lateral, y el contenido gana el ancho para las tablas de
supervisión y de Burson.

El acceso (P-1) y la vista de AUNOR (P-6) no tienen navegación de ningún tipo.

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

- Resolver D-016 y D-017.
- Dirección visual: dos propuestas comparables, en una página que Marco pueda abrir en su celular.
- Wireframes de las nueve pantallas en la dirección elegida, en móvil y en escritorio.
- Sistema de diseño, que se congela en `docs/sistema-diseno.md` cuando Marco lo apruebe.
