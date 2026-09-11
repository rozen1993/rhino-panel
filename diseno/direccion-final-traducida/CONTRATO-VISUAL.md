# Contrato visual — dirección final traducida

## Autoridad y alcance

Las tres imágenes de `diseño_final/` son la referencia visual principal. Este contrato traduce ese lenguaje al modelo funcional vigente sin incorporar perfiles, estados, adjuntos ni exportaciones que solo aparezcan en las imágenes.

La marca provisional permanece como **Rhino Audiovisuales** hasta que Marco indique otro nombre o entregue recursos oficiales.

## Sistema

| Token | Valor | Uso |
|---|---:|---|
| Noche profunda | `#021326` | Fondos de acceso y navegación |
| Azul técnico | `#031D36` | Cabeceras y superficies oscuras |
| Cian operativo | `#11B7C9` | Identidad, enlaces y actividad |
| Lima acción | `#84D600` | Acción primaria y selección |
| Azul proceso | `#2563EB` | Estado En proceso: insignia sólida con texto blanco |
| Naranja categoría | `#FF9F1C` | Edición en el calendario; no representa el estado |
| Violeta agenda | `#8B5CF6` | Programación y fechas |
| Superficie | `#F4F7F8` | Área de trabajo |
| Tinta | `#10233F` | Texto principal |

El violeta de agenda `#8B5CF6` se conserva como marcador e identidad. Cuando
el violeta lleva texto blanco se usa la variante sólida accesible `#7C3AED`;
cuando funciona como texto sobre una superficie clara se usa `#5B2BB5`. Estas
dos variantes mantienen el significado visual y evitan combinaciones que no
alcanzan el contraste WCAG AA.

- Identidad: familia condensada de alto peso, usada solo en títulos de marca.
- Interfaz: Segoe UI/Arial, con números tabulares para datos.
- Radios: 6–12 px; botones primarios de 6 px, tarjetas de 10 px.
- Sombras: cortas y frías; la jerarquía se apoya principalmente en borde y contraste.
- Firma: líneas de rutas técnicas sobre azul noche, con acentos cian y lima.

## Traducción funcional

- **Operario:** actividades asignadas; cambia estado, enlace HTTPS y opinión.
- **Operario autorizado:** lo anterior y un CTA contextual para crear una
  actividad propia; no conserva una pestaña permanente de creación.
- **Operario especial:** ejecuta además los encargos Burson asignados.
- **Admin:** planificación y asignación, panorama completo, cuentas, conversación
  privada, papelera e Histórico anual.
- **Burson:** creación y seguimiento de encargos asignados al operario especial.
- Estados únicos: `Programada`, `En proceso`, `Entregada`.
- No se representan cargas de archivos; se usa enlace OneDrive/SharePoint.
- El Histórico continúa siendo anual y admite fechas discontinuas.

## Responsive

- Móvil: cabecera compacta, navegación inferior y contenido en una columna.
- Tablet: navegación lateral compacta, dos columnas y paneles deslizables.
- Laptop: navegación lateral completa, malla operativa densa.
- PC: mayor respiración y detalle persistente en Histórico.

## Criterios de aprobación

1. Reconocible como la misma familia visual de los tres JPEG.
2. Ninguna pantalla contradice el modelo de tres roles.
3. Las acciones primarias lima se reservan para crear, guardar o cambiar de estado.
4. Estados distinguibles sin depender exclusivamente del color.
5. Lectura y operación viables desde 390 px hasta 1920 px.

## Ajuste solicitado por Marco — 11 de septiembre de 2026

Respaldo previo de código: `afc6d39`. En proceso pasa del violeta al azul
`#2563EB`, conservando el signo ◐ y el texto del estado; el mismo token se usa
en insignias, bordes de actividades y contador. No se redefine el cian de marca
ni el violeta de agenda. Blanco sobre este azul ofrece aproximadamente 5,17:1
de contraste.

El panel interno del Histórico mantiene la columna lateral, el calendario
1/2/4 y el diálogo móvil. La fecha seleccionada encabeza una lista de tarjetas
con categoría, estado, título, dos líneas de descripción, responsable y lugar
resumido. «Ver detalles» muestra el contenido íntegro y todas las jornadas.
La opinión y el código técnico se consultan en secciones desplegables; los
títulos coincidentes mantienen una referencia visible para distinguirlos.
Volver restaura la lista, el foco y su desplazamiento. No se elimina ni modifica
ningún dato para simplificar su presentación.
