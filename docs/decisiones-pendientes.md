# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

**Cerradas: cuarenta y tres.** Quedan **cuatro** abiertas: D-025, D-027, D-037 y D-039.

El 2026-08-17 se cerraron además **D-052** (Burson ve solo su módulo y solo lee), **D-054** (la Meta
Final ya no exige migrar el Excel) y **D-055** (P-9 pasa a ser el enlace al histórico).

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

**El 2026-08-17, por la tarde, Marco cerró seis decisiones más** (D-047 a D-053) que vaciaron media
cola:

- **D-047 — solo roles, sin nombres.** Cierra D-020 y D-021: ya no importa quién es quién.
- **D-048 — el rol Operación no existe.**
- **D-049 — todo es un enlace, incluido el Excel.** Cierra D-006 y D-040, y **elimina la Fase 7 entera**.
- **D-050 — sin notificaciones.** Cierra D-032.
- **D-051 — Burson pasa a ser un rol con cuenta.** Revierte D-005.
- **D-052 — qué ve el rol Burson.** Nueva y abierta: es una frontera de seguridad.
- **D-053 — un usuario de prueba por rol.** Ocho roles.

«Tiempo real» quedó resuelto como **«actualizado»**: sin infraestructura de realtime. Cierra D-038.

Y con ellas caen tres más por consecuencia:

- **D-022** (taxonomía de roles) queda cerrada: existe Locución, existe Coordinación, **no** existe
  Operación. El catálogo son ocho roles, listados en D-053.
- **D-034** (Lenin, de qué lado está) desaparece con D-047: **ya no se modelan personas**. Si Lenin
  necesita entrar, se le asigna un rol y ya está.
- **D-035** (¿Burson cambia D-005?) queda respondida por D-051: **sí, lo revierte.** Burson es ahora un
  rol. Lo que queda abierto es qué ve, y eso es **D-052**.

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

## D-037 — Exportar reporte mensual: formato, contenido y quién puede

Requisito nuevo y firme, pero sin detalle. ¿PDF o Excel? ¿Qué columnas? ¿Puede exportar un colaborador
o solo supervisión? ¿Puede exportar AUNOR? Un archivo exportado **sale del sistema y de sus permisos**,
así que esto es también una decisión de seguridad.

---

## D-039 — Recuperación de clave y «Recordar este equipo»

El modal muestra «¿Olvidaste tu clave?» y una casilla «Recordar este equipo» ya marcada.

Ninguna de las dos existe en el modelo. Hay que decidir cómo se recupera una clave —¿por correo, o la
repone administración?— y cuánto dura el «recordar», sabiendo que el dispositivo puede ser compartido y
que la cuenta puede desactivarse mientras el recuerdo sigue vivo.

---

