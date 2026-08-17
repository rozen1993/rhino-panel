# Sistema de diseño

El lenguaje visual del proyecto, extraído de la dirección aprobada en **D-031**: la pieza 2, «planilla
de rodaje».

**Este archivo manda.** Cualquier pantalla que se diseñe a partir de ahora usa estos valores. Si una
pantalla necesita algo que no está aquí, se añade aquí primero y se dibuja después.

**Por qué existe.** Las catorce pantallas móviles del bloque 1 salieron con cabeceras, avatares,
navegación, iconos, radios, sombras y marcas de estado **distintas entre sí**, porque no había ningún
sitio donde estuvieran fijadas. Cada pantalla se las inventó. Este archivo es la corrección de raíz de
ese defecto.

**Fuente de los valores:** `diseno/escritorio/pieza-2.html`, que es la maqueta con los hexadecimales
reales, y `diseno/piezas-png/pieza-2.png`, que es la imagen aprobada.

---

## 1. El carácter

Una **planilla de producción audiovisual**: claquetas, marcas de tiempo, fichas de rodaje. Fondo claro,
tinta azul oscura, todo alineado. **El orden es la estética** — no hay gestos gráficos decorativos.

Tres rasgos que la distinguen y que no se pueden perder:

- **Sombra dura, sin desenfoque.** `8px 8px 0 rgba(18,33,58,.13)`. Es la sombra de una ficha de papel
  apoyada sobre otra, no la de una tarjeta flotante. Es lo primero que se pierde al improvisar.
- **Bordes firmes y esquinas poco redondeadas.** Radio máximo **6 px**. Nada de píldoras ni de tarjetas
  muy redondeadas.
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

| Estado | Texto | Fondo | Signo | Extra |
|---|---|---|---|---|
| Programada | `#455967` | `#eef2f5` | círculo vacío `○` | — |
| En proceso | `#1249b7` | `#e7edff` | triángulo `▶` | — |
| Por subir | `#755000` | `#fff3cc` | flecha arriba `↑` | **borde discontinuo** |
| Entregada | `#006154` | `#e1f7f1` | check `✓` | — |
| **Observada** | `#9e2639` | `#fff0f1` | admiración `!` | **borde de 2 px + barra roja a la izquierda** |
| Aprobada | `#315a00` | `#edf7db` | estrella `★` | — |
| Cancelada | `#525b62` | `#edf0f2` | aspa `×` | **texto tachado** |

**Ninguno se distingue solo por el color.** Cada uno lleva su signo, y tres llevan además una marca de
forma. Es deliberado: estas pantallas se leen a pleno sol y hay daltonismo.

**Observada es la más fuerte de las siete.** Cuando una actividad está Observada, además de la etiqueta:
la fila o tarjeta lleva **barra roja a la izquierda**, **fondo rosado** y la **barra de avance en rojo**.
Tiene que encontrarse sin buscarla — es la señal de «esto te está esperando».

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
| **Ficha / tarjeta** | Fondo blanco, borde de línea, radio 6 px, sombra dura |
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
