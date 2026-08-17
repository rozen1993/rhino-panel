# Impacto del requerimiento v2

**Fecha:** 2026-08-17
**Fuente:** `actualizacion_del_requerimiento/` — `Ficha_Requerimiento_Plataforma_Rhino_v2.pdf` y tres
mockups de referencia (`preview.webp`, `preview (1).webp`, `preview (2).webp`), entregados por AUNOR y
el equipo el 2026-08-17.

**Estado:** ejecutado. Este documento explica el cambio; las decisiones que abre viven en
`docs/decisiones-pendientes.md` y el incidente en `docs/incidentes.md` → INC-001.

**Autorización:** Marco ordenó expresamente el 2026-08-17 revisar el requerimiento v2 y ejecutar los
cambios necesarios en la Fase 0. Queda escrito aquí porque una decisión de Marco no puede vivir en el
chat.

**Auditoría:** la primera versión de este análisis la escribió Claude y la revisó Codex en lectura, sin
permiso de escritura. La auditoría encontró cuatro errores de hecho y tres omisiones graves, todos
corregidos en esta versión; §8 los enumera, porque un análisis que oculta sus propias correcciones no
sirve para confiar en él la próxima vez.

---

## 1. Qué pasó

La Fase 0 se cerró el 2026-08-12. Entre el 12 y el 17 de agosto la Fase 1 produjo **ocho direcciones
visuales completas** y quedó parada esperando que Marco eligiera una (D-018).

El 2026-08-17 llegó una **versión 2 completa del requerimiento**, con mockups que fijan pantallas
concretas. En términos del protocolo universal (§7) es un **fallo de producto**: el contrato de partida
estaba caduco y nadie lo había comprobado.

La ficha v2 **no es una fuente limpia**. Se contradice a sí misma, sus dos mockups se contradicen entre
sí, y ella misma abre seis preguntas sin responder. Buena parte del trabajo de abajo consiste en separar
lo que el requerimiento **afirma** de lo que el requerimiento **pregunta**, y de lo que solo **dibuja**
sin decir.

Esa distinción es la más importante de todo el documento:

- Lo que el **texto de la ficha** afirma es requisito.
- Lo que solo aparece en un **mockup** es una señal, no un requisito. Los mockups los generó una IA, se
  contradicen entre ellos y llevan el nombre de marca equivocado.
- Que un campo **falte** en un mockup no significa que se haya eliminado. La ficha llama «mínimos» a los
  campos que lista.

---

## 2. Qué confirma lo ya acordado

No cambia y no requiere acción:

- El módulo Burson, campo por campo, coincide con `docs/fase-0-concepcion.md` §9.
- Los estados propios de Burson siguen siendo independientes (D-012 intacta).
- La migración del histórico en Excel, sobre todo las coberturas de Johann.
- La organización cronológica por año y por mes.
- Cuentas individuales con permisos por perfil.
- Que administradores y supervisores **generen observaciones y hagan seguimiento** — esto respalda que
  el ciclo de observación siga existiendo, aunque ningún mockup lo dibuje.
- La app móvil de Play Store sigue siendo segunda etapa, fuera de esta entrega.
- Responsive en computadora, celular y tablet.
- Que el creador y el responsable de una actividad sean datos distintos (D-002 intacta).

**D-017 no está contradicha**, pero tampoco confirmada del todo: los mockups muestran la barra lateral
de escritorio que la decisión prevé, pero los tres son de escritorio y **ninguno confirma la barra
inferior en móvil**, que es la mitad que responde al mandato mobile-first.

---

## 3. Lo nuevo que el texto de la ficha afirma sin ambigüedad

Incorporado ya a `docs/fase-0-concepcion.md`. Ninguno contradice nada cerrado:

| # | Qué | Dónde |
|---|---|---|
| N-1 | **Sede** como atributo de la persona | §2 |
| N-2 | **Navegación por meses con contador** de actividades por mes | P-2 |
| N-3 | **Selector de año** | P-2 |
| N-4 | **Historial mensual en tabla**, con buscador, filtro por estado y paginación | P-10 |
| N-5 | **Exportar reporte mensual** | §1, P-10 |
| N-6 | **Enlace de OneDrive por actividad**: «Ver» va a la carpeta exacta de esa cobertura | §3, P-10 |
| N-7 | **Acciones por fila**: Ver y Editar | P-10 |
| N-8 | **Límite de caracteres** en la descripción (la ficha propone 500 como ejemplo) | §3 |
| N-9 | **Lenin** como actor y la dependencia externa de permisos de OneDrive | §2, P-10 |
| N-10 | **Identidad visual alineada a aunor.pe**, bajo el nombre correcto Rhino Audiovisuales | §1 |

N-6 y N-9 juntos introducen algo que la Fase 0 no contemplaba: **una dependencia externa que la
plataforma no controla**. Si alguien no tiene permiso en esa carpeta de OneDrive, «Ver» falla y la
plataforma no puede arreglarlo — solo explicarlo bien. Eso se diseña, no se descubre en producción.

Lo demás que aparece en la ficha o en los mockups **no entró en la Fase 0**, porque o está en conflicto
o la propia ficha lo deja como pregunta. Está en §4.

---

## 4. Los conflictos

Cada uno es una decisión. Ninguna se resuelve aquí; todas están en `docs/decisiones-pendientes.md` con
sus opciones y consecuencias.

### C-1 · Estados — D-019

**El conflicto más grave.** Hay cuatro modelos documentados y ninguno coincide con otro: dos estados en
la ficha original; Programada / En proceso / Finalizada en `preview.webp`; Pendiente / En revisión /
Completada en `preview (2).webp`; y los siete actuales.

Que los dos mockups no coincidan entre sí es evidencia de que **el cliente todavía no tiene el modelo
decidido**, no de que quiera tres estados.

De los siete estados cuelgan seis decisiones cerradas y **quince de los veintinueve criterios de
aceptación**. Ni «Por subir» ni «Cancelada» aparecen en ningún mockup.

### C-2 · Roles, nombres y sedes — D-020, D-021, D-022

El cuerpo de la ficha y los mockups no coinciden. Tres choques con consecuencias: aparece un rol
**Locuciones** que no existe en el modelo; **Martín** deja Operaciones, que se queda sin nadie; y
**Chiara/Kiara** deja Coordinación, lo que deja sin sujeto a D-011 y D-016. Además no se sabe si Chiara
y Kiara son la misma persona.

Son tres decisiones distintas y conviene no mezclarlas: **quiénes son las personas** (D-020), **qué rol
tiene hoy cada una** (D-021) y **cuál es el catálogo de roles** (D-022). Una persona puede cambiar de rol
sin que el catálogo cambie.

### C-3 · Archivos: OneDrive o subida propia — D-023

La nota de voz dice OneDrive enlazado; los mockups muestran subida directa de hasta 50 MB con contador
de archivos. Son dos arquitecturas distintas: la subida propia obliga a almacenamiento, cuotas,
respaldo y restauración de binarios, y toca las Fases 5, 8 y 9.

### C-4 · La pantalla roster y la seguridad — D-026

El flujo propuesto muestra, **antes de autenticar a nadie**, la lista completa del equipo con nombre,
rol, sede, estado, cuántas actividades tiene cada uno y cuándo actualizó por última vez. Después pide
solo una clave, sin usuario.

Choca con el bloque de seguridad de `CLAUDE.md` y con P-1 de la Fase 0, que exige que el error no revele
siquiera cuál de las dos cosas falló. El roster revela mucho más, y sin pedir nada.

**No estoy diciendo que no se haga.** Es una decisión de producto legítima y hay salidas intermedias.
Pero se toma sabiendo el precio, no por parecerse al mockup.

### C-5 · AUNOR: consulta o supervisión — D-033

La v2 describe la plataforma como «canal de comunicación y **supervisión** entre el equipo, los
colaboradores operativos, Autopista del Norte y Burson», y da a Lenin y a los autorizados por AUNOR una
«**vista de supervisión**».

Eso no es lo mismo que la consulta de solo lectura estrictamente separada que decidió la Fase 0 §8. Si
AUNOR pasa a poder actuar, deja de ser un lector externo y se convierte en un actor con permisos, lo que
cambia la separación de datos en servidor y las pruebas de la Fase 8.

### C-6 · Subir 50 MB con mala señal — D-036

La Fase 0 §10 promete que el borrador sobrevive a la caída de conexión y que reintentar no duplica. Está
escrita para un formulario **de texto**. Un vídeo de 50 MB desde la berma es otro problema: progreso,
reanudación, reintento, y un borrador que contiene un archivo a medio subir.

Sin decidirlo, la Fase 0 promete algo que no se cumpliría **justo en el escenario que el proyecto
declara difícil**.

### C-7 · El histórico bajo el requerimiento v2 — D-040

El botón «Ver» exige un enlace de OneDrive exacto **por actividad**. Las coberturas antiguas de Johann
casi seguro no lo tienen fila por fila, ni tienen tipo de servicio ni sede. Hay que decidir si esas
filas se importan incompletas, se rechazan, o entran marcadas como históricas con reglas más flojas.

### C-8 · «Tipo de servicio» contra los cinco tipos — D-027

Dos taxonomías compitiendo. Si conviven, hay que decir cuál manda en filtros, en la vista de AUNOR y en
la migración.

### C-9 · La dirección visual ya no es libre — D-031

Las ocho direcciones se encargaron **sin ninguna restricción de marca**, y por eso D-018 se planteó como
elección libre. La ficha v2 exige alinearse a la identidad de AUNOR, y los mockups ya proponen un
lenguaje concreto: azul marino muy oscuro, cian, verde lima y fotografía de autopista.

**D-018 queda suspendida, no cancelada.** Y las ocho maquetas se conservan: la dirección **D · Nocturna**
es la más cercana a ese lenguaje, así que adaptarla es una salida real.

### C-10 · Ubicación — D-029

Los mockups usan un solo campo **Lugar**. Conviene precisar que `CLAUDE.md` dice «**considerar**» los
seis campos y solo hace obligatorio `ubicacion_nombre` para grabación y operación: la posición actual ya
es intermedia, no maximalista.

### C-11 · Cosas que solo dibuja el mockup — D-032, D-039

La campana de **notificaciones**, la casilla «Recordar este equipo» y el enlace «¿Olvidaste tu clave?»
aparecen en los mockups y **no en el texto de la ficha**. No pueden tratarse como requisitos
confirmados, pero tampoco ignorarse: recuperar una clave y recordar un dispositivo son mecanismos de
seguridad que hoy no existen en el modelo.

### C-12 · «Tiempo real» — D-038

La ficha promete «seguimiento autónomo y en tiempo real». Si es lenguaje comercial, no cuesta nada; si
es literal, es infraestructura de realtime que `CLAUDE.md` prohíbe añadir sin necesidad demostrada.

### C-13 · El plazo

La ficha dice **10 días hábiles**. El plan tiene nueve fases con puertas de salida. No es una decisión
técnica, pero omitirlo sería esconderle a Marco algo que necesita al hablar con César.

---

## 5. Qué se ejecutó

| Archivo | Qué se hizo |
|---|---|
| `docs/incidentes.md` | Creado. Registra INC-001, que el protocolo §4 exigía y no existía |
| `docs/decisiones-pendientes.md` | D-018 suspendida; D-006 actualizada; **D-019 a D-040** abiertas con opciones y consecuencias, y separadas por quién debe contestarlas |
| `docs/decisiones.md` | Once decisiones marcadas **en revisión**, sin borrar ninguna; cuatro anotadas como intactas con matices |
| `docs/fase-0-concepcion.md` | Reabierta; §1 ampliada con lo confirmado; §2, §3, §4, §5, §7, §8, §9, §10 y §11 marcadas en revisión; P-10 añadida; conteos corregidos |
| `docs/fase-1-ux.md` | Marcada como suspendida, con qué queda sin base y qué no |
| `CLAUDE.md` | Anotación mínima y **no resolutiva**: marca sus secciones afectadas como línea base en revisión |
| `docs/estado.md` | Fase activa, siguiente acción y cifras corregidas |

Nada se sustituyó. Todo lo marcado sigue vigente hasta que Marco decida.

---

## 6. Lo que no se hizo, a propósito

- **No se resolvió ninguna decisión.** Veintidós abiertas; dieciséis necesitan al cliente.
- **No se sustituyeron los siete estados, los cinco tipos ni la lista de roles** en `CLAUDE.md`. Solo se
  marcaron. Cambiar la fuente de verdad antes de que exista respuesta sería inventarla.
- **No se retocó ninguna maqueta** ni se encargó una novena dirección.
- **No se escribieron criterios de aceptación nuevos** para lo que el requerimiento añade: escribirlos
  antes de cerrar D-019 y D-033 sería inventarse el producto.
- **No se empezó nada de Fase 2 ni de backend.**

---

## 7. Lo que Marco tiene que llevar al cliente

Las seis preguntas de la propia ficha, más cuatro que la ficha no vio:

1. **Los dos mockups se contradicen** en los estados: uno dice Programada / En proceso / Finalizada, el
   otro Pendiente / En revisión / Completada. ¿Cuál vale? ¿Y dónde quedan «Por subir» y «Cancelada»?
2. **«Vista de supervisión» para AUNOR**: ¿solo mira, o puede observar y comentar? De esto depende toda
   la separación de datos.
3. **Archivos de 50 MB desde el celular en vía**: ¿de verdad se van a subir vídeos desde el campo, o el
   material siempre pasa por OneDrive desde una computadora?
4. **El plazo de 10 días hábiles**, sabiendo el alcance real que describe la propia ficha v2.

Y un aviso que no es pregunta: los mockups llevan el nombre **«Midnight & RAS Audiovisuales»**, que es
un error del generador. El nombre es **Rhino Audiovisuales** y no debe llegar al producto.

---

## 8. Qué corrigió la auditoría de Codex

Se registra porque el protocolo §11 dice que la revisión independiente solo vale si es real, y porque
esconder las correcciones haría inútil el ejercicio la próxima vez.

**Errores de hecho encontrados:**

1. **El conteo de decisiones.** Se decía 17 cerradas; son **16** — D-006 nunca se cerró, su entrada en
   `decisiones.md` es un marcador. `estado.md` decía 17 y `fase-0-concepcion.md` decía quince: **tres
   cifras distintas y ninguna correcta**. Corregidas las tres.
2. **El conteo de criterios afectados.** Se decía trece; son **quince** (4, 5, 6, 7, 8, 9, 12, 13, 14,
   16, 17, 21, 22, 23 y 29), más el 19 que necesita corrección de redacción.
3. **`CLAUDE.md` sobre ubicación.** Se afirmaba que «exige» seis campos. Dice **«considerar»**, y solo
   hace obligatorio `ubicacion_nombre` para grabación y operación.
4. **El campo avance.** Se afirmaba que el requerimiento v2 lo eliminaba. **Lo conserva expresamente
   para Eduardo**, junto con la fecha estimada de entrega. Solo falta en el formulario del mockup, que
   es el panel de Johann. Era un error real y cambiaba el sentido de una decisión entera.

**Omisiones encontradas:**

5. **AUNOR** — la más grave. Se había clasificado como «confirma lo ya acordado» cuando la v2 le da una
   «vista de supervisión». Ahora es C-5 y D-033.
6. **Subir archivos con mala señal** — el choque entre 50 MB y el escenario en vía no se había visto.
   Ahora es C-6 y D-036.
7. **El histórico sin enlaces de OneDrive** — ahora es C-7 y D-040.

**Defectos de método encontrados:**

8. **El documento se contradecía a sí mismo**: varios elementos aparecían a la vez como «incorporable
   sin decisión» y como conflicto. La lista de §3 se ha recortado a lo que el **texto** de la ficha
   afirma sin ambigüedad.
9. **Decisiones planteadas de forma sesgada**: los estados se ofrecían como «siete, tres o cuál» en vez
   de mostrar los cuatro modelos; los roles mezclaban tres preguntas distintas; el avance se planteaba
   como conservar o eliminar cuando la pregunta real es para quién aplica; y la ubicación escondía la
   opción intermedia que ya estaba vigente.
10. **Decisiones reabiertas sin evidencia**: se marcaban D-002 y D-003 como afectadas porque el mockup
    no muestra campo «responsable». No se sostiene: es el panel personal de Johann y la ficha llama
    «mínimos» a sus campos. Ambas quedan intactas.
11. **`CLAUDE.md` sin anotar.** La versión anterior proponía no tocarlo. Como está **por encima** de
    `docs/` en la jerarquía, dejarlo limpio mientras `docs/` marca todo en revisión habría creado una
    contradicción de jerarquía: un documento inferior neutralizando en silencio a uno superior. Ahora
    lleva una anotación mínima que marca sin resolver.
12. **`docs/fase-1-ux.md` olvidado.** No estaba en la lista y contiene las nueve pantallas y la
    navegación derivadas del contrato anterior.

**Dónde la auditoría se equivocó:** Codex señaló que reabrir la Fase 0 era una decisión que Claude se
inventaba, porque cambiar la fase activa corresponde a Marco. En el fondo tiene razón en la forma —esa
autorización no puede vivir en el chat— pero no en los hechos: **Marco lo ordenó expresamente**. Queda
escrito al principio de este documento, que es exactamente lo que la observación pedía.
