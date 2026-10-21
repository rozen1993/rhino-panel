# Aunor: actividades permanentes y Fotos para redes

Implementación local de la propuesta 01 aprobada. Fecha: 20 de octubre de 2026.
Respaldo previo del código: `bf8abce`. Un commit no sustituye un respaldo de la base de datos.

## Lo implementado

- **Actividades:** Aunor comparte la lista, filtros de mes/año, búsqueda, estados y vista rápida del panel de Admin. Se retiró la caducidad de 72 horas tanto de la consulta como de la interfaz. Las entregadas permanecen en el mes correspondiente al trabajo; no se cambian fechas ni estados. El panel abre en el mes actual.
- **Privacidad:** Aunor sigue siendo solo lectura. No recibe identidad del operario, opinión interna ni controles de administración. Abrir una ficha y volver conserva mes/búsqueda/estado. La vista rápida usa el mismo comportamiento adaptable que Admin.
- **Fotos para redes:** nueva pestaña exclusiva de Aunor, con álbumes por actividad, filtro mensual, búsqueda, portada y miniaturas. Visor ampliado, descarga individual, ZIP por álbum y selección mensual. El mes corresponde a las jornadas de actividad o fecha de entrega de edición, no a la fecha de subida.
- **Carga:** Admin y operario responsable encuentran «Fotos para redes» en la ficha. Se recomienda seleccionar 2–3 tomas; una primera foto ya puede consultarse. Máximo 3 fotos activas, validado en SQL y no solo en el formulario. Subir fotos no cambia el estado de la actividad.
- **Correcciones recuperables:** retirar una foto la oculta para Aunor, pero permite restaurarla. Los reintentos de una misma imagen no duplican la reserva. Una carga incompleta se puede reintentar o retirar.

## Archivos y límites

Se acepta JPG, PNG o WebP, hasta 4 MiB y 40 megapíxeles por archivo, sin animación. Se aplica orientación y se guarda una **copia optimizada para redes**, JPEG hasta 2560 px por lado, sin EXIF/GPS, más miniatura WebP. No se conserva el archivo original: el equipo debe guardarlo en su archivo de producción. Esta decisión concreta los límites que quedaron abiertos en la propuesta; la descarga no equivale al original de cámara.

La copia guardada no supera 3 MiB; la miniatura no supera 512 KiB. El ZIP se arma en el navegador con un límite de 32 MiB por selección; si se supera, se descargan álbumes por separado. No hay ZIP grande transmitido por una función de Vercel ni un servicio de transformación de pago contratado.

Las fotos ocupan Storage y sus descargas consumen transferencia. **No se contrataron planes ni se activó infraestructura remota.** Antes de publicar se debe comprobar la capacidad disponible de Storage; el espacio de archivos no debe confundirse con el de PostgreSQL.

## Seguridad y persistencia

La migración `202610190001_activity_social_photos.sql` añade una tabla privada, proyección sin autor, funciones autorizadas y bucket privado. Aunor solo lee fotos terminadas y no retiradas de actividades fuera de papelera. Una cuenta desactivada, con cambio de clave pendiente o sesión revocada no obtiene acceso.

El servidor prepara la imagen; la función `social-photo-upload` vuelve a validar límites y estructura, reserva con la identidad del usuario y almacena objetos inmutables. No hay permisos directos de subida, modificación o borrado para clientes en Storage. Los objetos se gestionan desde Edge, sin introducir credenciales privilegiadas en Vercel.

La eliminación permanente existente sigue requiriendo el flujo de Admin con contraseña y vista previa. Las fotos entran en su manifiesto; la eliminación de objetos usa Storage API, no `DELETE storage.objects`. Si falla, una cola conserva los objetos pendientes y se reintenta en la próxima limpieza autorizada. No hay tarea programada nueva. Una carga que detecta que su reserva fue eliminada se compensa sin borrar reservas vigentes. Un corte abrupto del proceso entre Storage y SQL requiere conciliación administrativa: no se afirma atomicidad entre ambos servicios.

## Verificaciones realizadas

- TypeScript y compilación de producción con origen de datos `demo`, salida aislada `.next-aunor-test`: correctos; sin ruta temporal de pruebas en el build final.
- ESLint: sin errores ni advertencias.
- Vitest: **476 pruebas correctas** en 67 archivos.
- Funciones Deno: **32 pruebas correctas**, incluidas carga, permisos, reintentos, tamaños y limpieza de fotos con clientes simulados.
- PostgreSQL 17: cadena completa de migraciones y pruebas en contenedor/base UUID desechables. Verificados permisos, bucket privado, máximo de tres, versiones, retirada/restauración, sesiones revocadas, papelera y manifiesto de eliminación con fotos. Se retiraron exclusivamente los recursos creados por la prueba.
- Navegador local: 1600 y 390 px; álbumes, estado vacío, visor, Escape, descarga ZIP, navegación y retorno al mes. Sin desbordamiento horizontal ni errores JavaScript. ZIP comprobado además mediante .NET.
- Cuatro casos Playwright sobre el build aislado: navegación de Aunor, rechazo de Operario en su espacio, actualización del panel y pestaña Fotos en móvil/escritorio; todas sus aserciones pasaron. El cierre del proceso de pruebas en Windows quedó esperando después de reportar los cuatro casos y se interrumpió manualmente; no se presenta ese proceso como una ejecución con salida cero.

**Límite de la evidencia:** el test SQL usa una representación mínima de las tablas de Storage y el test Edge usa clientes simulados. Falta una prueba de integración extremo a extremo con Auth + Storage + Edge en un entorno desechable antes del despliegue. Los resultados locales no prueban todavía una carga en el proyecto remoto.

## Capturas

- [Álbumes en escritorio](fotos-1600.png)
- [Álbumes en móvil](fotos-390.png)
- [Visor móvil](visor-390.png)
- [Panel de actividades de Aunor](actividades-aunor-1600.png)
- [Estado vacío](fotos-vacio-1600.png)

Todas las fotografías y actividades de estas capturas son **ejemplos sintéticos**, reutilizados de la propuesta aprobada. Algunas miniaturas repiten una imagen; no son trabajos reales ni una función automática de generación de fotografías.

## Publicación pendiente — no ejecutada

1. Completar la prueba extremo a extremo aislada de subida, lectura Aunor, archivo/restauración y eliminación autorizada de datos exclusivamente sintéticos. Revisar la propiedad de objetos y recuperación ante fallos.
2. Confirmar destino y obtener un respaldo privado verificado de la base remota. Nunca subirlo a Git. Comprobar capacidad de Storage y política de respaldo de archivos.
3. Aplicar únicamente la nueva migración. No ejecutar `reset`, semillas ni normalizaciones sobre datos reales.
4. Publicar `social-photo-upload` y la actualización de `admin-erasure`, conservando autenticación JWT y permisos internos. Revisar las políticas efectivas del bucket contra cualquier política previa demasiado amplia.
5. Sincronizar el frontend y verificar el despliegue Vercel. Evitar publicar primero una interfaz que dependa de tablas/funciones inexistentes.
6. La primera foto real la añade el equipo como trabajo autorizado; no usar una cuenta o actividad real como fixture. Comprobar visualización Aunor sin autor y seguimiento de la cuota.

Si hubiera que volver al frontend anterior, conservar tabla, bucket, fotos e historial. Un rollback visual no autoriza a eliminar datos ya cargados.

## Reproducción local

Desde `frontend`: `npm.cmd test`, `npm.cmd run test:functions`, `node scripts/verify-sql-ci.mjs` (Docker disponible).
Para capturas: iniciar en el puerto 3130 con `SISTEMA_R_DATA_SOURCE=demo` y `SISTEMA_R_ISOLATED_TEST=aunor`; ejecutar `node scripts/verify-social-photos-browser.mjs`. El script crea y retira una ruta temporal protegida por ese modo, sin sobrescribir una ruta existente. El ZIP de ensayo permanece en `.verificacion/fotos-aunor/`, no en la entrega documental.

Sin push, despliegue, cambios de contraseñas ni escrituras a datos reales durante esta implementación.
