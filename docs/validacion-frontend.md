# Validación del frontend

**Resultado automatizado:** aprobado el 2026-08-19.

## Cobertura ejecutada

- 59 pruebas unitarias de reglas, stores y componentes.
- 11 recorridos E2E: creación para cinco roles; borrador tras recarga; aprobación e historial; comentario AUNOR y respuesta de Supervisión sin alterar estado; escritura/lectura Burson; matriz de rutas; 404; móvil 390×844, tablet 768×1024 y escritorio 1280×900.
- TypeScript, ESLint y build de producción incluidos en `npm run verify`.

## Revisión manual pendiente de Marco

1. Abrir `http://localhost:3000` en un teléfono real y en escritorio.
2. Ingresar con cada rol usando las credenciales visibles en `/acceso`.
3. Confirmar textos, jerarquía visual, navegación, formularios y mensajes de error.
4. Probar especialmente edición/eliminación de mensajes, observaciones, aprobación, respuesta AUNOR, Burson y administración de cuentas.
5. Registrar cualquier cambio deseado; si no hay bloqueantes, aprobar el congelamiento del frontend.

Los viewports automatizados validan adaptación del layout, pero no sustituyen una comprobación física de teclado, tacto, navegador y legibilidad.
