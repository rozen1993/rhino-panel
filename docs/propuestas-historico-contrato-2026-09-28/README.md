# DA VINCI — propuestas para revisión, 28/09/2026

Estado: **propuesta visual, pendiente de aprobación antes de implementar**.
Respaldo de código previo: `7b1fc22`. Solo se han añadido artefactos dentro de
esta carpeta. No hay cambios de aplicación, migraciones, push o despliegue.
No se ha clasificado, regularizado ni eliminado ninguna actividad real.

Abrir [galería local](index.html?vista=galeria). Las cifras de avance y los
trabajos de las maquetas son ficticios. No representan un cálculo de producción.

## PNG para aprobar

| Propuesta | Escritorio | Móvil |
|---|---|---|
| Marcaje en Histórico | [PNG](01-historico-escritorio.png) | [PNG](01-historico-movil.png) |
| Formulario de Edición | [PNG](02-edicion-escritorio.png) | [PNG](02-edicion-movil.png) |
| Contrato mensual | [PNG](03-contrato-mensual-escritorio.png) | [PNG](03-contrato-mensual-movil.png) |
| Contrato anual sin meta configurada | [PNG](04-contrato-anual-escritorio.png) | [PNG](04-contrato-anual-movil.png) |
| Regularización histórica | [PNG](05-regularizacion-escritorio.png) | [PNG](05-regularizacion-movil.png) |
| Marcaje en ficha, ejemplo reducido | [PNG](08-ficha-escritorio.png) | [PNG](08-ficha-movil.png) |

Ampliaciones: [tarjeta Especial](06-marcaje-detalle.png) y
[exceso de cumplimiento 15/10](07-contrato-excedente.png).

## Dirección visual

Aplicación operativa audiovisual; cada vista debe ayudar a identificar el tipo
de esfuerzo o comprobar un compromiso, sin rediseñar la plataforma.

- Noche `#021326`, azul técnico `#031D36`, cian `#11B7C9`, lima `#84D600`,
  superficie `#F4F7F8`, tinta `#10233F`.
- Se reutiliza el violeta accesible del contrato visual: `#5B2BB5` para Especial
  sobre una superficie muy suave; no sustituye el color de categoría o estado.
- Títulos Bahnschrift SemiCondensed / Arial Narrow, interfaz Segoe UI y datos
  Consolas. Bordes, radios, textura técnica y proporciones siguen la familia
  visual ya aprobada. No se añaden fotografías ni recursos externos.
- Firma: pequeño rombo junto al texto «Especial», repetido en el día del
  calendario que contiene al menos una. La forma y la palabra explican el
  significado sin depender únicamente del color. Se conserva el contador diario.
- Estándar: etiqueta neutra; Sin clasificar: borde discontinuo. Estado de entrega
  en otra posición, para no confundir complejidad con avance.
- Histórico: calendario a la izquierda y actividades del día a la derecha.
  En móvil, el PNG muestra el mes consultado y las tarjetas debajo como recorte
  de revisión del marcaje; no propone eliminar los otros meses del calendario real.
- Contrato: lista de puntos con numerador/denominador a la izquierda; servicio,
  avance y meses a la derecha. En móvil, el punto seleccionado queda visible y
  el resto se agrupa en un desplegable para llegar antes al detalle.

La revisión descartó pintar toda la tarjeta de violeta o usar un «×2» automático:
invadiría la jerarquía existente y sugeriría una equivalencia no aprobada.
El progreso se limita visualmente a una barra llena, pero conserva 15/10 y
«5 adicionales». No hay un porcentaje global que mezcle distintas unidades.

## Decisiones aceptadas por Marco

1. Estándar / Especial. Solo Admin asigna o corrige, con trazabilidad.
2. Especial no suma doble sin una equivalencia expresamente acordada con Aunor.
3. Las actividades anteriores permanecen Sin clasificar hasta su revisión.
4. El distintivo se extiende a Histórico, ficha y listados, incluido Aunor.
   Aunor no recibe identidad del operario ni controles administrativos.
5. Edición deja de pedir lugar/referencia y descripción. Usa una fecha prevista
   de entrega en vez de jornadas. No se altera la ejecución de Grabación.
6. Datos y jornadas de ediciones existentes se conservan; no se convierten ni
   sobrescriben automáticamente. La fecha prevista no es la efectiva.
7. X cuenta trabajos Entregados vinculados; pendientes se presentan separados.
8. Admin confirma el periodo al vincular. Se puede sugerir, no asignar en silencio.
9. El excedente permanece en su periodo, sin arrastre automático.
10. Los puntos anuales se rigen por la vigencia del contrato, no necesariamente
    enero–diciembre. Metas, inicio y fin deben estar confirmados.
11. Regularizar trabaja sobre la actividad existente, sin duplicar ni inventar
    entrega efectiva. Quedan separados el momento de registro y el hecho histórico.

## Hallazgo de la revisión contractual

Consulta remota de **solo lectura** el 28/09/2026: los 12 servicios existen.
`private.aunor_services` contiene únicamente `id`, `position`, `label` y
`reference`. No hay cantidad, periodicidad ni vigencia almacenadas en esa tabla.
El tipo `AunorService` y la vista `Agreed` del código actual reflejan ese mismo
modelo; la interfaz expresa que todavía no calcula cumplimiento.

La meta de 10 coberturas/mes proviene de la indicación explícita de Marco, no
de un dato ya configurado. El ejemplo Micronews 1/1 debe confirmarse como cuota;
por eso el prototipo no lo impone. Ver [tabla por confirmar](METAS-POR-CONFIRMAR.md).

## Antes de la implementación

- Aprobar estos visuales y completar la tabla de metas/vigencia.
- Diseñar cambios aditivos de esquema, conservando datos previos. Contadores
  por periodo asignado, sin inferir el mes desde `created_at` o la carga actual.
- Evitar duplicados de jornadas, revisiones de publicación y reemplazos. Un
  original no realizado no debe sumarse además del sustituto. Papelera excluida.
- No usar el recorte de actividades recientes de Aunor para calcular contrato:
  debe incluir todo el periodo, aunque hayan pasado tres días desde la entrega.
- Separar fecha de jornada, entrega prevista, entrega efectiva y regularización.
  Revisar restricciones existentes antes de permitir Entregada sin fecha efectiva;
  no rellenar `delivered_at` con hoy ni con una jornada para sortear validaciones.
- Revisar privacidad de lecturas y permisos en interfaz, servidor y RPC/RLS.
- Preparar pruebas sintéticas de cambios de año, meses vacíos, metas desconocidas,
  excedentes, bajas, reemplazos y regularizaciones que no dupliquen el conteo.
- Pruebas SQL solo en base UUID desechable. Nada destructivo sobre datos reales.
- Publicación posterior con autorización y respaldo privado verificado. No cambiar
  estados ni clasificaciones reales como parte de la migración.

## Verificación de los artefactos

Renderizado local con Chromium, red bloqueada, sin sesión ni credenciales.
Escritorio 1600 px y móvil 390 px. Geometría adicional a 320, 768, 1024 y 1920 px.
Sin desbordamiento horizontal o errores JavaScript en las vistas comprobadas.
Filtro Especial, navegación de meses de ejemplo y confirmación habilitada por
casilla verificados. Imágenes revisadas visualmente; esto no es una auditoría
completa de accesibilidad ni evidencia de funcionalidad implementada.

Los botones de guardar/confirmar solo avisan que es una maqueta. El selector de
servicio de la escena Edición ilustra el formulario, no implementa otros tipos.
En PNG de página completa se coloca la navegación móvil al pie de la captura
para no tapar contenido a media imagen; la galería usa navegación fija normal.

Regenerar desde la raíz del repositorio:

```powershell
node docs/propuestas-historico-contrato-2026-09-28/render.mjs
```

Fuentes HTML/CSS/JS y `verificacion.json` incluidos. La hoja base se reutiliza
desde la carpeta de propuestas aprobadas del 22/09, sin modificarla.
