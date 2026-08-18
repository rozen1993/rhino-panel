# Decisiones

Decisiones de producto y arquitectura que deben sobrevivir al chat. Una decisión aquí solo cambia si
Marco la cambia expresamente, y el cambio se escribe en este archivo.

Cerradas: **treinta**. D-006 nunca se cerró; su entrada es un marcador que apunta a la cola de
pendientes, donde quedan **trece** decisiones abiertas.

> ## Estado de la revisión abierta el 2026-08-17
>
> El requerimiento v2 del cliente dejó once decisiones en revisión. **Marco resolvió D-019, D-023,
> D-024 y D-033 el 2026-08-17**, y con ello **siete salieron de revisión**.
>
> **Ya no queda ninguna en revisión.** El 2026-08-17 por la tarde se cerró el catálogo de roles (D-022,
> D-048) y la cuestión de Burson (D-051), que era lo único que las mantenía abiertas:
>
> - **D-001** — catálogo fijado: ocho roles (ver D-053). Sale de revisión.
> - **D-005** — **revertida por D-051**: Burson sí tiene cuenta ahora.
> - **D-011** — el tablero de Burson lo mantienen Coordinación y Supervisión; qué puede hacer el propio
>   Burson sobre él está en **D-052**, abierta.
> - **D-016** — Coordinación existe y conserva su lectura global. Sale de revisión.
>
> **D-010 quedó modificada por D-028:** el avance solo se pide en Edición y Creatividad, así que la
> regla de «avance 100 para entregar» ya no aplica a los cinco tipos.
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
  rol dice qué puede hacer una persona; el tipo dice qué es la actividad. **Decidido en D-045
  (2026-08-17): un rol solo puede registrar actividades de su tipo homónimo**, salvo que la persona
  tenga además otro rol asignado.

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

**Cerrada sin objeto el 2026-08-17 por D-049.** El Excel se registra como un enlace, no se importa fila
por fila. Ya no hace falta conocer sus columnas.

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

---

## D-043 — La plataforma tiene portada pública, y el acceso va detrás

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

La plataforma abre con una **portada pública** de presentación —lo que la ficha del cliente llamaba
«tipo landing page»— con un botón que lleva al acceso de D-026.

Recupera la sensación de llegar a un sitio que el cliente buscaba con su pantalla roster, **sin publicar
nada del equipo**.

**Consecuencias**

- **Dos pantallas nuevas**, en móvil y en escritorio.
- Es una **página pública de verdad**: la ve cualquiera, sin cuenta. Eso obliga a cuidar dos cosas que
  no existían hasta ahora:
  - **Qué se cuenta de AUNOR.** Decir que Rhino trabaja para Autopista del Norte es un hecho comercial
    normal, pero es información de un cliente y conviene que él lo sepa antes de publicarla.
  - **Que no se filtre nada.** Ni nombres del equipo, ni número de actividades, ni capturas reales de la
    aplicación. Justo lo que D-026 acaba de decidir no exponer no puede reaparecer aquí por la puerta de
    atrás.
- Hay que escribir su texto. Una portada con relleno se nota, y esta la puede ver el cliente.
- Es lo más parecido a lo que pidió César, así que ayuda a explicarle por qué se descartó su roster.

---

## D-041 — AUNOR opina sobre cada actividad

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

El feedback de AUNOR se deja **sobre una actividad concreta**, no sobre el mes. El comentario llega
pegado a lo que lo motivó.

Sigue vigente lo decidido en D-033: **pasa siempre primero por supervisión** y nunca llega directo al
operario.

**Consecuencias**

- El comentario es útil de verdad: supervisión sabe exactamente de qué cobertura habla el cliente.
- **Multiplica los hilos.** Un mes con doce actividades puede tener doce conversaciones abiertas con
  AUNOR, y todas necesitan que alguien las atienda. Por eso el comentario **queda marcado como pendiente
  hasta que supervisión lo atiende**: un comentario del cliente sin respuesta es lo contrario de lo que
  Marco busca con esto.
- La bandeja de feedback de P-5 se ordena por actividad, no por mes.

**Sigue abierto en la cola:** quién de AUNOR puede comentar, si puede editar o borrar, si puede comentar
actividades ya aprobadas o canceladas, si ve las respuestas de Rhino, y si los usuarios de AUNOR se ven
los comentarios entre sí.

---

## D-029 — La ubicación se queda como está

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

Se mantiene lo que ya describía `docs/fase-0-concepcion.md` §4 y lo que dibuja `m-10`: **nombre del
lugar obligatorio y prominente**, y referencia, kilómetro, sentido, latitud y longitud **plegados y
opcionales**.

Se descarta reducirlo al campo único «Lugar» de los mockups, y también hacer obligatorios el kilómetro y
el sentido.

**Consecuencias**

- Llenar una actividad en la berma sigue costando **un solo campo** de ubicación.
- Quien quiera precisar el kilómetro y el sentido puede, pero nadie está obligado. **El riesgo asumido**
  es que en la práctica casi nadie despliegue esa sección, y el histórico acabe sin kilómetros. Si eso
  ocurre y a AUNOR le importa, se revisa.

---

## D-028 — El avance solo se pide donde el trabajo tiene proceso

**Fecha:** 2026-08-17 · **Fase:** 1 · **Decide:** Marco

El campo **avance de 0 a 100 se pide en Edición y Creatividad**, donde el trabajo dura días y tiene
etapas. **No se pide en Grabación, Operación ni Coordinación**, donde el estado ya dice en qué punto
está la cosa y el campo solo estorba en el celular.

Coincide con lo que el requerimiento v2 pedía expresamente para Eduardo: «porcentaje de avance».

**Esta decisión modifica D-010.**

| Tipo | ¿Pide avance? | ¿Qué hace falta para pasar a Entregada? |
|---|---|---|
| Edición, Creatividad | Sí | Avance 100 y enlace al material |
| Grabación | No | Enlace al material |
| Operación, Coordinación | No | Nada más que el cambio de estado |

**Consecuencias**

- El formulario de Johann pierde un campo, y es el que más lo agradece: es quien lo llena de pie en la
  vía.
- **Lo que D-010 protegía se conserva donde importa.** La regla existía para que no hubiera actividades
  «entregadas al 60 %» confundiendo a quien lee la lista, incluido AUNOR. En los tres tipos que pierden
  el campo no hay porcentaje que contradiga nada: Entregada significa entregada.
- Hay que **reescribir D-010 y el criterio de aceptación 12** de `docs/fase-0-concepcion.md` §11, que
  hoy dan por hecho que el avance existe siempre.
- En la lista de actividades, las de Grabación, Operación y Coordinación **no muestran barra de avance**.
  La pantalla tiene que verse bien con y sin ella.

---

## D-044 — Se cierra la Fase 1 con diseño imperfecto y se abre la Fase 2

**Fecha:** 2026-08-17 · **Fase:** 1 → 2 · **Decide:** Marco

Marco da por cumplida la puerta de la Fase 1 —tiene dirección visual y entiende los recorridos—
**aunque las 29 pantallas producidas tengan la deriva registrada en INC-002**. La corrección no se hace
regenerando imágenes: se hace **sobre el frontend en código**, una vez construido.

Esto no salta ningún paso del proyecto: en `CLAUDE.md`, la Fase 2 (Construcción frontend) es
exactamente la que sigue a la Fase 1, y la Fase 3 (validación y contrato de handoff) va **después** de
construir, no antes.

**Consecuencias**

- **Se abre la Fase 2.** Quedan autorizadas las tecnologías de **STACK — Frontend**: Next.js (App
  Router), React, TypeScript estricto, Tailwind, Zod, Vitest, Playwright, Git, npm.
- **La referencia de corrección visual sigue siendo `diseno/piezas-png/pieza-2.png`**, la imagen que
  Marco aprobó — no las pantallas ya dibujadas, que son justamente las que se desviaron.
- **Riesgo asumido y explícito:** la Fase 0 sigue con **once decisiones abiertas esperando a César**,
  sobre todo el catálogo de roles (D-020, D-021, D-022). Se construye sobre el catálogo documentado hoy
  en D-001. Si el cliente cambia los roles, la navegación y los permisos del frontend tendrán que
  ajustarse — es el mismo trato que ya se hizo con el diseño: avanzar y corregir después.
- Todos los datos son simulados. Nada de Supabase, Auth ni persistencia real hasta la Fase 4.

---

## D-045 — Cada rol actúa estrictamente dentro de lo que ese rol permite

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Cita textual: *«supervisión solo se encarga de lo que admite su rol y nada más, así como el resto de
roles»*. Es una regla general, no solo para Supervisión: **ningún rol hace nada fuera de lo que ese rol
tiene definido**, y eso vale para los siete roles por igual.

Esto cierra una nota que llevaba abierta desde D-001: *«no se asume que un rol solo pueda registrar
actividades de su tipo homónimo mientras Marco no lo decida»*. Ya está decidido: **sí se asume.**

**Consecuencias**

- Un rol de trabajo (Grabación, Edición, Coordinación, Operación, Creatividad, Locución) solo registra y
  es responsable de actividades de **su propio tipo**.
- **Supervisión / Administración no ejecuta actividades de campo.** Su alcance es exactamente el
  descrito en D-001: ver todo, observar, responder, resolver, aprobar, administrar cuentas, importar el
  histórico. Nada más.
- **Una persona con varios roles asignados puede actuar dentro de la suma de esos roles**, no solo de
  uno. Es la única forma de hacer más de una cosa: tener más de un rol, no que un rol se estire.
- **Consecuencia inmediata en los datos:** Martín, con Supervisión como único rol confirmado, no puede
  ser responsable operativo de una actividad. El dato de ejemplo que lo tenía así en
  `frontend/lib/activities.ts` queda desactualizado y se corrige.

---

## D-046 — Excepción explícita: Vercel se adelanta a la Fase 2

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Vercel está en **STACK — Backend** de `CLAUDE.md`, autorizado *«únicamente cuando termine y se congele
el frontend»* — es decir, al cerrar la Fase 3. Estamos en Fase 2, con la Fase 3 (validar en dispositivo
real, contrato de handoff, congelamiento) todavía sin empezar.

**Marco decide adelantarlo de todos modos**, explícitamente, para tener una URL de vista previa del
frontend ya construido. Es una decisión suya como único decisor del proyecto, y queda escrita aquí para
que no se pierda por qué se saltó la regla — el archivo es la interfaz, no el chat.

**Consecuencias**

- Se despliega **solo el frontend**, con datos simulados. Ningún secreto real, ninguna variable de
  entorno de Supabase — no existen todavía.
- El proyecto de Vercel apunta a `frontend/` como raíz, no a la raíz del repositorio, porque el
  Next.js vive en ese subdirectorio junto a `diseno/`, `docs/` y `actualizacion_del_requerimiento/`.
- **Esto no adelanta el resto del stack de backend.** Supabase, Auth, RLS y migraciones siguen
  prohibidos hasta la Fase 4. Vercel se adelanta solo como herramienta de despliegue de vista previa.
- La URL resultante es de un frontend con mocks, no del sistema en producción. No debe confundirse con
  el despliegue real de la Fase 9, que tendrá dominio, HTTPS y datos reales.

---

## D-047 — Solo roles, sin nombres. Marco asigna las personas

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Cita: *«deja de pensar en nombres, solo en roles, olvídate de todos los nombres que hay. Tú solo
preocúpate de crear los roles, yo Marco me voy a encargar los roles para cada persona»*.

**El sistema no conoce personas concretas.** Construye roles y sus permisos. Quién ocupa cada rol es
trabajo de Marco en la pantalla de cuentas, no del diseño ni del código.

**Consecuencias**

- **D-020 y D-021 dejan de existir como preguntas.** Ya no hay que averiguar si Chiara y Kiara son la
  misma persona, ni qué rol tiene hoy cada uno. Desaparecen de la cola.
- Los nombres que hay hoy en `frontend/lib/activities.ts` y en las demás pantallas son **datos de
  ejemplo y nada más**. No representan asignaciones y no hay que mantenerlos fieles a nadie.
- **Para probar el sistema hacen falta usuarios de prueba, uno por rol** — ver D-053.

---

## D-048 — El rol Operación no existe

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Se elimina del catálogo. **Cierra la pregunta 2 de D-022.**

**Consecuencias**

- Los tipos de actividad pasan de cinco a cinco, pero no los mismos: sale **Operación**, entra
  **Locución** (D-022).
- Hay que quitar Operación de los datos de ejemplo, los filtros y los desplegables del formulario.
- `docs/fase-0-concepcion.md` §3 y la tabla de obligatoriedad por tipo mencionan Operación en varios
  sitios; hay que reescribirlos.

---

## D-049 — Todo es un enlace, incluido el Excel histórico

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Cita: *«tanto el Excel como todo el material, sea video/foto/edición etc., en la plataforma será un
simple link»*.

Extiende D-023 al histórico: **el Excel tampoco se importa fila por fila.** Se registra como un enlace,
igual que cualquier otro material.

**Consecuencias — es la mayor reducción de alcance del proyecto**

- **La Fase 7 completa (Migración del histórico) desaparece.** No hay que analizar, mapear, limpiar,
  simular, importar a staging, comprobar ni anular lotes. Eran ocho pasos y una puerta de salida entera.
- **D-006 y D-040 se cierran sin objeto.** Ya no hace falta ver las columnas del Excel ni decidir en qué
  estado entran las filas históricas: no entran filas.
- **La pantalla P-9 (Importación del histórico) sobra.** Ya está construida en
  `frontend/app/importacion/`. Hay que decidir si se retira o se deja como acceso al enlace del Excel.
- **Cambia la Meta Final de `CLAUDE.md`**, cuyo punto 7 exige *«contiene el histórico del Excel migrado
  y comprobado»*. Con esta decisión ya no habrá migración que comprobar. Ese punto hay que reescribirlo.
- **El precio, que conviene tener presente:** el histórico deja de ser consultable dentro de la
  plataforma. No se podrá filtrar, buscar ni contar sobre las coberturas antiguas de Johann — solo abrir
  el Excel. Si algún día hace falta explotar ese histórico, habrá que migrarlo de verdad.

---

## D-050 — Sin notificaciones

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Cita: *«olvídate de las notificaciones por el momento»*. **Cierra D-032.**

La campana que aparecía en los mockups del cliente no se construye. Si más adelante hace falta, se
decide entonces.

---

## D-051 — Burson pasa a ser un rol con cuenta

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Cita: *«Burson pasa a ser un personaje que también tiene un rol, que en el futuro yo le voy a asignar»*.

**Esto revierte D-005**, que decía que Burson no entra al sistema y que el módulo era un tablero
puramente interno de Rhino. Ahora Burson es un rol más del catálogo, con su cuenta.

**Consecuencias**

- **Aparece un segundo actor externo**, junto a AUNOR. Hasta ahora AUNOR era el único, y esa era la
  razón por la que D-005 se consideraba la opción segura.
- **Los «pendientes de Burson» cambian de naturaleza.** Eran una anotación de Rhino sobre lo que
  esperaba del otro lado; si Burson entra y los ve, pasan a ser algo que se le está reclamando
  directamente. El tono del tablero cambia.
- **D-011 queda sin sujeto claro:** decía que el tablero lo mantienen Coordinación y Supervisión. Ahora
  hay que decidir qué puede hacer Burson sobre él.
- **Queda abierto y es importante: ¿qué ve exactamente el rol Burson?** Presumiblemente solo el módulo
  Burson y nada de las actividades de AUNOR — pero eso no está decidido y es una frontera de seguridad.
  Ver D-052.

---

## D-052 — ¿Qué ve y qué puede hacer el rol Burson?

**Fecha:** 2026-08-17 · **Fase:** 2 · **Estado: ABIERTA** · **Decide:** Marco

Nace de D-051. No la decide Claude porque es una frontera de seguridad con un tercero.

Lo que hay que fijar antes de construir la pantalla de Burson con su cuenta:

- ¿Ve **solo** el módulo Burson, o algo más?
- ¿Ve las actividades que Rhino hace para AUNOR? *(lo esperable es que no)*
- ¿Puede **escribir** —marcar sus pendientes como resueltos, comentar— o solo leer?
- ¿Ve los «pendientes de Rhino», es decir, lo que Rhino se debe a sí mismo?

Hasta que se decida, la pantalla de Burson se construye como está: tablero interno, sin cuenta de
Burson.

---

## D-053 — Un usuario de prueba por rol

**Fecha:** 2026-08-17 · **Fase:** 2 · **Decide:** Marco

Para poder recorrer la plataforma como cada rol y comprobar qué ve y qué puede hacer cada uno, se crea
**un usuario y contraseña de prueba por rol**.

**El catálogo de roles queda así, tras D-022, D-048 y D-051:**

| Rol | Tipo |
|---|---|
| Grabación | Trabajo |
| Edición | Trabajo |
| Coordinación | Trabajo, con lectura global (D-016) |
| Creatividad | Trabajo |
| **Locución** | Trabajo *(nuevo, D-022)* |
| Supervisión / Administración | Gobierno |
| AUNOR | Externo, consulta y opinión |
| **Burson** | Externo *(nuevo, D-051)* |

Ocho roles. **Operación queda eliminado** (D-048).

**Consecuencias**

- Son credenciales **simuladas, de Fase 2**: no hay servidor ni autenticación real. Sirven para recorrer
  la aplicación, no para proteger nada.
- **No pueden sobrevivir a producción.** `CLAUDE.md`, Fase 9, ya exige *«eliminación de credenciales
  temporales»*; esto es exactamente eso.
- La pantalla de acceso tiene que aceptarlas y llevar a cada rol a lo que le corresponde, con su
  navegación y sus permisos.

---

## Decisiones cerradas por consecuencia el 2026-08-17

Siete entradas que salieron de la cola sin necesitar una decisión propia: otra decisión de Marco las
dejó sin objeto. Se registran para que quien busque su número lo encuentre.

## D-020 — Identidad de las personas del equipo

**Cerrada sin objeto por D-047.** El sistema no modela personas, solo roles. Ya no importa si Chiara y
Kiara son la misma persona.

## D-021 — Qué rol tiene hoy cada persona

**Cerrada sin objeto por D-047.** Marco asigna los roles a las personas en la pantalla de cuentas; no es
una decisión de diseño.

## D-022 — Taxonomía de roles

**Cerrada el 2026-08-17.** El catálogo definitivo son **ocho roles**, listados en D-053: Grabación,
Edición, Coordinación, Creatividad, **Locución**, Supervisión/Administración, AUNOR y **Burson**.
**Operación queda eliminado** (D-048).

Esto **saca a D-001 de revisión**: el catálogo ya está fijado.

## D-032 — Notificaciones

**Cerrada por D-050.** No se construyen.

## D-034 — Lenin: de qué lado está y qué ve

**Cerrada sin objeto por D-047.** Ya no se modelan personas concretas. Si Lenin necesita entrar, se le
asigna uno de los ocho roles.

## D-035 — Burson: ¿cambia D-005?

**Cerrada por D-051: sí, la revierte.** Burson pasa a ser un rol con cuenta. Lo que queda abierto es qué
ve exactamente, y eso vive en **D-052**.

## D-038 — «Seguimiento en tiempo real»

**Cerrada el 2026-08-17.** Marco: *«actualizado»*. Es lenguaje comercial, no infraestructura de realtime.
No se añade nada.

## D-040 — Migrar el Excel bajo el requerimiento v2

**Cerrada sin objeto por D-049.** No hay migración: el Excel es un enlace.
