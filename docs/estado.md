# Estado

**Actualizado:** 2026-08-21

## Fase activa

El frontend simulado implementa el modelo operativo acordado de tres roles: **Operario**, **Admin** y **Burson**. El modelo anterior de Coordinación, Supervisión y AUNOR quedó retirado de las rutas activas.

El Histórico es ahora un calendario anual de doce meses basado en la dirección visual `01-malla-anual-clasica`. Soporta días individuales, rangos continuos y varios rangos discontinuos por actividad. Al seleccionar una fecha muestra responsable, estado, fechas, descripción, opinión y enlace seguro de OneDrive.

## Validación automatizada

- TypeScript estricto: aprobado.
- ESLint: aprobado.
- Vitest: 14 pruebas del nuevo contrato aprobadas.
- Build de producción: aprobado.
- Playwright: 3 recorridos aprobados, incluido el flujo crítico Operario–Admin y los viewports 390×844, 768×1024, 1366×900 y 1920×1080.

La persistencia y autenticación siguen siendo simuladas mediante navegador y cookies. Antes de producción deben sustituirse por autorización de servidor, base de datos y auditoría persistente.

## Referencias visuales

- `diseno/historico-calendario-opciones/01-malla-anual-clasica.png`
- `diseno/historico-calendario-responsive/`

## Ejecución local

Desde `frontend/`: `npm install`, `npm run dev` para desarrollo o `npm run build && npm start` para producción local.
