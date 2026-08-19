# Estado

**Actualizado:** 2026-08-19

## Fase activa

**Fase 3 — Validación y handoff del frontend.** La construcción funcional de la Fase 2 está completa con datos simulados. Aún no se congela ni se considera aprobada: falta la revisión de Marco en dispositivo real.

La aplicación cubre los ocho perfiles definidos: Grabación, Edición, Coordinación, Creatividad, Locución, Supervisión/Administración, AUNOR y Burson. Incluye actividades, borradores, edición y eliminación de mensajes propios, observaciones internas, aprobación/cancelación, feedback AUNOR, tablero Burson, historial, cuentas y protección de rutas.

## Validación automatizada

- `npm run verify`: TypeScript estricto, ESLint, 59 pruebas unitarias y build de producción.
- `npm run test:e2e`: 11 recorridos de Playwright sobre roles, permisos, persistencia de borradores, supervisión, AUNOR, Burson, 404 y viewports móvil/tablet/escritorio.
- La persistencia y autenticación siguen siendo simuladas mediante navegador/cookies; no son aptas para producción.

## Puerta de salida

Marco debe recorrer `http://localhost:3000` en al menos un teléfono real y un equipo de escritorio, confirmar contenido, diseño y flujos por rol, y registrar correcciones. Con esa aprobación se congela el frontend y se inicia la integración backend.

## Pendientes externos o de producto

- Definir proveedor y estructura definitiva del enlace de material (OneDrive u otro).
- Confirmar catálogo de servicios/roles con César si difiere del mock actual.
- Definir exportación del historial.
- Definir recuperación de contraseña.
- Sustituir mocks, `localStorage` y cookies de prueba por autenticación, base de datos, autorización en servidor y auditoría real durante la Fase 4.

## Documentos vigentes

- `docs/handoff-frontend.md`: contrato técnico y funcional para backend.
- `docs/validacion-frontend.md`: alcance de pruebas y lista de aprobación manual.
- `docs/decisiones.md` y `docs/decisiones-pendientes.md`: decisiones cerradas y abiertas.
- `docs/fase-0-concepcion.md`, `docs/fase-1-ux.md` y `docs/sistema-diseno.md`: definición funcional y visual.

## Ejecución local

Desde `frontend/`: `npm install`, `npm run dev` para desarrollo o `npm run build && npm start` para producción local.
