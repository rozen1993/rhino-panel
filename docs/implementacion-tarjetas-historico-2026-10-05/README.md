# Tarjetas de histórico: petróleo y lavanda

Selección: opción 02 de la tercera ronda, sin descripción en la tarjeta. Se conserva la descripción completa al abrir Ver detalles. Modalidades y Especial comparten un grupo con iconos, y el responsable sigue oculto para Aunor.

- Commit de respaldo anterior al cambio: `a04e1b9`.
- Entregada normal: petróleo `#124b57`, idéntico al botón Ver detalles.
- Entregada especial: morado `#674696`, como en la propuesta elegida.
- `StatusPill` compartido por paneles, fichas, histórico, contrato, papelera y registros; no se crea un estado nuevo ni cambia el flujo de trabajo.
- Nuevo CSS de tarjetas aislado para no alterar otros componentes ni los calendarios.
- Sin migraciones ni modificaciones de datos reales.

## Verificación

Se comprueban componentes, compilación y navegación en navegador con build demo aislado. Capturas sintéticas de Admin, Operario y Aunor se guardan en esta carpeta tras ejecutar `historical-cards-design.spec.ts` con `playwright.historico.config.ts`.

Las pruebas incluyen colores, modalidades, descripción solo en detalle, retorno con foco, privacidad Aunor, escritorio/móvil y reflujo a 320px con fuente al 200%.

Resultados locales: TypeScript y ESLint sin errores, 457 pruebas unitarias aprobadas (63 archivos), build aislado correcto y 11 pruebas de navegador aprobadas. Revisadas visualmente las capturas de las tarjetas Admin en escritorio y móvil. Los estados Programada y En proceso mantienen su diseño; el cambio global corresponde solo a Entregada.

[Escritorio](admin-1440-tarjetas.png) · [Móvil](admin-390-tarjetas.png) · [Aunor](aunor-1440-tarjetas.png).

## Preparación de publicación

Actualización mínima del lockfile de `source-map-js` 1.2.1 a 1.2.2 para corregir la alerta GHSA-68fv-2mgg-jv7q que bloqueaba la auditoría de CI. `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades de producción; no equivale a una auditoría completa de las dependencias de desarrollo.
