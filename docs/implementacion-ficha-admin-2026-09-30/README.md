# Ficha Admin compacta — opción 01

Respaldo previo: `986674f`. Marco autorizó la publicación el 30/09/2026.
Seguimiento del despliegue: `docs/despliegue-ficha-admin-2026-09-30.md`.

## Implementado

- Servicio y periodo juntos con una sola acción «Guardar relación».
- Vista previa del conteo con las reglas existentes: solo entregadas, realizadas,
  no sustituidas, una unidad por actividad. No duplica lo ya contabilizado.
- Resumen público opcional; al dejarlo vacío usa la descripción pública o título.
- Reemplazo plegado, ficha actual fija como sustituta, elección de original.
- Motivo, solicitante, fecha y canal en un único formulario. Puede reutilizarse
  un acuerdo vigente. El enlace de respaldo es opcional.
- Historial con versiones del material, relaciones, motivos y acuerdos de respaldo.
- Configuración de periodos y opciones avanzadas plegadas: se conservan las
  correcciones y registros anteriores, sin borrar nada para simplificar la UI.
- Permisos de Admin en interfaz, Server Action y PostgreSQL; Aunor sigue en consulta.

La skill frontend-design guio la jerarquía y adaptación móvil, manteniendo
tipografías, azul técnico, cian, lima y componentes compartidos del proyecto.

## Integridad y publicación

La migración `202609300001_admin_compact_management.sql` añade una RPC que compone
operaciones existentes dentro de una transacción. Una falla revierte el conjunto;
el requestId evita duplicados al reintentar y las versiones detectan cambios concurrentes.
No cambia estados de ejecución, actividades históricas ni metas existentes.

La migración remota se aplicó el 30/09/2026 tras verificar un respaldo privado.
Las pruebas de escritura se realizaron exclusivamente con datos sintéticos.
Secuencia de publicación:

1. Obtener autorización de publicación y verificar un respaldo privado restaurable.
2. Aplicar la migración pendiente antes de desplegar el frontend que la usa.
3. Publicar y verificar la ficha con lecturas reales; no crear fixtures en producción.

## Verificación local

Resultado: 381 pruebas unitarias y 46 pruebas de navegador aprobadas;
TypeScript, ESLint y build aislado correctos. SQL verificado en base UUID
desechable, retirada al finalizar. Las revisiones visuales cubren 1440 y 390 px.

- TypeScript y ESLint.
- Pruebas unitarias de permisos, guardado, conflictos, reintentos y conteos.
- PostgreSQL en base UUID desechable: cadena completa de migraciones, Admin-only,
  rechazo de versiones antiguas, rollback de un acuerdo si falla su reemplazo,
  reintentos idempotentes y conservación del estado de ejecución.
- Playwright en proceso demo aislado, navegador nuevo y datos sintéticos;
  pruebas de contrato, reemplazo, histórico y consulta de Aunor.

Los PNG de esta carpeta son capturas de la implementación en demo, no datos reales.
Las capturas de sección ocultan únicamente la navegación fija durante la captura
para que no tape el contenido de un PNG largo; la aplicación conserva su navegación.

Comandos desde `frontend`:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
node scripts/verify-history-contract.mjs
npm.cmd exec playwright -- test e2e/admin-compact.spec.ts e2e/aunor.spec.ts e2e/contract-reference.spec.ts e2e/history-contract.spec.ts --config=playwright.aunor.config.ts
```

Para las regresiones, establecer `SISTEMA_R_CAPTURE_DIR=.verificacion/admin-compact-regressions`
evita sobrescribir evidencias históricas de rondas anteriores.
