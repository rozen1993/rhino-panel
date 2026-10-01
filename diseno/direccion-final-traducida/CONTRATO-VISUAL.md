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

## Ronda local aprobada — 22 de septiembre de 2026

Referencia aprobada: `docs/propuestas-operario-historico-2026-09-22/`.
Histórico adopta la propuesta D, corte panorámico: dos franjas fotográficas
Grabación / Edición con texto sobre azul noche y acento cian / naranja. Se
retiran «VS» y «Ver todo el Histórico»; no se cambian los calendarios ni sus
permisos. Las fotografías siguen siendo ilustrativas. No se incorporan entradas
para Creatividad o Locución ni se borran sus registros existentes.

Las modalidades son casillas nativas dentro de opciones con iconos del sistema,
selección cian suave y foco visible. No se preseleccionan modalidades ni cambia
la obligación de elegir al menos una para planificar Grabación.

En la ficha, las modalidades describen la actividad desde su cabecera. Entrega
e inicio conservan su jerarquía. La gestión propia aparece debajo: «Editar
actividad» y «Eliminar actividad», ambos centrados, misma altura y peso,
icono y etiqueta sin flecha adicional; edición cian y baja rojo oscuro.
En móvil, cabecera de actividad, acciones y contenido mantienen ese orden.

Eliminar significa enviar a Papelera con motivo y confirmación recuperable.
El permiso se exige en la interfaz, Server Action y RPC: Operario activo con
creación propia vigente, autor original, responsable actual y estado Programada.
No concede gestión de Papelera, restauración, reinicio ni eliminación definitiva.
El diálogo inicia el foco en Cancelar y lo devuelve al cerrar.

Marca vigente: **DA VINCI**. Esta ronda no autoriza publicación, cambios de
contraseña reales ni uso de registros reales como pruebas.

## Contrato Aunor — propuesta 02 elegida el 29 de septiembre de 2026

Referencia: `docs/propuestas-contrato-aunor-2026-09-29/`.
Se adopta **Tarjetas por servicio**: selector de mes, cuadrícula mensual con X/Y
y cumplimiento por servicio, y tarjetas anuales compactas en una sección independiente.
Cada tarjeta abre un detalle de consulta con entregas; se conservan los avisos
de sustituciones, trabajos no computables y asignaciones pendientes. El verde
indica meta alcanzada y el cian cumplimiento parcial. No se aplica un porcentaje global
mezclando servicios. Un periodo o una meta no confirmados nunca se inventan.

La adaptación móvil usa una columna y diálogo con desplazamiento propio, cierre
por Escape y retorno del foco. Aunor sigue siendo solo consulta, sin responsables
internos ni acciones de administración. La implementación de esta ronda es local;
no autoriza modificar datos reales ni publicar automáticamente.

## Estado Entregada — opción 01 aprobada

Marco eligió Verde sólido entre las tres propuestas de
`docs/propuestas-estado-entregada-2026-09-29/`. El indicador compartido utiliza
fondo y borde #216337, texto blanco y check decorativo del sistema, radio de
5 px y altura mínima de 28 px. No es un botón ni introduce aprobación del
cliente o aceptación contractual. Programada, En proceso y los sellos de
clasificación mantienen su diseño.

## Ficha Admin — opción 01 aprobada el 30 de septiembre de 2026

Referencia: `docs/propuestas-ficha-admin-2026-09-30/01-escritorio.png`.
La gestión contractual usa una ficha compacta blanca con borde cian superior:
servicio y periodo juntos, vista previa de X/Y a la derecha y una sola acción
lima «Guardar relación». El resumen público es opcional y plegable.
Reemplazo e historial se presentan como filas desplegables con iconos del
sistema; en móvil las acciones pasan bajo el texto para evitar columnas estrechas.
La llamada se registra dentro del reemplazo, no como una tarea obligatoria
independiente. Las versiones, trabajos no realizados y correcciones anteriores
siguen disponibles en opciones adicionales. Aunor no confirma ni aprueba.
El conteo distingue datos guardados y previsualizados; la clasificación Especial
no multiplica unidades. Guardar la relación no cambia el estado de ejecución.
Servicio/periodo y acuerdo/reemplazo se guardan atómicamente en sus respectivos
flujos. Esta ronda es local: no autoriza publicación ni cambios de datos reales.

## Registro histórico y centro de contrato — aprobación posterior del 30/09/2026

Marco aprobó las propuestas 01 y 02 de `docs/propuestas-mejoras-2026-09-30/`
y autorizó su sincronización con Vercel. Se mantiene el sistema visual vigente:
tarjetas blancas con borde cian, tipografía condensada de interfaz, navegación
azul noche, confirmación lima y estado Entregada verde sólido.

Admin dispone de «Registrar trabajo terminado» y «Contrato». El primer flujo
requiere revisión y confirmación, material final y clasificación explícita,
sin simular el inicio de un Operario. Grabación, Locución y Creatividad usan
fecha de realización; Edición, fecha de entrega del proyecto. Las jornadas
múltiples siguen disponibles sin añadir una segunda fecha de entrega.

El centro muestra los ocho servicios mensuales y los cuatro anuales, con X/Y,
detalle de trabajos y excepciones. Aunor conserva su diseño y acceso de consulta;
las nuevas herramientas de gestión no están disponibles para Operario ni Aunor.
Las propuestas 03–05 no están incluidas en esta aprobación.
