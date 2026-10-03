# Carga 01 · Estructura anticipada

Marco sustituye la carga 03 por la propuesta 01. Respaldo previo: `1954cd1`.

Se reproduce la propuesta aprobada: barra de filtros, seis tarjetas blancas con
líneas neutras y borde superior cian, indicador pequeño y mensaje de continuidad.
La guía frontend-design se utiliza para respetar esa dirección, no para rediseñar
la plataforma. Tres columnas en escritorio, dos en tablet y una en móvil.

- Componente compartido de actividades, histórico, contrato y espacio Aunor.
- Conserva la corrección de navegación: carga de Contrato dentro de `main`,
  sin `app/contrato/loading.tsx` que reemplace el encabezado y el menú.
- Sin porcentajes, demoras artificiales, dependencias ni consultas nuevas.
- Un estado accesible; figuras decorativas ocultas a lectores de pantalla.
- Respeta movimiento reducido y no incluye datos privados ni identidad ficticia.
- No cambia actividades, contrato, permisos ni esquema de la base.

## Capturas reales de la aplicación aislada

- [Escritorio, 1440 px](carga-01-1440.png)
- [Móvil, 390 px](carga-01-390.png)

Se capturó el fallback real con JavaScript desactivado únicamente en el contexto
de prueba. No hay espera forzada en la aplicación. Datos sintéticos, tráfico
externo bloqueado. Verificación adicional de desbordamiento a 320 px.

## Pruebas

TypeScript y ESLint correctos. 434 pruebas unitarias aprobadas en 59 archivos.

13 pruebas de navegador aprobadas con build de producción local: diseño,
movimiento reducido, roles y transiciones lentas. El registro cuadro a cuadro de
Contrato conserva encabezado y navegación tanto a 1440 como a 390 px: cero
cuadros sin navegación y cero indicadores fuera del contenido.

## Acceso de Aunor

Por autorización expresa del propietario se cambió únicamente la contraseña
del usuario Aunor a la contraseña vigente de Admin mediante Auth. Se verificó
un inicio de sesión nuevo y que los siete perfiles permanecieran idénticos,
incluidos roles, permisos y requisito de cambio de contraseña. Las otras cuentas
no recibieron modificaciones de credenciales. No se guardan claves en este documento.
