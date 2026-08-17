# Decisiones

Decisiones de producto y arquitectura que deben sobrevivir al chat. Una decisión aquí solo cambia si
Marco la cambia expresamente, y el cambio se escribe en este archivo.

Cerradas: **dieciséis** — D-001 a D-005 y D-007 a D-017. D-006 nunca se cerró; su entrada es un
marcador que apunta a la cola de pendientes.

> ## Estado de la revisión abierta el 2026-08-17
>
> El requerimiento v2 del cliente dejó once decisiones en revisión. **Marco resolvió D-019, D-023,
> D-024 y D-033 el 2026-08-17**, y con ello **siete salieron de revisión**.
>
> **Siguen en revisión: D-001, D-005, D-011, D-016** — todas por el catálogo de roles y por si Burson
> participa. Las resuelven D-020, D-021, D-022 y D-035.
>
> **Salieron de revisión:** D-007, D-008, D-009, D-010, D-013, D-014, D-015 — al confirmarse que la
> plataforma es un sistema de supervisión con ciclo de observación (D-019) y que el material va por
> enlace (D-023).
>
> **Intactas todo el tiempo:** D-002, D-003, D-004, D-012, D-017.
>
> Contexto: `docs/impacto-requerimiento-v2.md` · Pendientes: `docs/decisiones-pendientes.md`

---

## D-001 — Los perfiles son roles, no personas

**Fecha:** 2026-08-11 · **Fase:** 0 · **Decide:** Marco

> **EN REVISIÓN (2026-08-17) — la resuelve D-022.** Lo que está en duda es el **catálogo de roles**: el
> requerimiento v2 introduce «Locuciones», y puede dejar sin titular a Operación y a Coordinación. El
> **principio** de esta decisión —se modelan roles, no personas— no está en discusión y sobrevive
> cualquiera que sea el catálogo.

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

> **Intacta.** El formulario del mockup no muestra campo «responsable», pero eso **no elimina esta
> decisión**: es el panel personal de Johann, donde el responsable es obvio, y la ficha v2 llama
> «mínimos» a los campos que lista. Solo cambia el nombre del actor si Coordinación desaparece del
> catálogo (D-022); la regla de fondo —creador y responsable son datos distintos— no está en discusión.

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

> **Intacta, con dos preguntas colgando.** El requerimiento v2 no contradice que AUNOR tenga cuenta
> individual. Queda por decidir **por dónde entra** —¿aparece en la pantalla roster junto al equipo
> interno, o por una puerta separada? (D-026)— y **qué puede hacer una vez dentro**, porque la v2 habla
> de «vista de supervisión» y no de consulta de solo lectura (D-033).

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

> **EN REVISIÓN (2026-08-17) — la resuelve D-035.** El requerimiento v2 describe la plataforma como
> «canal de comunicación […] entre el equipo, los colaboradores operativos, Autopista del Norte y
> **Burson**». Esa frase admite leer que Burson participa directamente, que es justo lo que esta
> decisión descarta.

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

> **Confirmada el 2026-08-17 por D-019.** El estado Aprobada se mantiene, así que la frontera de esta
> decisión sigue existiendo tal cual.

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

> **Confirmada y precisada el 2026-08-17 por D-019 y D-023.** El estado Entregada se mantiene, y el
> «enlace al material» queda definido como **el enlace a la carpeta de OneDrive con las fotos y vídeos
> de esa actividad**. La obligatoriedad por tipo de la tabla de abajo no cambia.

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

> **Confirmada el 2026-08-17 por D-019.** Cancelada se mantiene aunque no aparezca en los mockups del
> cliente.

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

> **Confirmada el 2026-08-17 por D-019.** Entregada se mantiene, así que la regla sigue enganchada
> donde estaba. Queda un detalle menor en D-028: si el avance se pide en todos los perfiles o solo en
> los que lo usan de verdad. El requerimiento v2 lo conserva expresamente para Eduardo.

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

> **EN REVISIÓN (2026-08-17) — la resuelven D-022 y D-035.** Esta decisión **se queda sin sujeto** si
> Coordinación deja de existir: los mockups mueven a Chiara/Kiara a Locuciones y no muestran a nadie en
> Coordinación. Hay que decidir quién mantiene el módulo entonces.

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

> **Confirmada el 2026-08-17 por D-019.** «Por subir» se mantiene aunque no aparezca en los mockups del
> cliente.

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

> **Confirmada el 2026-08-17 por D-019.** Los estados sobre los que se define la regla se mantienen.

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

> **Confirmada el 2026-08-17 por D-019.** El ciclo de observación se mantiene entero: supervisión
> observa, el colaborador responde, supervisión cierra, y la actividad vuelve al estado exacto previo.
>
> **Ojo con D-033:** el feedback de AUNOR **no** usa este mecanismo. Esta decisión gobierna la
> observación **interna** de Rhino sobre sus operarios.

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

> **EN REVISIÓN (2026-08-17) — la resuelven D-021 y D-022.** Dos frentes: **se queda sin sujeto** si
> Coordinación desaparece del catálogo de roles; y el requerimiento v2 reserva la vista general
> explícitamente a «administradores y supervisores», limitando al resto a «la información que le
> corresponda», que es lo contrario de la lectura global que esta decisión concede.

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

> **Intacta, sin confirmar del todo.** Los mockups del requerimiento v2 muestran exactamente la barra
> **lateral de escritorio** que esta decisión prevé, así que no la contradicen. Pero los tres mockups
> son de escritorio: **ninguno confirma la barra inferior en móvil**, que es la mitad importante de
> esta decisión y la que responde al mandato mobile-first.

Los destinos del rol viven en una **barra inferior fija**, siempre visible. En escritorio, esa misma
barra pasa a un lateral y el contenido gana el ancho.

**Consecuencias**

- El pulgar alcanza la navegación sin recolocar el teléfono, que es lo que pide ser mobile-first.
- Cuesta una franja permanente de una pantalla pequeña. Los formularios largos deben tenerlo en cuenta
  para que la barra no tape el último campo ni el botón de guardar.
- Como el número de destinos cambia por rol (D-011, D-016), la barra tiene entre dos y cinco entradas
  según quién entre. No se diseña una barra fija de contenido fijo.
- El acceso (P-1) y la vista de AUNOR (P-6) no llevan barra: no tienen a dónde navegar.

---

## D-019 — La plataforma es un sistema de supervisión: se mantienen los siete estados

**Fecha:** 2026-08-17 · **Fase:** 0 · **Decide:** Marco

Frente a los cuatro modelos que circulaban —dos estados en la ficha original, tres en cada uno de los
dos mockups, y siete en la Fase 0—, Marco decide que **la plataforma es un sistema de supervisión**, no
una bitácora.

**Confirmado expresamente por Marco el 2026-08-17:** *«que se conserven los 7 estados»*. Se descarta el
modelo híbrido con menos estados visibles. La sección §5 de `docs/fase-0-concepcion.md` queda firme tal
como está, con sus siete estados, sus reglas y sus tres recorridos de ida y vuelta.

**Consecuencias**

- Sobreviven íntegras D-007, D-008, D-009, D-010, D-013, D-014 y D-015, que salen de revisión.
- Los quince criterios de aceptación que dependían del modelo vuelven a ser válidos sin tocar.
- «Por subir» y «Cancelada» se mantienen **aunque no aparezcan en ningún mockup del cliente**.
- Los mockups muestran tres etiquetas de estado y el sistema tendrá siete. Al diseñar hay que decidir
  cómo se presentan siete estados sin que la pantalla se sienta más pesada que la que el cliente vio.
  Es un problema de diseño, no de modelo.
- El cliente **no ha visto** el ciclo de observación en ningún mockup. Conviene enseñárselo antes de
  construirlo, para que no le llegue de sorpresa lo que es el corazón del producto.

---

## D-023 — El material va por enlace: la plataforma no almacena archivos

**Fecha:** 2026-08-17 · **Fase:** 0 · **Decide:** Marco

Cada operario sube sus fotos y vídeos donde ya los sube hoy, y **en la plataforma pega un enlace** a esa
carpeta. La plataforma no recibe archivos.

Queda descartada la subida directa que mostraban los mockups (arrastrar y soltar, PDF/JPG/PNG/MP4,
máximo 50 MB).

**Consecuencias**

- **Simplifica mucho el proyecto.** Desaparecen almacenamiento propio, cuotas, límites de tamaño,
  validación de formatos, respaldo y restauración de binarios. Eso quita trabajo de las Fases 5, 8 y 9.
- **D-036 deja de existir**: no hay que resolver cómo se sube un vídeo de 50 MB desde la berma, porque
  no se sube nada. La protección de mala señal vuelve a ser lo que era: un formulario de texto.
- El «contador de archivos» que muestran los mockups **no puede existir**: la plataforma no sabe qué hay
  dentro de una carpeta ajena. Como mucho puede mostrar si hay enlace o no.
- El precio, que hay que asumir a conciencia: **el material no está bajo control de la plataforma**. Si
  alguien mueve, renombra o borra la carpeta, el enlace muere y el sistema no se entera. Y el acceso
  depende de permisos que reparte Lenin a mano, fuera de la plataforma (D-025).
- Nada impide añadir almacenamiento propio más adelante. El camino inverso habría sido más caro.

---

## D-024 — Descargar es ir a OneDrive

**Fecha:** 2026-08-17 · **Fase:** 0 · **Decide:** Marco · **Consecuencia de:** D-023

Al no haber archivos en la plataforma, no hay nada que descargar desde ella. La acción de descarga que
muestran los mockups **es redirigir a la carpeta**, igual que «Ver».

Queda por decidir al diseñar si tiene sentido mantener dos botones que hacen lo mismo.

---

## D-033 — AUNOR ve y deja su opinión, pero no manda sobre los operarios

**Fecha:** 2026-08-17 · **Fase:** 0 · **Decide:** Marco

AUNOR deja de ser un lector mudo: **puede dejar su feedback u opinión** sobre lo que ve. La razón que da
Marco es explícita y define el límite: *la plataforma la usa Rhino para controlar a sus operarios; de
AUNOR se quiere su opinión, porque importa que estén contentos*.

**Confirmado expresamente por Marco el 2026-08-17:** *«sobre el feedback, eso pasa siempre primero por
supervisión»*. El comentario de AUNOR **nunca llega directo al operario**. Entra en una bandeja de
supervisión, y es supervisión quien lo descarta, lo responde, o lo convierte en una observación interna.

```
AUNOR comenta  →  bandeja de supervisión  →  supervisión descarta, responde,
                                             o lo convierte en observación interna
```

Eso cierra el agujero que la auditoría había señalado: un mensaje directo del cliente a un operario
—con notificación y con el nombre del cliente encima— habría funcionado en la práctica como una orden,
aunque formalmente no cambiara ningún estado.

De ahí sale la regla que separa las dos cosas:

| | Observación interna | Feedback de AUNOR |
|---|---|---|
| Quién la escribe | Supervisión de Rhino | AUNOR |
| Sobre quién recae | El operario responsable | Rhino como empresa |
| ¿Cambia el estado? | Sí, pasa a Observada y detiene | **No** |
| ¿Obliga a alguien? | Sí, hay que corregir y supervisión cierra | No, es una opinión |
| ¿Quién la ve? | Rhino, nunca AUNOR | Rhino; AUNOR ve la suya |

**Consecuencias**

- **El cliente nunca da órdenes directas a un operario.** Si el feedback de AUNOR merece corrección, es
  **supervisión de Rhino** quien lo convierte en una observación interna. La cadena de mando no se
  rompe: Rhino sigue siendo quien controla a su gente.
- La vista de AUNOR deja de ser de solo lectura: **escribe**. Sigue sin recibir observaciones internas,
  respuestas internas, pendientes internos ni actividades dadas de baja — pero eso ya no basta.
  **Ahora hacen falta las dos direcciones:**
  - **Confidencialidad**, como hasta ahora: que no le llegue nada interno.
  - **Integridad**, que es nueva: una cuenta de AUNOR debe poder crear feedback **solo sobre lo que ya
    puede ver**, y no debe poder alterar la actividad, su estado, su autor, sus campos internos ni el
    identificador al que se engancha el comentario. El feedback externo y la nota interna tienen que ser
    dos objetos distintos, no el mismo con una bandera.
  - La Fase 8 solo tenía previsto probar que AUNOR no recibe campos internos. Ahora tiene que probar
    también que **no puede escribir donde no debe**.
- Aparece trabajo nuevo que no estaba en el alcance: alguien de Rhino tiene que **ver que AUNOR opinó**.
  Un comentario del cliente que nadie lee es peor que no tener comentarios.
- La mecánica exacta queda abierta en **D-041**.

---

## D-036 — Subir archivos con mala señal

**Fecha:** 2026-08-17 · **Cerrada sin objeto por D-023.**

No aplica: la plataforma no recibe archivos. La protección de mala señal cubre el formulario de texto,
como estaba definido en `docs/fase-0-concepcion.md` §10.

---

## D-026 — Se entra con usuario y clave; el atajo vive en el dispositivo

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

El acceso es **usuario y clave**. Se descarta la pantalla *roster* que proponían los mockups del
cliente, que mostraba el equipo entero antes de autenticar a nadie.

Para no perder la comodidad que buscaba el cliente, se añade un **atajo local**: en un dispositivo donde
alguien ya entró con éxito, la pantalla ofrece esas cuentas para tocarlas directamente. **La lista se
construye en el propio teléfono, no en el servidor.** Quien abra la dirección por primera vez, o desde
un dispositivo desconocido, no ve a nadie.

**Por qué**

El roster del cliente publicaba, sin pedir nada, cuatro cosas: quién trabaja en Rhino, con qué rol,
**cuántas actividades lleva cada uno** y **cuándo trabajó por última vez**. Las dos últimas son datos de
desempeño de los operarios, expuestos a cualquiera con la dirección. Además contradecía la P-1 de la
Fase 0, que exige que el error de acceso no revele siquiera si una cuenta existe.

Una precisión que salió de la revisión de Codex y que conviene no repetir mal: el problema **no** es que
el roster «regale medio secreto» —el nombre de usuario casi nunca es secreto—. El problema es que
**entrega gratis la lista completa de cuentas válidas**, que es lo que habilita el phishing dirigido y
la suplantación.

**Consecuencias**

- **P-1 queda desbloqueada** y puede diseñarse en móvil y en escritorio.
- El atajo local es un dato del dispositivo, no del servidor. Cuando llegue la Fase 5 hay que tratarlo
  como tal: se borra al cerrar sesión y no sobrevive a que la cuenta se desactive.
- Hay que resolver además cómo se recupera una clave y cuánto dura el «recordar» (**D-039**), sabiendo
  que un teléfono puede ser compartido.
- **Hay que explicárselo al cliente.** Pidió expresamente esa portada y no la va a ver. El argumento es
  el de arriba, y es defendible.

---

## D-030 — Los cinco roles comparten el patrón de pantalla

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

Los cinco roles de trabajo comparten el patrón de **panel mensual, historial y acciones**. La pantalla
adapta el alcance, la identificación del responsable, los campos relevantes y las acciones según rol,
tipo y estado. Coordinación conserva una variante global mientras D-016 esté vigente. **No se diseñan
cinco pantallas independientes.**

**Por qué**

La pregunta estaba mal planteada: compartir pantalla no significa mostrar lo mismo. Lo que cambia entre
perfiles son campos, alcance y acciones, no la arquitectura de la información. Y eso ya estaba decidido
en `docs/fase-0-concepcion.md` §3: *«Comparten la misma ficha; lo que cambia entre ellos es qué campos
son obligatorios»*. Cinco pantallas separadas contradirían esa decisión.

Además, D-001 establece que **una persona ocupa uno o varios roles**. Con pantallas separadas, quien
tuviera dos roles necesitaría un mecanismo para cambiar de identidad de trabajo que no existe en el
requerimiento y habría que inventar.

**Consecuencias**

- El alcance de diseño de la Fase 1 se queda en **unas 40 pantallas** en vez de pasar de 60.
- **Es la opción reversible.** Si aparece un flujo genuinamente exclusivo de un rol, se añade esa
  variante sin tirar el patrón común. Al revés habría que reconciliar cinco diseños ya divergentes.
- **Sobrevive a lo que decida el cliente sobre los roles.** Si Coordinación desaparece con D-022, se
  borra esa variante y P-2 no se rediseña. Por eso D-030 **sale de la lista de preguntas para el
  cliente**: se pudo cerrar sin él.
- **El riesgo que hay que vigilar:** que el patrón común esconda algo crítico para un trabajo concreto
  —el responsable en Coordinación, la ubicación en vía, o el avance y los pendientes de Eduardo—. Se
  detecta recorriendo los cinco perfiles **en móvil** antes de congelar el diseño.

**Cómo se decidió.** Claude y Codex derivaron la respuesta por separado, sin verse, según el
`protocolo-universal-v4.md` §11. Coincidieron, lo que sitúa esta decisión entre las de riesgo bajo.

---

## D-031 y D-018 — La dirección visual es la pieza 2, «planilla de rodaje»

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

De las cinco piezas de E-006, Marco elige **`diseno/piezas-png/pieza-2.png`**: fondo claro, blanco y
azul, muy ordenada y casi documental, con el aire de una planilla de producción audiovisual.

Esto **cierra las dos decisiones a la vez**: D-031, que preguntaba qué lenguaje visual adopta el
proyecto, y D-018, que llevaba desde el 12 de agosto esperando a que Marco eligiera entre las ocho
direcciones de móvil. Las ocho quedan descartadas como opción; se conservan en `diseno/` como archivo.

**Consecuencias**

- Es una dirección **clara**, no oscura. Se aleja de la propuesta del cliente —azul marino, cian y
  lima— y hay que estar dispuesto a defenderla ante César. A favor: se lee mejor a pleno sol, que es la
  condición real de quien graba en vía.
- Encaja con la exigencia de alinearse a la identidad de AUNOR mejor que las alternativas de más
  carácter: es sobria y corporativa, del registro que una concesionaria reconoce.
- **Queda por extraer el sistema de diseño** —paleta con sus hexadecimales, escala tipográfica, formas
  de los estados, espaciados— y fijarlo en `docs/sistema-diseno.md`. La imagen no es un sistema: es una
  referencia. La maqueta HTML `diseno/escritorio/pieza-2.html` sirve de puente, porque tiene los valores
  reales.
- La imagen tiene tres errores de contenido conocidos —falta el estado Observada, las actividades son
  operaciones viales en vez de trabajo audiovisual, y dos tarjetas de resumen están inventadas—. **Se
  elige el lenguaje visual, no el contenido.** Ver `docs/encargos/E-006-piezas-visuales-png.md`.

---

## D-042 — Las piezas para elegir estética son de escritorio; el producto se sigue diseñando mobile-first

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

Las cinco piezas del encargo E-005 se dibujan **solo en escritorio**, porque su único trabajo es
**dejar elegir un lenguaje visual**. No son el diseño del producto.

**Mobile-first no se toca.** Marco lo dejó explícito: *«no estamos contradiciéndolo; cuando escoja el
diseño visual, te voy a pedir el diseño completo primero en móviles y luego en laptop y desktop, o sea
full mobile-first»*.

```
E-005 (ahora)          →  5 piezas de escritorio, solo para elegir estética
Elegida la dirección   →  diseño completo: MÓVIL → laptop → escritorio
```

**Consecuencias**

- **No hay contradicción con `CLAUDE.md`.** La regla mobile-first sigue vigente entera y gobierna el
  diseño real del producto. Lo de escritorio es un artefacto de decisión, no el producto.
- El escritorio es además donde el cliente dibujó sus mockups, así que comparar en escritorio es
  comparar en el mismo terreno que su propuesta.
- Cuando se elija la dirección, **la primera pantalla que se dibuja de verdad es la de móvil**, no la
  adaptación estrecha de la de escritorio. Esa distinción es lo que evita que el formulario de grabación
  acabe siendo una tabla apretada para alguien que está en la berma con una mano ocupada.
- **D-017 sigue vigente** tal como se escribió: barra inferior fija en móvil, que pasa a lateral en
  escritorio.
