# E-006 — Cinco direcciones visuales en PNG

**Fase:** 1 — UX y desarrollo visual
**Ejecuta:** Codex
**Estado:** encargado
**Fecha:** 2026-08-17
**Formato:** OCRAV
**Sustituye a:** E-005, cuyas cinco maquetas HTML se conservan como referencia de contenido exacto

---

```
┌─────────────────────────────┐
│ 1. OBJETIVO                 │
└─────────────────────────────┘
```

Producir **cinco imágenes PNG**, una por dirección visual, que permitan a Marco **elegir el lenguaje
visual definitivo** de la plataforma mirándolas una al lado de otra.

Cada PNG muestra **la misma pantalla** —el panel de trabajo en escritorio— con **cinco estéticas
distintas**. Lo único que cambia entre ellas es el aspecto.

Resuelve **D-031**, y con ella **D-018** y la puerta de salida de la Fase 1.

Rutas exactas de salida:

```
diseno/piezas-png/pieza-1.png
diseno/piezas-png/pieza-2.png
diseno/piezas-png/pieza-3.png
diseno/piezas-png/pieza-4.png
diseno/piezas-png/pieza-5.png
```

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

**El producto.** Plataforma web interna de **Rhino Audiovisuales**, una productora peruana que trabaja
para **Autopista del Norte (AUNOR)**, una concesionaria de autopista. Sirve para que el equipo registre
las grabaciones, ediciones, coordinaciones y operaciones que hace en la vía, para que supervisión las
revise y apruebe, y para que AUNOR consulte el avance del mes.

**La pantalla a dibujar** es el panel de trabajo en escritorio, y contiene:

- cabecera oscura o de acento con el nombre **Rhino Audiovisuales** y un avatar de usuario;
- **barra lateral izquierda** con cuatro destinos y un selector de año;
- **fila de meses** en horizontal, con un número debajo de cada mes y el mes activo destacado;
- **cuatro tarjetas de resumen** con cifras grandes;
- una **tabla de actividades** con unas seis filas, con columna de fecha, título, lugar, una **etiqueta
  de estado de color** por fila, e iconos de acción al final;
- un buscador y un botón de exportar.

**Referencia exacta del contenido.** Las cinco maquetas HTML de `diseno/escritorio/pieza-1.html` …
`pieza-5.html`, ya producidas y verificadas, contienen esta pantalla con el texto y los datos correctos.
**Ábrelas y úsalas como referencia de composición y de paleta**: cada PNG debe corresponder a la pieza
HTML de su mismo número.

**Las cinco direcciones**, una por imagen:

| # | Tesis |
|---|---|
| 1 | **Autopista nocturna.** Azul marino casi negro, cian eléctrico y verde lima. Sensación de centro de control vial de noche. Es la propuesta del propio cliente. |
| 2 | **Planilla de rodaje.** Luminosa, fondo claro, inspirada en claquetas, marcas de tiempo y documentos de producción audiovisual. |
| 3 | **Mapa de flujo.** Rutas, nodos y bandejas conectadas; el diseño hace visible qué tiene que ocurrir después. |
| 4 | **Cabina de postproducción.** Consola oscura, formas de onda, marcadores de edición. Ambiente de sala de montaje. |
| 5 | **Mesa de montaje.** Fichas recortadas, bordes contundentes, marcas físicas de revisión sobre papel. |

**Cómo generar.** Usa **gpt-image-2** sobre la suscripción. El script `~/.claude/scripts/genimg.sh` **no
está instalado en esta máquina**, así que genera las imágenes tú directamente y escríbelas en las rutas
exactas del bloque 1.

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No** escribas «Midnight», «RAS» ni «Midnight & RAS Audiovisuales». El nombre es **Rhino
Audiovisuales**. Los mockups del cliente traen ese error y no debe propagarse.

**No** inventes logotipos de Rhino ni de AUNOR. El nombre en texto basta.

**No** dibujes móvil ni tableta. Solo escritorio, formato horizontal.

**No** modifiques ningún archivo fuera de `diseno/piezas-png/`. En concreto, **no toques**
`diseno/escritorio/`, `diseno/direccion-*.html`, `docs/`, `CLAUDE.md` ni `protocolo-universal-v4.md`.

**No** crees `package.json`, `node_modules` ni ningún andamiaje. Esta fase no instala nada.

**No** hagas commits.

**No** repitas territorio visual: si dos de las cinco resultan intercambiables, el encargo falla.

**No** hagas las cinco oscuras. Las direcciones **2, 3 y 5 son de fondo claro**; solo la 1 y la 4 son
oscuras.

**No** dibujes elementos que el producto no tiene: nada de gráficos de barras, nada de mapas, nada de
adjuntar archivos, nada de contador de archivos, nada de botón de descargar.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

El encargo está bien hecho cuando:

1. Existen los **cinco PNG** en las rutas exactas del bloque 1, y abren sin corromperse.
2. Cada imagen es **horizontal**, de al menos **1536 px de ancho**, y se lee cómodamente al 100 %.
3. Las cinco muestran **la misma pantalla y la misma composición**: cabecera, barra lateral, fila de
   meses, tarjetas de resumen y tabla. Un mismo producto cinco veces, no cinco productos.
4. Las cinco son **inconfundibles entre sí**: puestas en fila, se distinguen de un vistazo por color,
   tipografía y forma.
5. Cada imagen corresponde a la tesis de su número, según la tabla del bloque 2.
6. Se ven **etiquetas de estado de colores distintos** en las filas de la tabla — son lo que da vida a
   la pantalla y lo que Marco va a mirar primero.
7. La imagen se lee como **una herramienta de trabajo profesional**, no como una app de consumo ni como
   un panel de videojuego.

**Sobre el texto:** un modelo de imagen no escribe texto fiable, y eso se acepta. No se te va a exigir
que las palabras sean legibles ni correctas. **Sí se te exige** que en ningún sitio aparezca «Midnight»
ni «RAS», y que la composición y el color transmitan la dirección visual.

**«Mejor» que el intento anterior significa:** más resuelta, más específica de este producto, y con más
carácter. Cinco imágenes tibias y parecidas serían peor que cinco maquetas HTML.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

Antes de reportar, comprueba y di el resultado de cada punto:

1. `ls diseno/piezas-png/` devuelve exactamente cinco archivos `.png`.
2. Cada archivo pesa más de 100 KB y sus dimensiones son de al menos 1536 px de ancho.
3. Abre las cinco y descríbelas: para cada una, di qué paleta se ve, si el fondo es claro u oscuro, y si
   se distingue de las otras cuatro.
4. Confirma que las direcciones 2, 3 y 5 salieron de fondo claro y la 1 y la 4 oscuras.
5. Mira si en alguna aparece texto que diga «Midnight» o «RAS». Si aparece, **regenera esa imagen**.
6. `git status` no muestra cambios fuera de `diseno/piezas-png/`.

**Reporte:** corto. Resultado, los cinco archivos, la verificación punto por punto, la descripción de
cada imagen en una línea, y qué imagen te costó más y por qué.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo en el reporte. **No inventes reglas de producto.**
