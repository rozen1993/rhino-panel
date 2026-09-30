# Propuestas para elevar DA VINCI

Maquetas para aprobación, no funcionalidades implementadas. Todos los nombres,
enlaces y conteos de estas imágenes son ejemplos ficticios. No hay conexión a
Supabase, Vercel, servicios de IA ni herramientas de pago.

Abrir [galería local](index.html). Cada propuesta conserva el sistema visual
vigente: azul noche, cian, lima para acciones principales, sello de clasificación
y Entregada verde sólido. No cambia los permisos de Aunor.

| Propuesta | Escritorio | Móvil | Decisión que representa |
|---|---|---|---|
| 01 · Registro histórico terminado | [PNG](01-escritorio.png) | [PNG](01-movil.png) | Admin registra trabajos antiguos ya terminados, sin entrar como Operario |
| 01 · Variante Edición | [PNG](01-edicion-escritorio.png) | [PNG](01-edicion-movil.png) | La única fecha del formulario es la fecha de entrega del proyecto |
| 02 · Centro de contrato | [PNG](02-escritorio.png) | [PNG](02-movil.png) | Nueva sección Admin para consultar metas, entregas y excepciones; Aunor conserva consulta |
| 03 · Pendientes del equipo | [PNG](03-escritorio.png) | [PNG](03-movil.png) | Un listado accionable que no oculta tareas pendientes de meses anteriores |
| 04 · Búsqueda y contexto | [PNG](04-escritorio.png) | [PNG](04-movil.png) | Búsqueda transversal con filtros y regreso contextual; no solo el mes actual |
| 05 · Plantillas y resumen mensual | [PNG](05-escritorio.png) | [PNG](05-movil.png) | Copiar planificación, nunca entregas; PDF/CSV mensual con el mismo cálculo contractual |

Recomendación de orden: 01 y 02 primero; después 03 y 04; finalmente 05.
Se pueden aprobar por separado; también separar plantillas y reportes de la 05.

## Revisión de fechas · 30/09/2026

Marco aclaró que no corresponde pedir una segunda fecha de entrega para
Grabación, Locución o Creatividad. La revisión de las maquetas 01 y 02 refleja:

- Grabación, Locución y Creatividad: **fecha de realización**.
- Edición: **fecha de entrega del proyecto**.
- Ambas fechas cumplen la misma función de referencia para histórico y contrato.
  La fecha en que se carga el registro no desplaza el trabajo a otro mes.
- La maqueta 01 tiene un único campo de fecha y una vista previa de ese mismo
  dato. El selector de servicio permite comparar los cuatro casos en la galería
  local. Solo Grabación muestra modalidades; no se asigna automáticamente un
  servicio contractual a Creatividad.
- La 02 mantiene tarjetas por servicio, control mensual y sección anual separada.
  Solo aclara la regla de fecha, sin modificar cuotas ni permisos.

Para revisión: [Grabación](01-escritorio.png), [Edición](01-edicion-escritorio.png)
y [Centro de contrato](02-escritorio.png). Son datos ilustrativos, no conteos reales.
La aprobación de estos diseños sigue pendiente. Plantillas y resumen mensual
quedan para después; esta revisión no los implementa ni los da por aprobados.

Esta ronda modifica únicamente los archivos de esta carpeta. No cambia el código
de la aplicación, migraciones, fechas reales, credenciales, GitHub ni Vercel.

## Alcance de las imágenes

- Son cinco funciones complementarias, no cinco diseños alternativos de la misma pantalla.
- La 01 muestra una actividad de una fecha. En la implementación debe conservarse
  el soporte existente de múltiples jornadas y los campos específicos por servicio.
  No debe añadirse una fecha de entrega a Grabación, Locución ni Creatividad.
  Las múltiples jornadas existentes no se eliminan ni se convierten en entregas.
- La 02 muestra seis servicios para ilustrar la composición; el centro completo
  incluiría los ocho mensuales y los cuatro anuales ya definidos. No se cambia ninguna cuota.
- En 03 una actividad puede tener varios pendientes; los contadores son por condición,
  no se suman como si fueran actividades distintas.
- La 04 amplía la búsqueda a meses anteriores. La reparación de navegación y filtros
  del panel actual se hace aparte, sin esperar a esta nueva composición.
- La 05 deja elegir fechas y responsable al duplicar; no copia material, estados,
  conversaciones, historial, sustituciones ni asignaciones anteriores como nuevos trabajos.
- Nuevos accesos, maquetación y flujos necesitan aprobación antes de implementarse.

## Generación y revisión

Se reutilizan tokens y estructura de la propuesta compacta aprobada del 30/09.
`node docs/propuestas-mejoras-2026-09-30/render.mjs` genera 12 PNG a 1440 y 390 px,
incluyendo la variante Edición de la propuesta 01. Con `--revision-fechas` genera
solo los seis PNG de esta revisión, sin tocar las propuestas 03, 04 y 05.
El generador funciona sin peticiones de red y comprueba errores de JavaScript,
desbordamiento horizontal, una sola fecha y el cambio de servicio en los cuatro
casos. No representa una certificación completa de accesibilidad ni una prueba
de los flujos reales de la aplicación.
