# Carga 03 · Transición DA VINCI

Sustituye la opción 02 por petición de Marco. Respaldo previo: `69160f2`.

Se conserva la propuesta aprobada: marca sobre fondo marino con líneas diagonales,
acento cian/lima y mensaje «Tu trabajo, en un solo lugar» en un panel blanco.
En móvil los dos paneles se apilan. La guía frontend-design se utilizó para
mantener la dirección visual existente y revisar la adaptación a escritorio y móvil.

- Reemplaza el componente compartido de carga de actividades, histórico, contrato y Aunor.
- Mantiene la navegación y las comprobaciones de acceso existentes.
- Sin porcentajes inventados, demoras artificiales, nuevas dependencias ni servicios externos.
- Respeta la preferencia de reducir movimiento y anuncia la sección que se está cargando.
- Cambio exclusivamente visual: no modifica datos ni requiere migraciones.

## Capturas de la aplicación aislada

- [Escritorio](carga-03-1440.png)
- [Móvil](carga-03-390.png)

Las capturas se generan con datos sintéticos. JavaScript se desactiva solo en el
contexto de prueba para mantener visible el fallback real de carga; la aplicación
no obliga al usuario a esperar para verlo.

## Verificación local

TypeScript y ESLint correctos. 432 pruebas unitarias y 11 pruebas de navegador
aprobadas, con build de producción aislado. Capturas revisadas a 1440 y 390 px,
comprobación adicional a 320 px y animaciones desactivadas con movimiento reducido.
Las pruebas de roles confirman que se conservan navegación y restricciones de acceso.

## Corrección de la transición a Contrato

Respaldo: `4d5da05`. Se detectó una carga duplicada: `app/contrato/loading.tsx`
reemplazaba la página completa, incluida la navegación que vive dentro de ella,
antes de que el Suspense del contenido mostrara la misma carga en su ubicación correcta.

Se retiró solo esa carga de ruta. Se conserva la carga 03 dentro de `main`, debajo
del título de Contrato y después de validar el rol. Durante la autorización, Next
mantiene la página anterior y la señal de navegación pendiente del enlace.
No se añaden copias del menú, temporizadores, cambios de permisos ni consultas.

La regresión se reprodujo antes de corregirla con 1,2 segundos de latencia simulada
exclusivamente en un navegador de prueba: 74 cuadros sin encabezado/menú, tanto a
1440 como a 390 px. Después, la misma prueba registró cero cuadros sin navegación
y cero cargas fuera del contenido. Las capturas estáticas anteriores no cubrían
ese intervalo; se añadió una comprobación cuadro a cuadro y un test del límite
de carga/autorización para impedir que vuelva a introducirse.
