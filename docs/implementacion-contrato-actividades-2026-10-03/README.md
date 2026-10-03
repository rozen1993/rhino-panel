# Contrato compartido, consulta rápida y rendimiento

Implementación local del 3 de octubre de 2026. Respaldo previo: **`25591c4`**.

## Alcance

- Sin push a GitHub ni despliegue en Vercel.
- Sin cambios de contraseñas, registros reales, esquema SQL, permisos de servidor o infraestructura.
- Los selectores nativos de fecha y mes se mantienen. No se implementaron las propuestas de reemplazo del calendario.
- Las capturas y pruebas usan exclusivamente ejemplos ficticios en procesos y contextos de navegador aislados.

## Actividades: mejora de la idea actual

Toda la fila permite seleccionar el resumen; el título es un botón utilizable con teclado. Abrir material y seleccionar texto no disparan la selección de otra actividad. Se conserva el acceso existente mediante el ojo y la navegación directa del Operario.

En escritorio amplio, el contenedor lateral acompaña el desplazamiento. El resumen largo tiene desplazamiento propio y deja los botones de ficha y material accesibles. En pantallas menores a 1440 px se abre una hoja/modal con cierre, Escape, bloqueo del fondo y retorno del foco. Las tarjetas móviles también permiten abrir esa consulta.

- [Escritorio, selección al final de una lista larga](actividades-seguimiento-1440.png)
- [Móvil, resumen y acceso a ficha](actividades-resumen-390.png)
- [Pantalla intermedia](actividades-resumen-1024.png)

## Contrato: misma vista y cálculo

`ContractCenter` es la presentación compartida por Admin y Aunor: ocho servicios mensuales y cuatro anuales, tarjetas X/Y, trabajos entregados y pendientes, no computables, periodos pendientes, trabajos sin servicio y reemplazos documentados.

Admin conserva la configuración, cargada bajo demanda. Aunor no importa ese editor ni recibe botones de gestión o identidades de operarios. Sus enlaces conducen exclusivamente a sus rutas de consulta. El mes seleccionado se conserva en la URL, también al recargar Aunor. Los periodos guardados siguen disponibles para consultar antecedentes.

- [Contrato Admin](contrato-admin.png)
- [Contrato Aunor](contrato-aunor.png)
- [Contrato móvil](contrato-movil.png)

### Decisión sobre el aviso

El mensaje se llama **Última entrega registrada**. Presenta la entrega computable más reciente del periodo/ciclo consultado, el servicio, un enlace a la actividad y su fecha de entrega registrada, en hora de Lima.

No se presenta como un historial universal de cambios: el modelo actual no entrega una revisión global fiable que incluya modificaciones de metas, desvinculaciones y todas las demás operaciones. No se utiliza la hora de refresco, la fecha de publicación ni la fecha de carga como fecha de entrega. Cuando falta evidencia de la fecha, se informa que no hay una fecha de registro disponible.

Una entrega de abril registrada en octubre continúa en abril. La última entrega se obtiene de las actividades que realmente computan: excluye sustituidas, no realizadas, pendientes y asignaciones no resueltas. Implementar un registro global de actualizaciones requeriría otro alcance de lectura y, si necesita migración, respaldo privado verificado antes de tocar el remoto.

## Optimización realizada

1. Índices por actividad y servicio para jornadas y periodos; resolución de periodos reutilizada dentro del cálculo, nunca entre cuentas ni mediante caché persistente.
2. Agregación común y memorizada del contrato; no se recorren todas las jornadas por cada actividad al construir las tarjetas.
3. La lectura contractual omite descripciones largas, enlaces de material, lugar y modalidades de la actividad, que no se necesitan en esas tarjetas. No borra esos campos: el detalle autorizado sigue solicitándolos completos.
4. Páginas de hasta 1000 actividades/jornadas para reducir viajes de red; se respeta cualquier límite menor del servidor y se mantienen conteo exacto y comprobaciones contra truncamiento.
5. Lotes de filas relacionadas del panel Aunor ejecutados con concurrencia limitada, en lugar de secuencialmente.
6. Los filtros de visibilidad, años, meses y conteos del panel no se recalculan al cambiar únicamente la selección del resumen.
7. El editor de periodos Admin se carga solo cuando se solicita, no para consultar el contrato.

Se conservan autenticación, revocación de cuentas, fronteras de rol, RLS, refresco y lecturas de detalle. No se introdujo caché compartida de datos privados ni se ocultó una espera mediante retrasos artificiales.

### Medición reproducible

`npm.cmd exec -- vitest run __tests__/contract-performance.test.ts --maxWorkers=1`

Con 2400 actividades y jornadas ficticias, cinco repeticiones por alternativa, se compararon los resultados completos antes y después de indexar:

| Ejecución | Mediana anterior | Mediana indexada |
| --- | ---: | ---: |
| Primera, junto a otras verificaciones | 107,82 ms | 21,95 ms |
| Segunda | 87,53 ms | 15,76 ms |

La igualdad del resultado se verifica automáticamente. Las cifras son **solo tiempo de cálculo local**, no LCP ni tiempo total del despliegue. No demuestran que toda la plataforma cargue cinco veces más rápido. El beneficio de red depende del volumen de información y del límite de páginas del servidor. Falta medir el resultado completo en producción después de una publicación autorizada.

## Verificación

- TypeScript y ESLint.
- Suite unitaria completa: **445 pruebas aprobadas en 62 archivos**, incluyendo cálculo contractual, lectura por escena, permisos, navegación, selección y datos incompletos.
- 18 pruebas de navegador seleccionadas; build de producción aislado incluido.
- Navegación lenta: encabezado y menú permanecen visibles en Admin y Aunor.
- Consulta de actividad al final de 24 filas: no obliga a volver arriba y conserva el botón de ficha incluso con descripción larga.
- Escritorio 1600/1440, pantalla intermedia 1024, móvil 390 y contrato desde 320 px sin desbordamiento de página.
- Igualdad del contenido de las tarjetas entre ambos roles; controles exclusivos Admin; ruta Aunor mantiene el mes tras recargar.
- Metas anuales, abril, periodos explícitos, datos sin fecha, excedentes, Especial sin doble conteo, sustituciones y servicios retirados.

Comandos principales desde `frontend`:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --reporter=dot
npm.cmd exec -- playwright test e2e/contract-activity-refresh.spec.ts e2e/contract-reference.spec.ts e2e/contract-loading-navigation.spec.ts e2e/aunor.spec.ts
```

Playwright usa `SISTEMA_R_DATA_SOURCE=demo`, un build separado `.next-audit-test`, puerto 3100 y perfiles de navegador nuevos. Las capturas de este directorio son evidencia visual de la aplicación implementada, no las maquetas propuestas anteriormente.
