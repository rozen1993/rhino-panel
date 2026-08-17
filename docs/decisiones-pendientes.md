# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

**Cerradas: treinta.** Quedan **trece** abiertas, las de este archivo.

**Lo que Marco cerró el 2026-08-17**, todo en `docs/decisiones.md`:

- **D-019** — la plataforma es un **sistema de supervisión**: se mantienen los siete estados y el ciclo
  de observación completo.
- **D-023** — el material va **por enlace**; la plataforma no almacena archivos. **D-024** y **D-036**
  se cierran con ella.
- **D-033** — **AUNOR ve y deja su opinión**, y ese feedback **pasa siempre primero por supervisión**:
  nunca llega directo al operario.
- **D-030** — los cinco roles **comparten el patrón de pantalla**, con variantes internas.
- **D-031 y D-018** — la dirección visual es la **pieza 2**, «planilla de rodaje». Cierra la decisión que
  llevaba parada desde el 12 de agosto.
- **D-026** — se entra con **usuario y clave**, y el atajo de «toca tu cara» vive en el dispositivo, no
  en el servidor. Desbloquea P-1.
- **D-042** — las piezas para elegir estética fueron de escritorio, pero **el producto se diseña
  mobile-first**.
- **D-043** — la plataforma tiene **portada pública** y el acceso va detrás.
- **D-041** — AUNOR opina **sobre cada actividad**, no sobre el mes.
- **D-029** — la **ubicación se queda como está**: nombre del lugar obligatorio, el resto plegado.
- **D-028** — el **avance solo se pide en Edición y Creatividad**. Modifica D-010.

**Atención:** de las trece que quedan, **once necesitan respuesta del cliente**. Solo D-037 y D-039 las
puede resolver Marco por su cuenta.

---

## D-006 — Excel histórico: disponibilidad y forma real

**Fase:** 0 (informativa) / 7 (bloqueante)

El requerimiento v2 confirma que el Excel existe y que hay que migrarlo, sobre todo las coberturas de
Johann, pero **no aporta columnas ni filas de ejemplo**. La decisión sigue abierta igual que antes.

Ahora urge más que antes: con el requerimiento v2 aparecen campos nuevos (tipo de servicio, sede,
enlace de OneDrive por actividad) y un modelo de estados en disputa. Sin ver el Excel no se puede saber
qué de todo eso puede llenarse para el histórico. Ver también D-040.

**Qué hace falta:** una copia del archivo en el proyecto, o al menos la lista de columnas y unas filas
de ejemplo.

---

## D-020 — Identidad de las personas del equipo

**Bloquea:** D-021, la pantalla roster, la administración de cuentas.

El cuerpo de la ficha nombra a **Chiara**; los mockups nombran a **Kiara**. No se sabe si son la misma
persona con el nombre mal escrito o dos personas distintas. Los mockups muestran cinco tarjetas y el
cuerpo de la ficha describe seis perfiles.

**Qué hace falta:** la lista real de personas que van a tener cuenta, con su nombre bien escrito.

---

## D-021 — Qué rol tiene hoy cada persona

**Bloquea:** permisos, navegación por rol, pantalla roster.
**Depende de:** D-020, D-022.

| Persona | Cuerpo de la ficha v2 | Mockups |
|---|---|---|
| Johann | Grabaciones (Chimbote) | Grabaciones · Chimbote |
| Eduardo | Edición y postproducción | Edición y grabación · Lima |
| Chiara / Kiara | Coordinación y seguimiento | Locuciones |
| Martín | Operaciones | Supervisión general |
| César | Producción y desarrollo creativo | Supervisión general |

Tres cambios con consecuencias: **Martín** deja Operaciones, con lo que ese rol se queda sin nadie;
**César** pasa a Supervisión siendo además el solicitante; y **Chiara/Kiara** deja Coordinación, lo que
deja sin titular las decisiones D-011 y D-016.

**Qué hace falta:** que el cliente confirme quién hace qué hoy, no quién lo hacía cuando se escribió la
ficha original.

---

## D-022 — Taxonomía de roles

**Bloquea:** D-001 (en revisión), la matriz de permisos, la navegación.

Tres preguntas separadas:

1. ¿Se añade **Locuciones** como rol y como tipo de actividad? No existe en el modelo actual.
2. ¿Sobrevive **Operación** si Martín se va a Supervisión?
3. ¿Sobrevive **Coordinación** si Chiara/Kiara se va a Locuciones? Si no, D-011 (quién mantiene Burson)
   y D-016 (lectura global de Coordinación) se quedan sin sujeto.

Conviene no confundir esto con D-021: **una persona puede cambiar de rol sin que el catálogo de roles
cambie.** Solo si el catálogo cambia hay que tocar D-001.

---

## D-025 — Permisos de OneDrive por usuario

**Gana peso tras D-023.** Al decidirse que el material va por enlace y que la plataforma no almacena
nada, **el enlace es el producto**: si el enlace no abre, la actividad no tiene material a efectos
prácticos, por mucho que el registro esté completo.

Hoy los permisos los administra **a mano Lenin**, que tiene acceso maestro, y eso ocurre **fuera de la
plataforma**.

**Opciones:** seguir a mano —y entonces la plataforma tiene que **explicar bien el fallo** cuando
alguien no tiene permiso, en vez de mostrar un error de Microsoft que nadie entiende—; o integrar con la
API de Microsoft, que es alcance nuevo y considerable y no está en el stack aprobado.

Hay además cuatro preguntas que nadie había hecho y que solo aparecen al decidir que **todo el material
vive fuera**:

1. **¿Quién comprueba que un enlace sigue vivo?** Si alguien mueve o renombra una carpeta, el enlace
   muere en silencio y el sistema no se entera.
2. **¿Qué se aprobó exactamente?** Una carpeta externa puede vaciarse o cambiarse **después** de que
   supervisión apruebe la actividad. La plataforma no guarda copia, ni versión, ni recuento, ni huella:
   no habrá forma de demostrar qué material se dio por bueno.
3. **¿Puede AUNOR abrir el material?** Si tiene que opinar sobre una entrega (D-033), necesita ver algo.
   Hoy su vista **no incluye el enlace**, y dárselo significa repartir permisos de OneDrive a cuentas
   del cliente. Hay que decidirlo.
4. **¿Quién garantiza que el material no se pierde?** Al no almacenar nada, la plataforma deja de tener
   que respaldarlo — pero la obligación no desaparece, **se muda a OneDrive**. Hay que dejar escrito
   quién responde de la retención y de la recuperación, o el proyecto tendrá copias de seguridad de una
   base de datos que solo contiene enlaces a material que nadie respalda.

**Y una cuestión de seguridad del propio enlace**, para la Fase 8: restringir a qué dominios y esquemas
puede apuntar, impedir enlaces maliciosos, evitar que una URL con credencial dentro acabe en un registro
o en un reporte exportado, y comprobar que un usuario no recibe enlaces de actividades ajenas.

---

## D-027 — «Tipo de servicio» frente a los cinco tipos de actividad

El formulario nuevo pide **tipo de servicio** (foto, video). El modelo actual ya clasifica por **tipo de
actividad** (Grabación, Edición, Coordinación, Operación, Creatividad).

**Opciones:** conviven como dos ejes (hay que decir cuál manda en filtros, en la vista de AUNOR y en la
migración); el tipo de servicio reemplaza al tipo de actividad; o el tipo de servicio es solo una
etiqueta secundaria sin consecuencias en reglas.

---

## D-032 — Notificaciones

La campana aparece en el mockup con un punto verde, pero **el texto de la ficha no la menciona**. No se
puede tratar como requisito confirmado. ¿Existe? ¿De qué avisa? ¿Por qué canal?

---

## D-034 — Lenin: de qué lado está y qué ve

Actor nuevo, no existe en el modelo. La ficha lo agrupa con «las personas autorizadas por Autopista del
Norte», pero también es quien administra el OneDrive de Rhino.

¿Es un supervisor interno de Rhino, un representante de AUNOR, o las dos cosas? ¿Tiene cuenta? ¿Qué ve?

---

## D-035 — Burson: ¿cambia D-005?

D-005 decidió que **Burson no entra al sistema** y que el módulo es un tablero interno de Rhino.

El requerimiento v2 describe la plataforma como «canal de comunicación […] entre el equipo, los
colaboradores operativos, Autopista del Norte y **Burson**». Esa frase admite leer que Burson participa
directamente.

Además, si D-022 elimina el rol Coordinación, hay que decidir **quién mantiene el módulo**, porque hoy
D-011 se lo asigna a Coordinación y Supervisión.

---

## D-037 — Exportar reporte mensual: formato, contenido y quién puede

Requisito nuevo y firme, pero sin detalle. ¿PDF o Excel? ¿Qué columnas? ¿Puede exportar un colaborador
o solo supervisión? ¿Puede exportar AUNOR? Un archivo exportado **sale del sistema y de sus permisos**,
así que esto es también una decisión de seguridad.

---

## D-038 — «Seguimiento en tiempo real»: qué significa

La ficha dice que la información permitirá «un seguimiento autónomo y **en tiempo real**».

Si es lenguaje comercial —«actualizado al día»— no cuesta nada. Si significa que la pantalla se
actualiza sola cuando otro escribe, es infraestructura de realtime, que `CLAUDE.md` prohíbe añadir sin
necesidad demostrada.

---

## D-039 — Recuperación de clave y «Recordar este equipo»

El modal muestra «¿Olvidaste tu clave?» y una casilla «Recordar este equipo» ya marcada.

Ninguna de las dos existe en el modelo. Hay que decidir cómo se recupera una clave —¿por correo, o la
repone administración?— y cuánto dura el «recordar», sabiendo que el dispositivo puede ser compartido y
que la cuenta puede desactivarse mientras el recuerdo sigue vivo.

---

## D-040 — Migrar el Excel bajo el requerimiento v2

**Depende de:** D-006, D-027. *(D-019 y D-023 ya resueltas.)*

El requerimiento v2 confirma que hay que migrar el histórico pero **añade campos que el histórico no
tiene**. Y tras D-023 esto se vuelve más agudo, no menos: si el material **solo** existe como enlace,
una fila histórica sin enlace es una actividad sin material, no una actividad con material pendiente de
enlazar.

Hay que decidir qué se hace con una fila histórica sin enlace, sin tipo de servicio y sin sede: se
importa incompleta, se rechaza, o se importa marcada como histórica con reglas más flojas.

Y algo que solo se ve al juntar D-019 con la migración: las filas históricas **¿en qué estado entran?**
El Excel de Johann registra coberturas ya hechas hace meses. Meterlas como «Aprobada» falsea que alguien
las aprobó; meterlas como «Entregada» las deja para siempre en la bandeja de supervisión.

Las garantías ya decididas —lote, fila de origen, simulación, idempotencia y anulación— siguen vigentes
y no están en discusión.

---

# Quién tiene que contestar cada una

Quedan **trece** abiertas.

**El cliente (César / AUNOR)** — once. Marco no puede resolverlas solo:
D-006, D-020, D-021, D-022, D-025, D-027, D-032, D-034, D-035, D-038, D-040.

**Marco, por su cuenta** — dos:
D-037 (formato y permisos de la exportación) y D-039 (recuperar la clave y cuánto dura el «recordar»).

## Por dónde conviene empezar

1. **D-020, D-021 y D-022** — quiénes son, qué hacen y qué roles existen. Es lo que más cosas tiene
   paradas ahora que los estados están decididos: de aquí dependen D-001, D-011 y D-016, que son las
   cuatro decisiones que siguen en revisión.
2. **D-031** — la identidad visual, que es lo único que desbloquea la Fase 1 y las ocho maquetas.
3. **D-026** — el flujo de acceso. Solo depende de Marco y no espera a nadie.
4. **D-041** — cómo funciona el feedback de AUNOR, ahora que se decidió que existe.
