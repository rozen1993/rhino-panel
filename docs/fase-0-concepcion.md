# Fase 0 — Concepción funcional

Qué producto debe existir, antes de diseñarlo. Este documento describe comportamiento, no técnica: no
define tablas, RLS, migraciones, Auth ni arquitectura de base de datos.

Se apoya en `CLAUDE.md` (qué se construye) y en las decisiones cerradas de `docs/decisiones.md`.

**Puerta de salida:** el producto puede explicarse pantalla por pantalla y recorrido por recorrido sin
depender de decisiones técnicas de backend.

---

## 1. Alcance

### Dentro

- Registro y administración de los cinco tipos de actividad para AUNOR.
- Seguimiento del avance y del estado de cada actividad, con autor y fecha en cada cambio.
- Supervisión: observar, responder, resolver y aprobar, con trazabilidad.
- Vista mensual de solo lectura para AUNOR, separada de la interfaz interna.
- Módulo de seguimiento de Burson.
- Migración del histórico en Excel, trazable y reversible.
- Cuentas individuales por rol, desactivables.
- Uso cómodo desde celular, con protección del formulario ante mala señal.

### Fuera

- Aplicación móvil para Play Store (proyecto posterior).
- API pública y PWA completa.
- Modo offline completo: solo se protege el formulario en curso.
- Mapas. La ubicación se registra como datos, no se dibuja.
- Facturación, control de horas, inventario de equipos y cualquier función que no esté en `CLAUDE.md`.

---

## 2. Roles y qué necesita cada uno

Los perfiles son roles; una persona ocupa uno o varios (D-001).

| Rol | Lo que necesita hacer |
|---|---|
| Grabación | Registrar coberturas y grabaciones desde el campo, casi siempre en celular y con señal irregular. Necesita que llenar la actividad sea rápido y que la ubicación no cueste. |
| Edición | Recibir lo grabado, mover el avance de la postproducción y dejar el enlace al material terminado. Trabaja sobre todo en escritorio. |
| Coordinación | Programar y asignar actividades, y ver que lo comprometido avanza. |
| Operación | Registrar operaciones en vía, con ubicación obligatoria. |
| Creatividad | Registrar producción y desarrollo creativo, sin ubicación en la mayoría de los casos. |
| Supervisión / Administración | Ver todo, observar, responder, resolver, aprobar, administrar cuentas e importar el histórico. |
| AUNOR | Consultar el mes, solo lectura, sin ver nada interno. |

Un rol de trabajo ve únicamente las actividades de las que es responsable (D-003). Supervisión y
administración ven todo.

Que los cinco roles de trabajo coincidan en nombre con los cinco tipos de actividad no significa que
un rol solo pueda registrar su tipo homónimo; eso queda sin decidir y no urge (ver D-001).

---

## 3. Tipos de actividad y campos

Cinco tipos: **Grabación, Edición, Coordinación, Operación, Creatividad**. Comparten la misma ficha; lo
que cambia entre ellos es qué campos son obligatorios.

### Campos comunes

| Campo | Qué es | Obligatorio |
|---|---|---|
| fecha | Día en que ocurre o está prevista la actividad | Sí |
| tipo | Uno de los cinco | Sí |
| título | Nombre corto y reconocible | Sí |
| responsable | Persona a cargo de ejecutarla | Sí |
| descripción | Qué hay que hacer o qué se hizo | No |
| estado | Uno de los siete (§5) | Sí, con valor inicial |
| avance | 0 a 100 | Sí, empieza en 0 |
| fecha prevista de entrega | Compromiso | No |
| fecha real de entrega | Cuándo se entregó de verdad | No hasta entregar |
| enlace al material | Dónde está lo producido | No (ver D-008) |
| notas | Texto libre interno | No |
| ubicación | §4 | Según tipo |

Además, y aunque el usuario no las escriba, la actividad guarda **quién la creó** y **quién es
responsable** por separado, porque con creación mixta pueden ser personas distintas (D-002).

### Obligatoriedad por tipo

| Tipo | `ubicacion_nombre` |
|---|---|
| Grabación | Obligatoria |
| Operación | Obligatoria |
| Edición | Opcional |
| Coordinación | Opcional |
| Creatividad | Opcional |

---

## 4. Ubicación

Dato importante, sobre todo para grabación y operación. Se registra como texto y números, no en un
mapa.

| Campo | Qué es |
|---|---|
| `ubicacion_nombre` | Nombre del lugar, tal como lo diría el equipo |
| `ubicacion_referencia` | Referencia que ayuda a encontrarlo |
| `kilometro` | Kilómetro de la vía |
| `sentido` | Sentido de la calzada |
| `latitud` | Coordenada, opcional |
| `longitud` | Coordenada, opcional |

Desde el celular, escribir seis campos en campo abierto es demasiado. La concepción asume que el
formulario pide `ubicacion_nombre` de forma prominente y deja el resto plegado o secundario, y que las
coordenadas nunca son obligatorias.

---

## 5. Estados, vistos por el usuario

Siete estados. Descritos aquí por lo que significan para la persona, no por cómo se implementan.

| Estado | Qué significa |
|---|---|
| Programada | Está comprometida pero aún no empezó |
| En proceso | Se está trabajando |
| Por subir | El trabajo está hecho, falta dejar el material disponible |
| Entregada | El colaborador declara que terminó y lo entregó |
| Observada | Supervisión encontró algo que corregir; la actividad está detenida esperando al colaborador |
| Aprobada | Supervisión dio el trabajo por bueno. Es el final |
| Cancelada | No se hará. No es un fracaso ni un error: es una salida válida |

### Reglas

- Un colaborador puede avanzar como máximo hasta **Entregada**. No puede observar ni aprobar.
- Solo supervisión/administración puede **observar** y **aprobar**.
- Solo se puede observar desde **En proceso**, **Por subir** o **Entregada**.
- Al observar, el sistema recuerda el estado anterior. Al resolver la observación, la actividad vuelve
  **exactamente** a ese estado, no a uno por defecto.
- Solo una actividad **Entregada** y **sin observaciones abiertas** puede pasar a **Aprobada**.
- Una actividad **Aprobada no puede cancelarse**.
- Dar de baja **no borra** el registro: deja de mostrarse donde corresponda, pero sigue existiendo.
- Cada cambio de estado registra **quién** y **cuándo**.

Los tres recorridos que el sistema debe soportar sin ambigüedad:

```
En proceso  -> Observada -> En proceso
Por subir   -> Observada -> Por subir
Entregada   -> Observada -> Entregada -> Aprobada
```

---

## 6. Recorridos principales

**R-1 · El colaborador registra una actividad desde el campo.**
Entra desde el celular, ve sus actividades, crea una nueva, elige tipo, pone fecha y título, llena la
ubicación si el tipo la exige, y guarda. Si no hay señal, el borrador queda en el teléfono y la
pantalla dice claramente que todavía no llegó al servidor. Cuando vuelve la señal, se reintenta. Si
toca guardar dos veces, se registra **una sola** actividad.

**R-2 · El colaborador avanza su trabajo.**
Abre una actividad suya, sube el avance, cambia el estado hasta Entregada como máximo, y deja el
enlace al material. Cada cambio queda con su nombre y su fecha.

**R-3 · Coordinación programa y asigna.**
Crea una actividad, elige tipo y fecha, y designa como responsable a otra persona. Queda Programada.
El responsable la ve entre las suyas aunque no la haya creado él.

**R-4 · Supervisión observa.**
Revisa una actividad En proceso, Por subir o Entregada, escribe qué está mal y la deja Observada. El
sistema recuerda de dónde venía. El responsable ve que tiene una observación esperándolo.

**R-5 · El colaborador responde y se resuelve.**
Lee la observación, responde y corrige. Al resolverse, la actividad vuelve exactamente al estado que
tenía antes de ser observada.

**R-6 · Supervisión aprueba.**
Una actividad Entregada y sin observaciones abiertas pasa a Aprobada. Es el final del ciclo y ya no
puede cancelarse.

**R-7 · AUNOR consulta el mes.**
Entra con su cuenta, elige el mes y ve cuándo se actualizó por última vez, los totales por grupo de
estado y la lista de actividades con fecha, tipo, título, ubicación y estado. No ve nada más.

**R-8 · Administración gestiona cuentas.**
Crea una cuenta, le asigna rol y la desactiva cuando alguien deja de participar. Una cuenta desactivada
no entra, y el trabajo que registró no se pierde.

**R-9 · Administración importa el histórico.**
Carga el Excel, ve primero una simulación de lo que pasaría, revisa qué filas entrarían y cuáles se
rechazan y por qué, y solo entonces confirma. Si el lote salió mal, lo anula sin perder el rastro de
que existió.

**R-10 · Se cancela o se da de baja.**
Una actividad que no se hará se cancela, salvo que ya esté Aprobada. Dar de baja retira el registro de
la vista sin borrarlo.

---

## 7. Pantallas y qué muestra cada una

**P-1 · Acceso.** Entrada con cuenta individual. Mensaje claro cuando las credenciales no sirven o la
cuenta está desactivada, sin revelar cuál de las dos cosas ocurre.

**P-2 · Mis actividades** (rol de trabajo, pantalla de inicio). Lista de las actividades de las que la
persona es responsable, pensada para el pulgar. Por actividad: fecha, tipo, título, estado y avance.
Debe destacar lo que requiere acción, en especial lo Observado. Botón de crear siempre alcanzable.
Incluye estados vacío, de carga y de error.

**P-3 · Detalle de actividad.** Toda la ficha, la ubicación cuando existe, el enlace al material, el
historial de cambios de estado con autor y fecha, y las observaciones con sus respuestas. Las acciones
disponibles dependen del rol y del estado: un colaborador nunca ve un botón de aprobar.

**P-4 · Formulario de actividad** (crear y editar). Mobile-first. Pide primero lo obligatorio; el resto
queda accesible pero no estorba. La ubicación aparece según el tipo. Guarda borrador local mientras se
llena, avisa si el envío aún no llegó al servidor y permite reintentar.

**P-5 · Panel de supervisión.** Todas las actividades, con filtros por mes, tipo, estado y responsable.
Debe dejar ver de un vistazo qué espera acción de supervisión y qué está detenido esperando a un
colaborador.

**P-6 · Vista mensual de AUNOR.** §8.

**P-7 · Módulo Burson.** Pendiente de D-005.

**P-8 · Administración de cuentas.** Alta, asignación de rol, desactivación y reactivación.

**P-9 · Importación del histórico.** Carga del archivo, simulación previa, resultado separado en
cargadas y rechazadas con motivo, y anulación de lote.

---

## 8. AUNOR

Vista propia, separada de la interfaz interna, de solo lectura y organizada por mes.

Muestra, como mínimo:

- última actualización;
- totales por estado, agrupados;
- las actividades con fecha, tipo, título, ubicación y estado.

Agrupación visible:

| Estado interno | AUNOR ve |
|---|---|
| Programada | Programada |
| En proceso, Por subir, Observada | En trabajo |
| Entregada | Entregada |
| Aprobada | Aprobada |
| Cancelada | Cancelada |

Que *Observada* se muestre como *En trabajo* es deliberado: AUNOR debe saber que algo sigue en curso,
no que hubo una observación interna.

**AUNOR nunca recibe** observaciones internas, respuestas internas, pendientes internos, actividades
dadas de baja, registros técnicos ni campos no autorizados. La separación tiene que existir también en
el servidor, no solo en la pantalla: no basta con no dibujar un campo si el dato viajó igual.

---

## 9. Burson

Pendiente de D-005. El módulo existe y sus campos están fijados en `CLAUDE.md` —solicitud o comisión,
fecha, responsable, material solicitado, estado, pendientes de Rhino, pendientes de Burson, fechas de
entrega y aprobación, comentarios—, pero su alcance depende de si Burson entra o no al sistema.

Esta sección se completa cuando Marco resuelva esa entrada de la cola.

---

## 10. Celular y mala señal

La plataforma es mobile-first: el caso difícil es una persona en vía, con el teléfono en una mano y
señal intermitente.

Mientras se llena un formulario:

- el borrador se guarda en el teléfono a medida que se escribe;
- sobrevive a que se caiga la conexión o se recargue la página;
- la pantalla dice con claridad si lo escrito **todavía no llegó al servidor**;
- se puede reintentar el envío;
- cada envío lleva una llave que lo identifica, de modo que reintentar no crea un duplicado;
- el servidor rechaza el duplicado aunque el mismo envío llegue dos veces.

No se construye modo offline completo: se protege el formulario en curso, no toda la aplicación.

---

## 11. Criterios de aceptación funcionales

Comprobables sin conocer la implementación.

1. Se puede registrar una actividad de cada uno de los cinco tipos.
2. Grabación y Operación no se pueden guardar sin `ubicacion_nombre`; los otros tres sí.
3. Un colaborador solo ve actividades de las que es responsable, y no alcanza las de otro ni
   escribiendo su dirección directa.
4. Un colaborador no puede llevar una actividad más allá de Entregada.
5. Un colaborador no puede observar ni aprobar, ni ve esas acciones.
6. Observar solo es posible desde En proceso, Por subir o Entregada.
7. Resolver una observación devuelve la actividad exactamente al estado previo, en los tres recorridos
   de §5.
8. Aprobar solo es posible desde Entregada y sin observaciones abiertas.
9. Una actividad Aprobada no puede cancelarse.
10. Dar de baja retira el registro de la vista sin borrarlo.
11. Cada cambio de estado queda con autor y fecha, y puede verse en el detalle.
12. Coordinación puede crear una actividad para otra persona, y esa persona la ve entre las suyas.
13. AUNOR ve el mes con última actualización, totales agrupados y la lista con fecha, tipo, título,
    ubicación y estado.
14. AUNOR no recibe observaciones, respuestas, pendientes internos, actividades dadas de baja ni campos
    no autorizados, tampoco en la respuesta del servidor.
15. Un formulario a medio llenar sobrevive a una recarga y a una pérdida de conexión.
16. Enviar dos veces el mismo formulario crea una sola actividad.
17. La pantalla distingue lo guardado en el teléfono de lo confirmado por el servidor.
18. Una cuenta desactivada no puede entrar.
19. La importación permite simular antes de confirmar, separa cargadas de rechazadas con motivo, y
    permite anular un lote sin borrar su historial.
20. Los recorridos R-1 a R-10 se completan en celular sin quedar bloqueados.

---

## 12. Lo que esta fase deja abierto a propósito

- **D-005** — si Burson entra al sistema (§9).
- **D-006** — columnas reales del Excel histórico.
- **D-007 a D-010** — detalles de la máquina de estados y de edición que afectan a las pantallas, en
  `docs/decisiones-pendientes.md`.

Nada de esto impide explicar el producto pantalla por pantalla, que es lo que pide la puerta de salida.
