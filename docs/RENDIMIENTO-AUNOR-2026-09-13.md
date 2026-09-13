# Corrección de carga del espacio Aunor

## Diagnóstico y respaldo

Respaldo de código previo: `692b8ad`. No es un respaldo de la base de datos.

Medición previa sobre `e9696ba`, con navegador autenticado y tres navegaciones
completas por rol, desde iniciar la navegación hasta ver el encabezado:

| Pantalla | Muestras (ms) | Mediana (ms) |
| --- | --- | --- |
| Aunor /aunor | 1790, 1856, 974 | 1790 |
| Admin /actividades | 787, 580, 639 | 639 |

Son mediciones puntuales de laboratorio, no percentiles de usuarios reales ni LCP.
La red, las conexiones calientes y la carga de los servicios afectan el resultado.
La auditoría encontró 12 servicios y ninguna publicación activa para Aunor:
no se publicaron actividades reales ni se insertaron ejemplos para medir.

El lector obtenía seis conjuntos de datos completos en todas las pantallas y
solicitaba una página vacía adicional para comprobar el final de cada conjunto.
Esto producía siete peticiones de datos en ese estado de la base.
Las consultas SQL examinadas tardaban aproximadamente entre 3 y 9 ms; no se
encontró evidencia de saturación por tamaño (base de aproximadamente 12 MB).
La aplicación y Supabase ya estaban en regiones compatibles (pdx1/us-west-2).

## Cambios

- Cada pantalla solicita únicamente los conjuntos que utiliza:
  panel: actividades, jornadas, servicios y entregas vigentes;
  calendario: actividades, jornadas y servicios;
  contrato: actividades, jornadas, servicios y reemplazos;
  detalle: datos de la actividad indicada y sus relaciones;
  reemplazo: el objeto indicado, sus dos actividades, jornadas y acuerdo.
- La lectura completa de Admin se conserva para sus formularios.
- Paginación con conteo exacto del cursor actual: evita la petición terminal
  vacía sin asumir que una página corta significa final. Se prueba con un
  límite de servidor inferior al tamaño solicitado.
- El panel pasa de siete a cuatro peticiones de datos en el caso medido.
  Sus refrescos habituales usan tres mientras el catálogo sigue vigente.
  Estas cifras no incluyen consultas de autenticación ni prefetch de rutas.
- El catálogo se reutiliza solamente dentro del componente durante cinco
  minutos. Se renueva al entrar en una ruta, actualizar manualmente o confirmar.
- Se agrupan lecturas concurrentes, se limita el refresco por foco y se pausa
  la consulta periódica en pestañas ocultas o mientras se guarda una confirmación.
- Una lectura anterior termina antes de guardar, evitando que su respuesta
  sobrescriba una confirmación más reciente.

## Seguridad y compatibilidad

Sin migraciones, cambios de región, dependencias nuevas ni cambios de CSS.
No se modificaron actividades, cuentas, entregas ni historial reales.
Las consultas siguen usando el cliente autenticado y las vistas protegidas.
No hay caché global, almacenamiento local de datos privados ni service-role
en el lector. Se validan la pantalla y sus identificadores antes de consultar.
Cada cuenta/ruta obtiene una instancia nueva del componente.

## Verificación

- Typecheck, ESLint, 258 pruebas unitarias y build de producción correctos.
- Las 29 pruebas de navegador existentes pasaron en servidor demo aislado,
  incluyendo confirmaciones, permisos y anchos de escritorio/móvil.
- Pruebas nuevas de carga por pantalla, paginación, concurrencia, catálogo,
  errores de conexión y navegación cliente.

El conteo exacto añade trabajo SQL; si el volumen crece considerablemente,
conviene volver a medir antes de sustituirlo por un endpoint agregado paginado.
No se introdujo caché de publicaciones para mantener su visibilidad actualizada.

## Comprobación en Vercel

Corrección publicada: `7f6bed8`, despliegue
`dpl_2RTydy7nutDnD6HqAKamqkrVJegZ`, estado Ready en el dominio de producción.

| Pantalla | Muestras posteriores (ms) | Mediana (ms) |
| --- | --- | --- |
| Aunor /aunor | 2071, 1374, 1182 | 1374 |
| Admin /actividades | 1256, 1256, 881 | 1256 |

La mediana de Aunor bajó aproximadamente un 23 % frente a la muestra previa.
Admin también varió pese a no cambiar su carga inicial: no se puede atribuir
todo el cambio de tiempo al código ni prometer ese porcentaje en todas las redes.
La reducción de peticiones sí queda cubierta por pruebas deterministas.
Se verificó navegación autenticada de Aunor a Calendario y Contrato; ambas
sesiones diagnósticas (Aunor y Admin) se cerraron mediante la plataforma.

La primera ejecución de CI aprobó typecheck, lint, 258 pruebas unitarias,
build y funciones; falló únicamente la nueva prueba de navegación porque
contaba enlaces inmediatamente después del cambio de URL, antes de renderizar.
Se añadió una espera explícita por el enlace visible, sin relajar la comprobación
de datos ni modificar la aplicación.
