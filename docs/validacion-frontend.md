# Validación del frontend

**Resultado automatizado:** aprobado el 2026-08-21.

## Cobertura ejecutada

- TypeScript estricto y ESLint: aprobados sin errores.
- Vitest: 14 pruebas aprobadas sobre roles, permisos, persistencia, idempotencia, bloqueo de entrega, vínculo Burson, validación de stores y contrato visual.
- Build optimizado de Next.js: aprobado.
- Playwright: 3 recorridos aprobados con fronteras de los tres roles, cierre de sesión, flujo completo de entrega/conversación/bloqueo y el Histórico en 390×844, 768×1024, 1366×900 y 1920×1080.
- Las pruebas E2E levantan el build de producción, no el servidor de desarrollo.

## Cambios cubiertos por la corrección de auditoría

- Persistencia del enlace y opinión al crear una actividad.
- Edición protegida por responsable, versión e idempotencia.
- Bloqueo exclusivo del enlace y la opinión tras iniciar la conversación Admin–Operario.
- Transferencia de encargos Burson pendientes al nuevo operario especial.
- Cierre de sesión real, navegación mensual funcional y enlaces externos HTTPS validados.
- Store con validación de forma y retorno seguro a datos semilla ante corrupción.
- Acceso mediante diálogo semántico, foco visible, enlace para saltar al contenido y navegación móvil con área segura.
- Histórico interactivo con solapamientos, jornadas discontinuas y formatos explícitos de hora de Lima.

## Revisión manual recomendada

1. Abrir `http://localhost:3000` en un teléfono y un equipo de escritorio reales.
2. Ingresar con cada rol y confirmar textos, jerarquía, tacto, teclado y legibilidad.
3. Crear y editar una actividad, completar una entrega, iniciar una conversación como Admin y confirmar el bloqueo del enlace/opinión.
4. Transferir el vínculo Burson y confirmar que solo cambian los encargos pendientes.

La aplicación sigue siendo una simulación local. Base de datos, autorización de servidor, auditoría persistente y recuperación real de contraseña son requisitos previos a producción.
