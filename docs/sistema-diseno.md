# Sistema de diseño

El lenguaje visual del proyecto, extraído de la dirección aprobada en **D-031**: la pieza 2, «planilla
de rodaje».

**Este archivo manda.** Cualquier pantalla que se diseñe a partir de ahora usa estos valores. Si una
pantalla necesita algo que no está aquí, se añade aquí primero y se dibuja después.

**Por qué existe.** Las catorce pantallas móviles del bloque 1 salieron con cabeceras, avatares,
navegación, iconos, radios, sombras y marcas de estado **distintas entre sí**, porque no había ningún
sitio donde estuvieran fijadas. Cada pantalla se las inventó. Este archivo es la corrección de raíz de
ese defecto.

**La fuente es `diseno/piezas-png/pieza-2.png`**, que es **la imagen que Marco aprobó**. Es la única
referencia válida.

> ### ⚠ Corrección del 2026-08-17
>
> La primera versión de este archivo se extrajo del CSS de `diseno/escritorio/pieza-2.html`, dando por
> hecho que era la misma dirección. **No lo era.** El HTML y la imagen renderizan la misma idea de forma
> distinta, y Marco aprobó **la imagen**. De ese error salieron dos reglas que contradecían lo aprobado
> —una sombra dura y unas etiquetas de estado con contorno en vez de rellenas— y esas reglas se
> propagaron a las veintinueve pantallas ya dibujadas.
>
> **Regla que se deriva:** cuando exista una maqueta y una imagen de la misma dirección, **manda la
> imagen que Marco miró y aprobó**. Y la deriva se mide siempre **contra ella**, nunca contra la entrega
> anterior: comparar cada tanda con la previa deja pasar un desvío pequeño cada vez, y el acumulado es
> el que se nota.
>
> `pieza-2.html` sigue sirviendo para **una sola cosa**: leer valores hexadecimales concretos. Para
> forma, composición y peso visual, manda el PNG.

---

## 1. El carácter

Una **planilla de producción audiovisual**: claquetas, marcas de tiempo, fichas de rodaje. Fondo claro,
tinta azul oscura, todo alineado. **El orden es la estética** — no hay gestos gráficos decorativos.

Tres rasgos que la distinguen y que no se pueden perder:

- **Plana y limpia.** Tarjetas de **fondo blanco con borde fino gris**, sin sombra o con una sombra
  apenas perceptible. **No lleva sombras duras desplazadas**: eso fue un error de la primera versión de
  este archivo y hay que quitarlo de las pantallas que lo tengan.
- **Bordes firmes y esquinas poco redondeadas.** Radio **4 a 6 px**.
- **Alineación estricta.** Las columnas se alinean entre secciones. Un dato numérico va con cifras de
  ancho fijo cuando comparte columna con otros.

---

## 2. Color

| Papel | Uso | Valor |
|---|---|---|
| Fondo de página | El lienzo | `#e8eef2` |
| Panel | Tarjetas, fichas, filas | `#ffffff` |
| Panel secundario | Cabeceras de tabla, zonas apagadas | `#edf3f6` |
| Línea | Bordes y separadores | `#9fb1bd` |
| Tinta | Todo el texto principal | `#12213a` |
| Tinta apagada | Etiquetas, datos secundarios | `#536879` |

| Acento | Uso | Valor |
|---|---|---|
| Azul | Acción principal, enlaces, elemento activo | `#155eef` |
| Ámbar | Acción destacada y avisos que no son error | `#f4b41a` |
| Rojo | Alerta, observación, error | `#c83b4d` |

**Tipografía:** `Arial, "Helvetica Neue", sans-serif`. Una sola familia. La jerarquía la hacen el
tamaño y el peso, no cambiar de fuente.

---

## 3. Los siete estados — **fijados, no negociables**

Esta es la tabla que impide que cada pantalla invente sus marcas. **Un estado se ve igual en todas
partes**: misma etiqueta, mismo color, mismo fondo, mismo signo.

**Son píldoras SÓLIDAS: fondo de color saturado y texto blanco.** Así están en la imagen aprobada. No
son etiquetas con contorno y fondo pálido — eso fue el error de la primera versión de este archivo.

| Estado | Fondo de la píldora | Texto | Signo |
|---|---|---|---|
| Programada | rojo `#c83b4d` | blanco | círculo vacío `○` |
| En proceso | turquesa `#2bb3ac` | blanco | triángulo `▶` |
| Por subir | ámbar `#f4b41a` | tinta `#12213a` | flecha arriba `↑` |
| Entregada | azul `#155eef` | blanco | check `✓` |
| **Observada** | rojo intenso `#c8102e` | blanco | admiración `!` |
| Aprobada | verde `#7ac143` | tinta `#12213a` | estrella `★` |
| Cancelada | gris `#9aa5ac` | blanco | aspa `×` |

**Ninguno se distingue solo por el color.** Cada uno lleva su signo dentro de la píldora. Es
deliberado: estas pantallas se leen a pleno sol y hay daltonismo.

**Observada es la más fuerte de las siete.** Cuando una actividad está Observada, además de la etiqueta:
la fila o tarjeta lleva **barra roja a la izquierda**, **fondo rosado** y la **barra de avance en rojo**.
Tiene que encontrarse sin buscarla — es la señal de «esto te está esperando».

---

## 3 bis. Las otras dos familias de estado, y el feedback del cliente

Tres huecos que aparecieron al dibujar las pantallas de escritorio (E-008) y que el sistema no cubría.
Se fijan aquí para que no vuelvan a improvisarse.

### Lo que ve AUNOR: cinco grupos, no siete estados

AUNOR **nunca ve los siete estados internos**. Ve cinco grupos, y esa es la razón de que exista la
agrupación de `docs/fase-0-concepcion.md` §8:

| AUNOR ve | Recoge los estados internos | Marca |
|---|---|---|
| Programada | Programada | círculo `○`, gris azulado |
| **En trabajo** | En proceso · Por subir · **Observada** | triángulo `▶`, azul |
| Entregada | Entregada | check `✓`, verde azulado |
| Aprobada | Aprobada | estrella `★`, verde |
| Cancelada | Cancelada | aspa `×`, gris, tachado |

**«En trabajo» usa la marca de En proceso**, en azul. Que *Observada* se esconda ahí dentro es
deliberado: AUNOR debe saber que algo sigue en curso, no que hubo una observación interna. **Nunca se
dibuja la marca roja de Observada en una pantalla de AUNOR.**

### Los cinco estados de Burson

Burson tiene su **propia máquina de estados** (D-012) y no se mezcla con la de actividades. Se dibujan
más compactos que los siete, para que nadie los confunda de un vistazo:

**Solicitado · En proceso · Entregado · Aprobado · Cancelado**

Usan la misma paleta pero **sin los signos** de los siete estados. En el tablero de Burson lo que manda
visualmente no es el estado: son las columnas **pendientes de Rhino** y **pendientes de Burson**, que
son el motivo de existir del módulo.

### El feedback de AUNOR no se parece a una observación

Son dos cosas distintas y **no pueden confundirse nunca** (D-033, D-041):

| | Observación interna | Feedback de AUNOR |
|---|---|---|
| Color | **Rojo** `#c83b4d` | **Azul** `#155eef` |
| Etiqueta | «Observación» con el nombre de quien la escribió | **«AUNOR · opinión del cliente»** |
| ¿Cambia el estado? | Sí, la actividad pasa a Observada | **No** |
| Acciones | Resolver | **Descartar · Responder · Convertir en observación interna** |

En la bandeja de feedback va además **un aviso permanente**: *el feedback de AUNOR no cambia el estado
de las actividades y no llega directo al colaborador*. Es la regla que sostiene que Rhino siga siendo
quien controla a sus operarios, y conviene que esté escrita en la pantalla, no solo en un documento.

---

## 4. Elementos que se repiten y no pueden cambiar entre pantallas

| Elemento | Cómo es |
|---|---|
| **Cabecera** | «Rhino Audiovisuales» a la izquierda en tinta. A la derecha, avatar y nombre del usuario. Igual en todas |
| **Avatar** | Cuadrado de esquinas suaves, fondo ámbar, iniciales en tinta. **Siempre así** |
| **Navegación móvil** | Barra inferior fija. Icono arriba, texto debajo. El destino activo en azul con subrayado |
| **Navegación escritorio** | La misma barra pasa a lateral izquierda. El destino activo en azul con barra a la izquierda |
| **Botón principal** | Fondo ámbar, texto en tinta. Uno por pantalla |
| **Botón secundario** | Fondo blanco, borde de línea, texto azul |
| **Campo de formulario** | Etiqueta **encima** del campo, nunca al lado. Obligatorio marcado con asterisco rojo |
| **Ficha / tarjeta** | Fondo blanco, borde fino gris, radio 4-6 px. **Plana, sin sombra dura** |
| **Tarjeta de resumen** | Icono grande en cuadro de color a la izquierda, y a la derecha la cifra grande, su etiqueta y una línea de detalle debajo. **No es solo un número** |
| **Fila de meses** | **Los doce meses del año**, con el número de actividades debajo de cada uno y el activo en azul sólido. No se recortan a los meses con datos |
| **Estado vacío** | Mensaje que no culpa a nadie y la acción que corresponde |
| **Estado de carga** | Esqueletos grises **con la misma forma y el mismo número** que el contenido real |
| **Estado de error** | Qué pasó, y botón de reintentar |

**La etiqueta encima del campo** es importante en móvil: ponerla al lado deja el campo estrecho y
convierte el formulario en algo imposible de usar con una mano.

---

## 5. Reglas de negocio que el diseño no puede contradecir

Aquí no se dibuja lo que se quiere: hay reglas que ya están decididas. Estas son las que más fácil se
rompen al diseñar.

- **«Aprobar» no existe sobre una actividad Observada.** Solo se aprueba desde **Entregada** y **sin
  observaciones abiertas** (`docs/fase-0-concepcion.md` §5). Sobre una Observada, supervisión puede
  resolver o cancelar, nada más. *Este error ya se cometió una vez, en el encargo E-007.*
- **Una acción que el rol no puede ejecutar no se dibuja**, ni siquiera desactivada. Un colaborador no
  ve «Observar», «Aprobar» ni «Cancelar».
- **Una actividad Aprobada está cerrada.** No se edita.
- **El feedback de AUNOR no es una observación interna** (D-033). Se distinguen a simple vista, y el del
  cliente **no cambia el estado de nada**.
- **No existen adjuntos**, ni contador de archivos, ni descargar (D-023). El material es **un enlace** a
  una carpeta de OneDrive.
- **Las tarjetas de resumen son cuatro:** actividades, programadas, en proceso, finalizadas. No hay
  «alertas activas» ni «recursos asignados».
- **Rhino es una productora.** Sus actividades son coberturas, grabaciones, ediciones y piezas — no
  operativos de radar ni control de tráfico, que es el trabajo de la concesionaria.

---

## 6. Anchos

| | Referencia | Manda |
|---|---|---|
| Móvil | 390 px | **Sí** — es el caso difícil: una persona en vía, con una mano |
| Laptop | 1280 px | |
| Escritorio | 1440 px | |

El orden de diseño lo fija **D-042**: primero móvil, luego laptop y escritorio. Cuando se diseñe primero
en escritorio por conveniencia, la versión móvil **no es la estrecha**: se replantea.
