# Histórico: calendarios y tarjetas uniformes

Implementación local del 5 de octubre de 2026. Respaldo previo: `d1e052b`.

## Cambios

- Grabación y Edición comparten el mismo celeste `#cff2f6` para fechas estándar.
- Si alguna actividad visible de una fecha es Especial, el día usa morado suave `#e9defa`, sin iconos añadidos al calendario.
- Cada fecha marcada muestra su número de actividades, incluido `×1`. Se cuenta cada actividad una vez, aunque tenga jornadas coincidentes.
- Seleccionar una fecha añade un contorno sin sustituir su celeste o morado. Se conserva el foco de teclado y no se añade hover a los meses.
- El panel del día comienza siempre con tarjetas: una actividad equivale a una tarjeta, varias actividades a varias tarjetas.
- «Ver detalles» y «Volver» funcionan también para fechas con una sola actividad. Al volver se recuperan el foco y la posición del listado.
- Se retira el sello Estándar de las tarjetas y detalles del Histórico; permanece Especial. El filtro de clasificación sigue disponible.
- Los componentes compartidos aplican el comportamiento a Admin, Operario y Aunor. Aunor continúa sin responsable ni opinión interna del operario.

No hay cambios de esquema, contraseñas ni datos de trabajo. La publicación solicitada usa el flujo habitual GitHub/Vercel. El commit de respaldo contiene el código versionado previo; no sustituye un respaldo de base de datos. Los documentos y resultados de auditorías anteriores que ya estaban sin seguimiento se conservaron sin incorporarlos al commit.

## Verificación

La verificación usa demo aislada y navegadores nuevos con datos sintéticos, nunca la base de trabajo. Los PNG de este directorio representan datos de demostración, no registros reales.

Desde `frontend`:

```powershell
$env:SISTEMA_R_DATA_SOURCE='demo'
$env:SISTEMA_R_ISOLATED_TEST='audit'
npm.cmd run verify
$env:SISTEMA_R_CAPTURE_DIR='../docs/implementacion-calendarios-2026-10-05/recorridos'
npm.cmd exec -- playwright test --config ../docs/implementacion-calendarios-2026-10-05/playwright.config.ts
```

La configuración de navegador usa el build aislado generado por `verify`, en el puerto 3100, y resultados separados bajo `frontend/.verificacion/calendarios-2026-10-05/`.

Las pruebas específicas comprueban ambos colores en Grabación y Edición, fechas simples y mixtas, `×1`/`×2`, selección sin cambio de color, tarjetas y retorno con teclado, ausencia del sello Estándar y ancho sin desbordamiento. También se ejecutan recorridos existentes del panel histórico, Aunor, jornadas, clasificación y entrega histórica. Las pruebas de contraste exigen al menos 4,5:1 para el texto sobre ambos colores.

## Capturas

- [Grabación: calendario de escritorio](grabacion-admin-1440-mes.png)
- [Edición: calendario de escritorio](edicion-admin-1440-mes.png)
- [Una actividad: tarjeta de escritorio](grabacion-admin-1440-tarjeta.png)
- [Fecha mixta: tarjetas de escritorio](grabacion-admin-1440-mixta.png)
- [Grabación: calendario móvil](grabacion-admin-390-mes.png)
- [Una actividad: tarjeta móvil](grabacion-admin-390-tarjeta.png)

## Resultado final

- `npm.cmd run verify`: tipos, ESLint, **449/449 unitarias en 62 archivos** y compilación correctos.
- Selección de navegador de esta implementación: **28/28 correctas**. No se presenta como ejecución de toda la suite E2E ni como cierre del hallazgo de CI de la auditoría anterior.
- Inspección visual de PNG reales del demo: calendario de Grabación en escritorio, Edición en móvil, tarjeta única de escritorio y tarjetas mixtas móviles. Se conservan la tipografía, los bordes y la estructura de la plataforma.
- `git diff --check` sin errores de espacios.
- Estos resultados corresponden a la verificación local previa a la publicación; no se modificaron datos reales. La publicación posterior debe comprobarse para el SHA enviado a GitHub, sin confundir el push con un despliegue exitoso.
