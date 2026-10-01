# Calendario 01 · Actividades 01 · Carga 02

Implementación local de la combinación aprobada por Marco el 1 de octubre de 2026.
Respaldo previo: `a225dd1`. Se utilizó la guía frontend-design para conservar la dirección visual DA VINCI y contrastar capturas de escritorio/móvil con las propuestas aprobadas.

## Capturas de la aplicación

Son pantallas de la implementación, con datos sintéticos en un navegador aislado; no son capturas de producción.

| Diseño | Escritorio | Móvil |
|---|---|---|
| Calendario 01 | [Calendario](calendario-01-1440.png) | [Mes](calendario-01-mes-390.png) · [Panel de actividades](calendario-01-390.png) |
| Actividades 01 | [Panel](actividades-01-1440.png) | [Panel móvil](actividades-01-390.png) |
| Carga 02 | [Indicador de contrato](carga-02-1440.png) | [Indicador móvil](carga-02-390.png) |

## Cambios

- Calendario con celdas de agenda y cantidad dentro de la fecha. Sin rombos ni contadores superpuestos. Los doce meses siguen disponibles, con tres columnas en escritorio, dos en tamaño intermedio y una en móvil.
- Los contenedores de mes no cambian borde, sombra ni posición al pasar el cursor. Los días interactivos mantienen foco y selección.
- Diamante violeta junto a la última palabra del título especial, evitando que quede suelto en otra línea. Los trabajos estándar no llevan etiqueta en el panel. El sello completo continúa en histórico y ficha.
- Un solo checkbox para marcar un trabajo como especial. No marcar significa estándar, incluidos los registros antiguos sin clasificación. Solo Admin conserva la facultad de clasificar; no se multiplican unidades del contrato.
- Indicador de sección para actividades, histórico, contrato y espacio Aunor, sin porcentajes ni tiempos ficticios. Respeta reducción de movimiento. La navegación existente se conserva tras autorizar la sesión; no se añade un loading global que convierta redirecciones HTTP de acceso en respuestas 200.
- Corrección de la barra mensual: al recuperar abril desde la URL, abril vuelve a quedar visible.
- Migración preparada para guardar nuevas ediciones con ubicación Lima, tanto en la actividad como en sus jornadas. No altera fechas, estados ni materiales, ni modifica filas existentes por el mero hecho de desplegar el esquema.

## Datos reales y publicación: pendientes

No se ha hecho push, despliegue ni cambio en la base real en esta implementación local.

La migración `202610010001_activity_presentation_defaults.sql` incluye `normalize_editing_location_v1(id, version)` para corregir de forma explícita una Edición existente. Exige sesión Admin, actividad vigente y versión coincidente; conserva fechas, responsable, materiales y estado, e incorpora el lugar anterior y los lugares de jornadas al historial de auditoría. No elimina registros.

Antes de publicar:

1. Obtener y verificar por restauración un respaldo privado de la base remota.
2. Resolver por lectura el UUID y versión de la Edición mostrada como «variado» y revisar el alcance exacto de las demás Ediciones antes de corregirlas.
3. Aplicar únicamente la migración pendiente; corregir las ubicaciones autorizadas con la operación auditada. No usar una actualización masiva sin control de versión.
4. Publicar el commit aprobado y verificar CI, Vercel y las pantallas con los roles correspondientes.

## Verificación reproducible

Resultado local: TypeScript y ESLint correctos; 430 pruebas unitarias aprobadas; batería completa de 53 pruebas de navegador aprobada, más repetición final de 9 pruebas de los flujos afectados tras ajustar Lima en la simulación. Los builds de producción usados por Playwright finalizaron correctamente. La cadena SQL, los permisos, los reintentos y la corrección auditada pasaron en PostgreSQL 17 desechable. Se inspeccionaron las capturas de escritorio y móvil.

Desde `frontend`, usar `SISTEMA_R_DATA_SOURCE=demo` y `SISTEMA_R_ISOLATED_TEST=audit` para las comprobaciones locales. Las pruebas SQL crean una base y un contenedor UUID desechables sin abrir puertos ni usar credenciales de Supabase; al terminar eliminan únicamente esos recursos propios.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
node scripts/verify-sql-ci.mjs
$env:SISTEMA_R_CAPTURE_DIR='.verificacion/aunor-approved-release-2026-10-01'
$env:SISTEMA_R_NEW_CAPTURE_DIR='.verificacion/aunor-approved-release-2026-10-01'
npm.cmd run test:e2e
```

Las capturas de carga mantienen visible el componente real de Suspense desactivando JavaScript únicamente en un contexto de prueba. La aplicación no incorpora retrasos artificiales.
