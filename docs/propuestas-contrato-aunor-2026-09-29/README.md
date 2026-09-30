# Contrato Aunor: cinco propuestas visuales

29 de septiembre de 2026. **Solo propuestas, no implementación.**

Actualización posterior: Marco eligió la 02 y corrigió Fiesta de fin de año a
**2 al año**. Las imágenes originales conservan el planteamiento anterior;
la implementación vigente tiene **8 servicios mensuales y 4 anuales**. Ver
`../implementacion-contrato-tarjetas-2026-09-29/` para las capturas actualizadas.

Abrir [la comparativa](comparativa.html) en el navegador, o [su PNG](00-comparativa.png).
Los cinco prototipos son locales e independientes del código de la aplicación.

| Propuesta | Escritorio | Móvil | Enfoque |
|---|---|---|---|
| 01 · Panel ejecutivo | [PNG](01-panel-ejecutivo-escritorio.png) | [PNG](01-panel-ejecutivo-movil.png) | Lista compacta de servicios y detalle de entregas simultáneo. Recomendada para consulta habitual. |
| 02 · Tarjetas por servicio | [PNG](02-tarjetas-por-servicio-escritorio.png) | [PNG](02-tarjetas-por-servicio-movil.png) | Cada servicio tiene una tarjeta con X/Y, avance y acceso al detalle. |
| 03 · Matriz mensual | [PNG](03-matriz-mensual-escritorio.png) | [PNG](03-matriz-mensual-movil.png) | Compara abril a septiembre; cada cifra abre sus entregas. En móvil, desplazamiento horizontal dentro de la tabla. |
| 04 · Expediente de contrato | [PNG](04-expediente-de-contrato-escritorio.png) | [PNG](04-expediente-de-contrato-movil.png) | Secciones desplegables, una por servicio. Reduce la información expuesta a la vez. |
| 05 · Línea de seguimiento | [PNG](05-linea-de-seguimiento-escritorio.png) | [PNG](05-linea-de-seguimiento-movil.png) | Selecciona un servicio y recorre su avance mensual desde abril. |

## Criterio de diseño

La guía frontend-design se usó para explorar estructuras distintas, no para cambiar
la identidad. Se conserva la dirección vigente de
`diseno/direccion-final-traducida/CONTRATO-VISUAL.md`: azul noche, cian, superficie
clara, títulos condensados, líneas diagonales y bordes sobrios. El verde señala
metas alcanzadas; el azul de proceso mantiene su significado. El sello Especial
es la familia visual aprobada, no un estado ni una unidad doble.

La recomendación es **01** por equilibrio entre resumen y evidencia. **03** es
preferible si la prioridad es comparar meses. **02** requiere más desplazamiento
en móvil; **04** favorece la lectura punto por punto; **05** prioriza la evolución
de un servicio sobre la comparación simultánea de todos.

## Datos y alcance

- Todos los avances, nombres de actividades y cantidades de trabajos pendientes
  son ficticios. No se consultó la base de datos para producir las propuestas.
- Las metas sí reflejan las decisiones confirmadas: cobertura 10, redes 4,
  micronoticiero 1, fiesta 2, campañas 12, seguridad vial 24, voluntariado 2,
  webinars 3 y cuñas 4, mensualmente. Las tres metas anuales son 2 cada una.
- Se separan siempre los nueve servicios mensuales y los tres anuales. Abril
  2026–marzo 2027 es ciclo de seguimiento, no fecha de vencimiento contractual.
- X = entregas vinculadas a un servicio y periodo; Y = meta de ese periodo.
  No se suman estados en proceso ni trabajos por relacionar. No se calcula un
  porcentaje global mezclando servicios o unidades.
- Los excedentes se muestran en el mismo mes (ejemplo: mayo 15/10, +5). No se
  trasladan automáticamente. Especial no duplica el conteo.
- Aunor permanece en consulta: sin nombres de operarios, edición, eliminaciones,
  aprobaciones de entregas ni controles administrativos.
- En una implementación, alertas de sustituciones, trabajos excluidos y detalles
  contractuales seguirán disponibles en el detalle correspondiente. Simplificar
  la vista no autoriza ocultar inconsistencias ni cambiar reglas de cómputo.
- Navegación lateral, identidad y cierre de sesión son contexto visual estático.
  Los selectores, detalles, acordeones y consultas internas sí funcionan con
  ejemplos en memoria. La maqueta no contiene enlaces de material reales.
- Los PNG de escritorio son página completa (1440 px de ancho). Los móviles son
  el primer viewport (390 × 844 px); el resto se puede consultar desplazando
  el prototipo HTML. No representan toda la página móvil en una sola imagen.

## Revisión y reproducción

```powershell
node docs/propuestas-contrato-aunor-2026-09-29/render.mjs
```

Requiere el Playwright ya instalado en `frontend`. El render bloquea solicitudes
de red: solo permite `file://`. Genera diez PNG individuales y una comparativa.

Se revisan ausencia de errores JavaScript, desbordamiento de página en 320, 390,
768, 1024, 1440 y 1920 px, selección de mes, apertura/cierre de entregas, consulta
anual y trabajos por relacionar. Las capturas se inspeccionan visualmente.
La tabla de la propuesta 03 tiene desplazamiento interno intencional en móvil.

No se han modificado componentes de la aplicación, credenciales ni datos;
no se ha publicado en GitHub o Vercel. La elección de una propuesta precede a
su implementación y a las pruebas funcionales de la plataforma.
