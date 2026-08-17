# Fase 0 — Concepción funcional

Qué producto debe existir, antes de diseñarlo. Este documento describe comportamiento, no técnica: no
define tablas, RLS, migraciones, Auth ni arquitectura de base de datos.

Se apoya en `CLAUDE.md` (qué se construye) y en las decisiones cerradas de `docs/decisiones.md`.

**Puerta de salida:** el producto puede explicarse pantalla por pantalla y recorrido por recorrido sin
depender de decisiones técnicas de backend.

> ## ⚠ Reabierta el 2026-08-17
>
> Esta fase se cerró el 2026-08-12 y **Marco la reabrió el 2026-08-17**, tras recibir el cliente una
> versión 2 completa del requerimiento con mockups de referencia.
>
> **Este documento sigue siendo la descripción vigente del producto**, pero varias de sus secciones
> están **en revisión** y llevan un aviso al principio. Una sección en revisión no está derogada: sigue
> siendo lo acordado, pero **no se construye encima de ella** hasta que Marco resuelva la decisión
> pendiente que la afecta.
>
> - Qué cambió y por qué: `docs/impacto-requerimiento-v2.md`
> - Las veintidós decisiones abiertas (D-019 a D-040): `docs/decisiones-pendientes.md`
> - El incidente que lo originó: `docs/incidentes.md` → INC-001
> - Fuente: `actualizacion_del_requerimiento/` — ficha v2 en PDF y tres mockups
>
> **Marco cerró cuatro decisiones el 2026-08-17** y con ellas §5, §8, §10 y §11 dejaron de estar en
> revisión: la plataforma es un **sistema de supervisión** con los siete estados intactos (D-019); el
> material va **por enlace** y no se suben archivos (D-023); y **AUNOR puede dejar su opinión**, sin que
> eso mande sobre los operarios (D-033).
>
> Siguen en revisión: **§2** (roles), **§3** (campos), **§4** (ubicación), **§7** (pantallas) y **§9**
> (Burson, solo permisos). Todo lo que queda depende de saber **quién es quién en el equipo** — D-020,
> D-021 y D-022.

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
- *(requerimiento v2)* Historial mensual en tabla, con buscador, filtro y paginación.
- *(requerimiento v2)* Exportar un reporte mensual — formato, contenido y permisos por decidir (D-037).
- *(requerimiento v2)* Enlace directo a la carpeta de OneDrive del material de cada actividad.
- *(requerimiento v2)* Línea gráfica alineada a la identidad visual de AUNOR (aunor.pe), bajo el nombre
  correcto **Rhino Audiovisuales** — los mockups del cliente usan «Midnight & RAS Audiovisuales», que es
  un error suyo y no debe llegar al producto.

### Fuera

- Aplicación móvil para Play Store (proyecto posterior).
- API pública y PWA completa.
- Modo offline completo: solo se protege el formulario en curso.
- Mapas. La ubicación se registra como datos, no se dibuja.
- Facturación, control de horas, inventario de equipos y cualquier función que no esté en `CLAUDE.md`.

**Sin clasificar todavía:** el requerimiento v2 promete «un seguimiento autónomo y **en tiempo real**».
Si eso significa «actualizado al día», no cuesta nada y ya está dentro. Si significa que la pantalla se
refresca sola cuando otro escribe, es infraestructura de realtime, que `CLAUDE.md` prohíbe añadir sin
necesidad demostrada. Ver D-038.

---

## 2. Roles y qué necesita cada uno

> **EN REVISIÓN — D-020, D-021, D-022, D-034.** El requerimiento v2 cambia el rol de casi todo el
> equipo, introduce **Locuciones**, puede dejar sin titular a Operación y a Coordinación, y añade un
> actor nuevo, **Lenin**, que administra los permisos de OneDrive desde fuera de la plataforma. La tabla
> de abajo describe el reparto acordado en agosto, no necesariamente el real.
>
> **Confirmado y nuevo:** las personas tienen **sede** (Chimbote, Lima). Quién está en cuál es parte de
> D-021.

Los perfiles son roles; una persona ocupa uno o varios (D-001).

**Colaborador** es el término que este documento usa —siguiendo a `CLAUDE.md`— para cualquier persona
con un **rol de trabajo**: Grabación, Edición, Coordinación, Operación o Creatividad. Es quien ejecuta
y registra actividades. Los otros dos grupos son **Supervisión / Administración**, que revisa y
aprueba, y **AUNOR**, que solo consulta.

Coordinación es un rol de trabajo, no supervisión: quien coordina es un colaborador más, aunque además
pueda programar actividades para otros. Una misma persona puede tener rol de trabajo y de supervisión a
la vez, y entonces tiene las dos capacidades.

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

> **EN REVISIÓN — D-022, D-027, D-028.** El requerimiento v2 añade **tipo de servicio** (foto, vídeo)
> como eje que puede convivir con los cinco tipos o reemplazarlos (D-027), y deja abierto para qué
> perfiles aplica el **avance** (D-028).
>
> **Ya resuelto (D-023):** el «enlace al material» es **el enlace a la carpeta de OneDrive** con las
> fotos y vídeos de esa actividad. La plataforma **no recibe archivos adjuntos**.
>
> **Precisión que corrige una lectura fácil:** el requerimiento v2 **no elimina el avance ni la fecha
> prevista de entrega**. Los conserva expresamente para Eduardo. Solo faltan en el formulario del
> mockup, que es el panel de Johann. Los campos que la ficha lista son, en sus propias palabras,
> **mínimos**.
>
> **Confirmado y nuevo:** la descripción tiene un **límite de caracteres** (la ficha propone 500 como
> ejemplo, no como valor cerrado).

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
| avance | 0 a 100, se escribe a mano | Sí, empieza en 0; debe ser 100 para entregar |
| fecha prevista de entrega | Compromiso | No |
| fecha real de entrega | Cuándo se entregó de verdad | No hasta entregar |
| enlace al material | Dónde está lo producido | Al entregar, según tipo |
| notas | Texto libre interno | No |
| ubicación | §4 | Según tipo |

Además, y aunque el usuario no las escriba, la actividad guarda **quién la creó** y **quién es
responsable** por separado, porque con creación mixta pueden ser personas distintas (D-002).

### Obligatoriedad por tipo

| Tipo | `ubicacion_nombre` | Enlace al material para entregar |
|---|---|---|
| Grabación | Obligatoria | Obligatorio |
| Operación | Obligatoria | Opcional |
| Edición | Opcional | Obligatorio |
| Coordinación | Opcional | Opcional |
| Creatividad | Opcional | Obligatorio |

La ubicación se exige **al guardar**. El enlace se exige **al pasar a Entregada**, no antes: nadie
tiene el enlace cuando registra una grabación que todavía no ha hecho (D-008).

---

## 4. Ubicación

> **EN REVISIÓN — D-029.** Los mockups muestran un único campo **Lugar**, con valores como «Chimbote» o
> «Plaza de Armas». Lo descrito abajo —`ubicacion_nombre` prominente y el resto plegado y opcional— ya
> es una posición intermedia entre los seis campos y el campo único, y sigue siendo una opción válida.

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

> **CONFIRMADA el 2026-08-17 — D-019.** Marco decidió que la plataforma es un **sistema de supervisión**
> y no una bitácora: **esta sección entera sigue vigente sin cambios**, con sus siete estados, su ciclo
> de observación y los tres recorridos de ida y vuelta.
>
> Se mantienen «Por subir» y «Cancelada» **aunque no aparezcan en ningún mockup del cliente**, y se
> descartan los modelos de dos y tres estados que circulaban.
>
> **Queda una tarea de diseño, no de modelo:** los mockups muestran tres etiquetas y el sistema tiene
> siete. La Fase 1 tiene que presentarlas sin que la pantalla pese más que la que el cliente vio. Y
> conviene enseñarle el ciclo de observación antes de construirlo: **no lo ha visto en ningún mockup**,
> y es el corazón del producto.

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
- **Cancelar es exclusivo de supervisión** (D-009). Un colaborador no cancela ni siquiera una actividad
  suya que nunca empezó: avisa por fuera del sistema.
- Una actividad **Aprobada no puede cancelarse**.
- Dar de baja **no borra** el registro: deja de mostrarse donde corresponda, pero sigue existiendo.
- Cada cambio de estado registra **quién** y **cuándo**.
- **Pasar a Entregada exige avance 100** y enlace al material en Grabación, Edición y Creatividad
  (D-008, D-010). Si falta algo, la pantalla dice qué falta; no falla en silencio.
- **El responsable puede editar su actividad hasta que se apruebe** (D-007), incluso después de
  entregarla. A cambio, el detalle debe mostrar cuándo se modificó por última vez, para que supervisión
  no apruebe a ciegas una ficha que cambió mientras la revisaba.
- **«Por subir» es obligatorio en Grabación, Edición y Creatividad**, y opcional en Coordinación y
  Operación (D-013). Los mismos tres tipos que deben dejar un enlace son los que tienen algo que subir.
- **El responsable puede retroceder mientras trabaja, pero no desde Entregada** (D-014). Ahí el control
  pasa a supervisión.
- **La observación la resuelve supervisión**, no el colaborador (D-015). El colaborador responde y
  corrige; supervisión lee y decide si queda cerrada.

### Quién mueve qué

| Desde | A | Quién |
|---|---|---|
| (nueva) | Programada | Responsable o coordinación |
| Programada | En proceso | Responsable |
| En proceso | Por subir | Responsable |
| Por subir | Entregada | Responsable, con avance 100 y enlace según tipo |
| En proceso | Entregada | Responsable, solo en Coordinación y Operación |
| En proceso · Por subir | estado anterior | Responsable |
| En proceso · Por subir · Entregada | Observada | Solo supervisión |
| Observada | el estado exacto previo | Solo supervisión, al resolver |
| Entregada | Aprobada | Solo supervisión, sin observaciones abiertas |
| Cualquiera salvo Aprobada | Cancelada | Solo supervisión |

Los tres recorridos de ida y vuelta que el sistema debe soportar sin ambigüedad:

```
En proceso  -> Observada -> En proceso
Por subir   -> Observada -> Por subir
Entregada   -> Observada -> Entregada -> Aprobada
```

Que la actividad vuelva al estado *exacto* es lo que hace que observar no sea un castigo: a quien le
observan algo que ya había subido, no se le devuelve al principio.

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

> **EN REVISIÓN — D-026, D-030, D-032, D-037, D-039.** El requerimiento v2 añade pantallas y elementos
> que abajo se recogen, y pone en duda el flujo de acceso. Además, **falta saber si el patrón de
> pantalla vale igual para todos los perfiles** (D-030): los tres mockups solo muestran el panel de
> Johann, y de esa respuesta depende cuántas pantallas hay que diseñar.

**P-1 · Acceso.** Entrada con cuenta individual. Mensaje claro cuando las credenciales no sirven o la
cuenta está desactivada, sin revelar cuál de las dos cosas ocurre.

> **EN REVISIÓN — D-026, D-039.** El requerimiento v2 propone en su lugar un **flujo en dos pasos**: una
> pantalla *roster* con una tarjeta por colaborador —foto, nombre, rol, sede, estado Activo, número de
> actividades y última actualización— y un modal donde la persona escribe solo su clave, con nombre y
> rol ya precargados, casilla «Recordar este equipo» y enlace «¿Olvidaste tu clave?».
>
> Ese flujo **contradice directamente el párrafo de arriba**: la pantalla roster no solo revela que la
> cuenta existe, sino quién trabaja aquí, quién está activo y cuánto ha hecho cada uno, todo antes de
> autenticar a nadie. Y reduce el acceso a un único secreto, sin usuario. Las opciones y su coste están
> en D-026. La recuperación de clave y la duración del «recordar» no existen todavía en el modelo
> (D-039).

**P-2 · Mis actividades** (rol de trabajo, pantalla de inicio). Lista de las actividades de las que la
persona es responsable, pensada para el pulgar. Por actividad: fecha, tipo, título, estado y avance.
Debe destacar lo que requiere acción, en especial lo Observado. Botón de crear siempre alcanzable.
Incluye estados vacío, de carga y de error.

> **Confirmado y nuevo (requerimiento v2):** la pantalla incorpora una **navegación por meses que
> muestra bajo cada mes cuántas actividades tiene** (ABR 6, MAY 8, JUN 10…), con el mes elegido
> resaltado, y un **selector de año**. Incorpora también **tarjetas de resumen por estado**, sobre los
> siete estados confirmados en D-019.

**P-10 · Historial mensual.** *(pantalla nueva, requerimiento v2)* El historial del mes en **tabla**,
con buscador, filtro por estado, paginación y **exportar reporte mensual**. Columnas: fecha, actividad
o proyecto, lugar, estado, **si tiene enlace al material o no**, y acciones.

> **El «contador de archivos» de los mockups no puede existir** (D-023): la plataforma no almacena
> archivos y no puede saber cuántos hay dentro de una carpeta ajena de OneDrive. Lo máximo que puede
> mostrar es si la actividad tiene enlace o no.

Por fila, dos acciones: **Ver**, que abre la carpeta de OneDrive del material de esa cobertura concreta
—no una vista genérica—; y **Editar**.

> **El botón «Descargar» de los mockups desaparece** (D-024): no hay nada que descargar desde la
> plataforma. Si se quiere conservar, es un segundo botón que hace lo mismo que «Ver» y debería llamarse
> «Abrir carpeta».

> El botón «Ver» introduce algo que la Fase 0 no contemplaba: **una dependencia externa que la
> plataforma no controla**. Si la persona no tiene permiso en esa carpeta de OneDrive, el enlace falla y
> la plataforma no puede arreglarlo — solo explicarlo bien. Hoy esos permisos los reparte Lenin a mano
> (D-025). El formato, el contenido y quién puede exportar están sin decidir (D-037), y un archivo
> exportado sale del sistema y de sus permisos.

**P-3 · Detalle de actividad.** Toda la ficha, la ubicación cuando existe, el enlace al material, el
historial de cambios de estado con autor y fecha, y las observaciones con sus respuestas. Las acciones
disponibles dependen del rol y del estado: un colaborador nunca ve un botón de aprobar.

**P-4 · Formulario de actividad** (crear y editar). Mobile-first. Pide primero lo obligatorio; el resto
queda accesible pero no estorba. La ubicación aparece según el tipo. Guarda borrador local mientras se
llena, avisa si el envío aún no llegó al servidor y permite reintentar.

**P-5 · Panel de supervisión.** Todas las actividades, con filtros por mes, tipo, estado y responsable.
Debe dejar ver de un vistazo qué espera acción de supervisión y qué está detenido esperando a un
colaborador. Como la observación solo la cierra supervisión (D-015), esta pantalla tiene que destacar
las **observaciones ya respondidas y pendientes de cerrar**: si no, las actividades se quedan detenidas
esperando a que alguien mire.

**P-6 · Vista mensual de AUNOR.** §8.

**P-7 · Módulo Burson.** §9. Tablero interno, separado del de actividades, que distingue lo que espera
a Rhino de lo que espera a Burson. Solo lo ven Coordinación y Supervisión, así que la navegación no es
idéntica para todos los colaboradores.

**P-8 · Administración de cuentas.** Alta, asignación de rol, desactivación y reactivación.

**P-9 · Importación del histórico.** Carga del archivo, simulación previa, resultado separado en
cargadas y rechazadas con motivo, y anulación de lote.

---

## 8. AUNOR

> **CAMBIADA el 2026-08-17 — D-033.** **AUNOR ya no solo lee: puede dejar su opinión.** El resto de esta
> sección sigue siendo válido, incluida la tabla de agrupación —los siete estados se mantienen (D-019)—
> y la lista de lo que AUNOR nunca recibe.
>
> Lo que cambia es que la vista deja de ser estrictamente de solo lectura: AUNOR **escribe comentarios**.
> El límite lo fija D-033 y es el que da sentido al producto: *Rhino usa la plataforma para controlar a
> sus operarios; de AUNOR se quiere su opinión.* Por eso el feedback del cliente **no cambia el estado
> de nada y no obliga a ningún operario**. Si merece corrección, es supervisión de Rhino quien lo
> convierte en observación interna.
>
> La mecánica —sobre qué se opina, quién lo ve y si el comentario tiene ciclo— está abierta en **D-041**.
> Y aparece trabajo que no estaba en el alcance: alguien de Rhino tiene que **enterarse de que AUNOR
> opinó**, o un comentario del cliente se queda sin respuesta y nadie lo nota.
>
> Sigue abierto quién es Lenin y de qué lado está (D-034).

Vista propia, separada de la interfaz interna y organizada por mes. **De solo lectura sobre las
actividades**: AUNOR no puede cambiar nada de ellas. Lo único que aporta es su propio feedback (D-033).

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

> **EN REVISIÓN, solo en dos puntos — D-035, D-022.** Los **campos** de esta sección coinciden
> exactamente con los del requerimiento v2 y no están en discusión; tampoco los estados propios (D-012
> sigue intacta).
>
> Lo que sí está en duda es: (a) si Burson participa directamente, porque la v2 llama a la plataforma
> «canal de comunicación […] entre el equipo, los colaboradores operativos, Autopista del Norte y
> **Burson**»; y (b) **quién mantiene el módulo** si desaparece el rol Coordinación, al que hoy se lo
> asigna D-011.

**Burson no entra al sistema** (D-005). El módulo es un tablero **interno de Rhino** para seguir lo que
se coordina con Burson en redes sociales, separado de las actividades para AUNOR.

Que sea interno cambia el significado de dos campos: los *pendientes de Burson* son una anotación de
Rhino sobre lo que está esperando del otro lado, no una declaración de Burson. Sirven para saber a
quién le toca mover la pelota, no para exigirle nada a nadie dentro del sistema.

### Qué registra cada entrada

| Campo | Qué es |
|---|---|
| solicitud o comisión | Qué pidió Burson |
| fecha | Cuándo se pidió |
| responsable | Quién de Rhino lo lleva |
| material solicitado | Qué hay que producir o entregar |
| estado | Solicitado · En proceso · Entregado · Aprobado · Cancelado |
| pendientes de Rhino | Lo que falta de nuestro lado |
| pendientes de Burson | Lo que estamos esperando del suyo |
| fecha de entrega | Cuándo se entregó |
| fecha de aprobación | Cuándo lo dieron por bueno |
| comentarios u observaciones | Texto libre |

### Estados propios

Una solicitud de Burson **no recorre los siete estados de una actividad** (D-012). Usa un conjunto
propio y corto: **Solicitado · En proceso · Entregado · Aprobado · Cancelado**. No hay «Por subir» ni
observación interna, porque un requerimiento de un tercero no se observa: se responde.

El sistema mantiene por tanto dos máquinas de estados distintas, que no se mezclan ni comparten
filtros.

### Quién lo lleva

Coordinación y Supervisión (D-011). El resto de los roles **no ve el módulo**, ni siquiera su entrada
en la navegación: la barra de navegación no es igual para todos los colaboradores.

### Pantalla

Una lista donde se vea de un golpe qué está esperando a Rhino y qué está esperando a Burson, porque esa
distinción es el motivo de existir del tablero. Cada entrada abre su ficha para editarla.

Es un módulo separado del de actividades: una solicitud de Burson no es una actividad de AUNOR y no
aparece en la vista mensual de AUNOR.

---

## 10. Celular y mala señal

> **CONFIRMADA el 2026-08-17 — D-023.** La plataforma **no recibe archivos**: el operario pega el enlace
> a la carpeta donde ya subió sus fotos y vídeos. Por tanto esta sección sigue vigente tal cual, escrita
> para un formulario de texto, que es lo único que se envía.
>
> Queda descartada la subida directa de hasta 50 MB que mostraban los mockups, y con ella desaparece el
> problema de subir un vídeo desde la berma.

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

> **RESTABLECIDOS el 2026-08-17.** Al confirmarse el modelo de siete estados (D-019), **los veintinueve
> criterios vuelven a ser válidos tal como están**, incluidos los quince que dependían de él.
>
> Falta **añadir** criterios para lo que el requerimiento v2 trae y ya está decidido: que el enlace al
> material sea obligatorio y lleve a la carpeta correcta, el historial en tabla con su exportación, y
> —lo más importante— que **el feedback de AUNOR no cambie el estado de ninguna actividad ni llegue al
> operario como una orden** (D-033).
>
> Los criterios del acceso en dos pasos esperan a D-026.

Comprobables sin conocer la implementación.

1. Se puede registrar una actividad de cada uno de los cinco tipos.
2. Grabación y Operación no se pueden guardar sin `ubicacion_nombre`; los otros tres sí.
3. Un colaborador solo ve actividades de las que es responsable, y no alcanza las de otro ni
   escribiendo su dirección directa.
4. Un colaborador no puede llevar una actividad más allá de Entregada.
5. Un colaborador no puede observar, aprobar ni cancelar, ni ve esas acciones.
6. Observar solo es posible desde En proceso, Por subir o Entregada.
7. Resolver una observación devuelve la actividad exactamente al estado previo, en los tres recorridos
   de §5.
8. Aprobar solo es posible desde Entregada y sin observaciones abiertas.
9. Una actividad Aprobada no puede cancelarse, ni por supervisión.
10. Dar de baja retira el registro de la vista sin borrarlo.
11. Cada cambio de estado queda con autor y fecha, y puede verse en el detalle.
12. No se puede pasar a Entregada con avance menor que 100, y la pantalla explica por qué.
13. No se puede pasar a Entregada sin enlace al material en Grabación, Edición y Creatividad; en
    Coordinación y Operación sí se puede.
14. El responsable puede editar su actividad después de entregarla y hasta que se apruebe, y el detalle
    muestra cuándo se modificó por última vez.
15. Coordinación puede crear una actividad para otra persona, y esa persona la ve entre las suyas.
16. AUNOR ve el mes con última actualización, totales agrupados y la lista con fecha, tipo, título,
    ubicación y estado.
17. AUNOR no recibe observaciones, respuestas, pendientes internos, actividades dadas de baja ni campos
    no autorizados, tampoco en la respuesta del servidor.
18. Una entrada de Burson no aparece nunca en la vista de AUNOR.
19. Una solicitud de Burson usa sus cinco estados propios y no los siete de una actividad.
20. Un colaborador que no sea de Coordinación ni de Supervisión no ve el módulo Burson, ni su entrada
    en la navegación, ni alcanza sus datos escribiendo la dirección directa.
21. Grabación, Edición y Creatividad no pueden pasar de En proceso a Entregada sin atravesar Por subir;
    Coordinación y Operación sí pueden.
22. El responsable puede volver de Por subir a En proceso, y no puede retroceder desde Entregada.
23. Un colaborador no puede cerrar una observación, ni siquiera respondiéndola; solo supervisión la
    resuelve.
24. Un formulario a medio llenar sobrevive a una recarga y a una pérdida de conexión.
25. Enviar dos veces el mismo formulario crea una sola actividad.
26. La pantalla distingue lo guardado en el teléfono de lo confirmado por el servidor.
27. Una cuenta desactivada no puede entrar.
28. La importación permite simular antes de confirmar, separa cargadas de rechazadas con motivo, y
    permite anular un lote sin borrar su historial.
29. Los recorridos R-1 a R-10 se completan en celular sin quedar bloqueados.

---

## 12. Lo que esta fase deja abierto

**Hasta el 2026-08-16** quedaba abierta una sola entrada: **D-006**, las columnas reales del Excel
histórico, que no condiciona ninguna pantalla sino la Fase 7. Las otras dieciséis decisiones estaban
cerradas en `docs/decisiones.md` e incorporadas a este documento.

**Desde el 2026-08-17**, el requerimiento v2 abre **veintidós decisiones más** (D-019 a D-040) y deja
**once de las cerradas en revisión**. Todas están en `docs/decisiones-pendientes.md`, que además dice
cuáles puede resolver Marco por su cuenta y cuáles necesitan respuesta del cliente.

D-006 gana urgencia: el requerimiento v2 añade campos que el histórico probablemente no tiene —enlace de
OneDrive por fila, tipo de servicio, sede—, así que sin ver el Excel no se sabe qué puede migrarse
(D-040).

### Lo que la Fase 1 hereda como obligación de diseño

> **EN REVISIÓN.** Las tres obligaciones de abajo se derivan de D-007, D-015 y D-011, y **las tres
> decisiones están en revisión**. Siguen siendo lo acordado, pero no se diseña contra ellas hasta
> resolver D-019 y D-022.

Tres consecuencias de las decisiones tomadas no son opinables al diseñar:

1. El detalle de la actividad muestra **cuándo se modificó por última vez** (D-007), o supervisión
   aprueba a ciegas fichas que cambiaron mientras las revisaba.
2. El panel de supervisión destaca las **observaciones respondidas y pendientes de cerrar** (D-015), o
   las actividades se quedan detenidas sin que nadie lo note.
3. La navegación **no es idéntica para todos los colaboradores**: el módulo Burson solo existe para
   Coordinación y Supervisión (D-011).

A esas tres, el requerimiento v2 añade una cuarta que sí es firme:

4. La línea gráfica se alinea a la identidad visual de **AUNOR** (aunor.pe) y usa el nombre **Rhino
   Audiovisuales**. Esto es lo que suspende D-018: las ocho direcciones se produjeron sin esta
   restricción.
