# Histórico, edición y control contractual — implementación local

Verificación final: **29 de septiembre de 2026**. Las capturas muestran datos sintéticos, no trabajos reales.

## Qué quedó implementado

- **Marcaje:** Estándar, Especial y Sin clasificar, independiente del estado. Admin puede cambiarlo con control de versión y trazabilidad. Se muestra en las actividades y en el histórico, que también permite filtrar. Especial no duplica automáticamente unidades contractuales.
- **Edición:** el formulario usa «Fecha de entrega del proyecto» en lugar de jornadas y oculta lugar y descripción. Es una fecha prevista, no una entrega real. Al editar registros existentes se conservan sus jornadas, lugares y descripciones anteriores.
- **Entregas antiguas:** Admin puede regularizar explícitamente un trabajo pasado y terminado, con enlace de material final y confirmación. Se conserva la misma actividad y su historial; queda Entregada, con fecha real desconocida y fecha de regularización registrada por separado. No se regularizó ningún trabajo real.
- **Contrato de Aunor:** progreso X/Y por servicio y periodo mensual o anual; entregadas, pendientes y trabajos sin periodo se distinguen. Solo cuentan actividades entregadas, vinculadas al servicio y con periodo confirmado por Admin. No se duplican por jornadas, versiones del material ni originales sustituidos. Los excesos permanecen en su periodo, sin trasladarlos automáticamente.
- **Permisos:** Aunor continúa en solo lectura, sin identidad del operario. Configurar metas, asignar periodos, clasificar y regularizar exige Admin también en servidor/base de datos.
- **Diseño:** se mantiene la línea DA VINCI: azul marino, cian, verde de acción y tipografía existente. El marcaje Especial usa una insignia violeta separada del estado. En móvil, el contrato utiliza un selector compacto de servicios.

## Cómo usarlo cuando se publique

1. Admin abre una actividad y elige su marcaje en «Control de archivo».
2. Para una actividad antigua ya finalizada, comprueba primero el material, despliega «Regularizar entrega histórica», confirma y guarda. No sirve para declarar entregado un trabajo todavía pendiente.
3. Admin relaciona el trabajo con el servicio contractual correspondiente.
4. En «Periodo contractual», configura las fechas, periodicidad y meta documentadas del servicio. Una meta desconocida se deja sin definir; no equivale a cero.
5. Selecciona y confirma expresamente el periodo que corresponde al trabajo. Cambiar el servicio invalida esa asignación para evitar conteos incorrectos.
6. Aunor consulta el mes y el servicio en Contrato. Las actividades entregadas y correctamente asignadas alimentan el numerador.

## Capturas de la aplicación funcionando

| Pantalla | Escritorio | Móvil |
| --- | --- | --- |
| Formulario de edición | [PNG](edicion-1440.png) | [PNG](edicion-390.png) |
| Regularización histórica | [PNG](regularizacion-1440.png) | [PNG](regularizacion-390.png) |
| Histórico y marcaje | [PNG](historico-1440.png) | [PNG](historico-390.png) |
| Contrato X/Y | [PNG](contrato-1440.png) | [PNG](contrato-390.png) |

## Verificaciones realizadas

- `npm.cmd test -- --run`: **354 pruebas, 43 archivos, todas aprobadas**.
- `npm.cmd run lint`: aprobado.
- `npx.cmd tsc --noEmit`: aprobado.
- Playwright: **18 recorridos aprobados** de `history-contract`, `aunor`, `historical-panel` y `operator-planning`. Incluye móvil/escritorio y panel histórico de 320 a 1920 px; no representa la ejecución de todos los E2E del repositorio.
- El servidor de Playwright compiló y arrancó la aplicación en modo demo aislado, sin usar Supabase real.
- `node scripts/verify-history-contract.mjs`: cadena completa de migraciones y comprobaciones de permisos, versiones, preservación, privacidad, periodos y reinicio aprobadas en `sr_history_test_7301309530a14c79ab1257723b0786a5`. Se eliminó únicamente esa base creada por la prueba.
- Revisión visual de capturas y `git diff --check` aprobados.

## Estado de publicación y pendientes

**Solo local.** No se ejecutaron push, despliegue, migraciones remotas ni modificaciones de registros reales. El commit de respaldo previo es `7b1fc22`; las propuestas aprobadas están conservadas en `a635a63`.

Pendiente recibir las metas, periodicidades y vigencias definitivas: [lista de datos por confirmar](../propuestas-historico-contrato-2026-09-28/METAS-POR-CONFIRMAR.md). La referencia de 10 coberturas mensuales no se sembró como configuración real ni se extendió a otros servicios.

Antes de publicar:

1. Confirmar configuración contractual con Marco.
2. Obtener un respaldo privado verificado de producción, fuera de Git.
3. Coordinar la aplicación de `202609280001_activity_classification_deadline.sql` y `202609280002_contract_periods.sql` y el despliegue del código compatible. No desplegar este código sobre el esquema antiguo sin preparar la actualización.
4. Verificar con acceso autorizado los roles y los nuevos flujos en producción, sin usar trabajos reales como fixtures.
5. Admin revisa y regulariza los registros antiguos y asigna sus periodos de forma consciente; no hay una conversión masiva automática.

Un commit respalda código, **no sustituye un respaldo de base de datos**.
