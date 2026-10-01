# Registro histórico y centro de contrato

Implementación de las propuestas 01 y 02 aprobadas por Marco, con autorización
expresa de publicar en GitHub/Vercel. Respaldo de código previo: `aa3044f`.
Incluye las correcciones locales documentadas en
[la auditoría](../correcciones-auditoria-2026-09-30.md).

## Dónde encontrarlas

- **Admin → Mi panel → Registrar trabajo terminado** (`/actividades/registro-historico`).
  Permite registrar un trabajo antiguo directamente como Entregada, con responsable,
  material HTTPS, clasificación y servicio contractual opcional. Antes de guardar
  muestra una revisión y exige confirmar que el trabajo está terminado.
- **Admin → Contrato** (`/contrato`). Ocho servicios mensuales y cuatro anuales,
  sus X/Y, trabajos que los componen, excepciones y configuración de periodos/metas.
  El mes se conserva en la URL y al volver desde la ficha.

Grabación, Locución y Creatividad usan fecha de realización; Edición usa fecha
de entrega del proyecto. Son equivalentes para ubicar el trabajo en el histórico
y el contrato. La carga actual no desplaza abril al mes presente. Las jornadas
múltiples se conservan; si cruzan periodos, requieren revisión explícita.
El registro histórico admite fechas anteriores a hoy según America/Lima.
Para trabajo actual/futuro permanece «Planificar actividad».

No hace falta volver a cargar las actividades anteriores. Esta publicación no
reclasifica, cambia fechas, entrega, elimina ni recrea ninguna actividad existente.
Especial sigue contando como una unidad; no se cambian cuotas ni se trasladan
excedentes. Fiesta de fin de año continúa anual. Aunor conserva su vista de consulta.

## Seguridad y consistencia

- Ruta, acción y RPC exigen Admin activo. Operario/Aunor no reciben estos accesos.
- Una sola transacción registra actividad, material, auditoría y relación pública.
  Una falla revierte todo el registro. No se inventan inicios ni horas de entrega.
- Los reintentos de la misma solicitud no duplican la actividad. Si la respuesta
  de red es incierta, el formulario mantiene la solicitud y bloquea su edición
  mientras se reintenta. Esta protección no persiste tras cerrar el navegador.
- Material final HTTPS sin credenciales en el enlace. Clasificación explícita;
  no se decide automáticamente Estándar/Especial.
- Las vistas previas son estimaciones; los conteos finales proceden de los
  registros confirmados y comparten el cálculo de Admin/Aunor.
- Cierre/recarga avisa si hay cambios sin guardar. No se afirma recuperación
  completa de borradores ni protección de todos los enlaces internos.

## Capturas de la implementación

Datos **sintéticos**, producidos en servidor demo aislado sin conexión a Supabase.
No son registros ni conteos reales. La skill frontend-design ayudó a conservar
la tipografía, jerarquía y paleta ya aprobadas, sin crear otra identidad visual.

| Pantalla | Escritorio | Móvil |
|---|---|---|
| Registro de Grabación | [PNG](registro-grabacion-1440.png) | [PNG](registro-grabacion-390.png) |
| Registro de Edición | [PNG](registro-edicion-1440.png) | [PNG](registro-edicion-390.png) |
| Centro de contrato | [PNG](contrato-1440.png) | [PNG](contrato-390.png) |

## Verificación local

- TypeScript, ESLint y build Next 16.3.8 correctos.
- 417 pruebas unitarias en 55 archivos correctas; 28 pruebas de funciones correctas.
- Suite completa de 51 pruebas de navegador correcta. Tras el ajuste final de
  clasificación/navegación, 7 pruebas de histórico/contrato correctas; última
  recaptura y comprobación de las rutas nuevas: 4/4 correctas.
- PostgreSQL 17 desechable: cadena completa de 24 migraciones, permisos,
  idempotencia, versiones y rollback correctos. Solo se retiraron recursos UUID
  creados por las pruebas; ninguna prueba escribió en una base real.
- `npm audit --omit=dev --audit-level=high`: cero vulnerabilidades notificadas.
- Revisión de PNG en escritorio/móvil; comprobación automatizada sin errores
  JavaScript ni desbordamiento horizontal en los nuevos flujos.

## Respaldo privado y migración remota

Destino habitual, fuera de Git y protegido por ACL:
`%LOCALAPPDATA%/SistemaR/backups/live/20260930-194733-33546a3d5b364e40b7cd27ff1175a34f`.

Exportación de `public`, `private`, `auth` y `supabase_migrations`, hashes SHA-256
contrastados con `COMPLETE.json`. Restauración íntegra en la base UUID desechable
`sr_restore_test_3960861b75244dcaa22c20d3408a5fcc`: 23 actividades, 7 perfiles,
7 usuarios Auth y 23 migraciones. Solo se retiró esa base de verificación.

En el proyecto existente `fzbpqgjrdreefontqmnf` se aplicó exclusivamente
`202609300002_historical_registration.sql`, sin seeds ni cambios de roles.
Añade una función; no ejecuta correcciones sobre registros reales.

Comprobación antes/después: 23 actividades, 7 perfiles y 7 usuarios Auth sin
cambios; migraciones 23 → 24. Digest agregado de actividades idéntico:
`c7d30800d69244601df1b2cd9e57f52e`. RPC ejecutable por `authenticated` con
verificación interna de Admin, no por `anon` ni `service_role`. Dry-run posterior
sin migraciones pendientes.

## Publicación y límites

Destino autorizado: `rozen1993/rhino-panel`, rama `master`, proyecto Vercel
`rhino-panel`, raíz `frontend`, alias `https://rhino-panel.vercel.app`.
El resultado de GitHub Actions y el despliegue de este commit deben comprobarse
por SHA; las pruebas locales por sí solas no certifican la publicación.
No se harán guardados reales como smoke test de producción.

No se publican las propuestas 03–05 (pendientes, búsqueda transversal, plantillas
y resumen mensual). Continúan abiertos los pendientes operativos del informe de
auditoría, incluidos respaldo periódico, cierre de credenciales de piloto y
decisión de alojamiento. No se cambiaron contraseñas, planes ni facturación.

La migración es aditiva y compatible con el frontend anterior. Una recuperación
de interfaz no debe restaurar la base sobre trabajos posteriores ni ejecutar reset.

### Primera publicación y ajuste del verificador

Frontend `61802ea90f95b92d21f2ffcb542ca52d3ee121c0` publicado en Vercel Production
con resultado `success`: GitHub Deployment `6773586877`, Vercel
`CsqTDd1ksTCW4CwE1hpchdziLmDx`. En GitHub Actions `36798893444`, el nuevo job SQL
detectó una carrera en el arranque del contenedor de pruebas: `pg_isready` por
socket aceptaba el servidor temporal de inicialización antes de su reinicio.
El verificador ahora espera TCP interno, disponible en el servidor definitivo.
No modifica la aplicación ni la base remota y no oculta ni omite pruebas.

La comprobación HTTP de `/contrato` sin sesión no mostró contenido privado,
pero devolvió el redireccionamiento de Next dentro de una respuesta 200.
Se incluyó `/contrato` en el proxy de rutas protegidas para redirigir con HTTP
307 antes del streaming, igual que las otras secciones. Se añaden regresiones
para ausencia de sesión, cuenta inactiva y cambio obligatorio de clave.

Reverificación local: TypeScript y ESLint correctos, las seis regresiones nuevas
del proxy correctas, verificador SQL completo correcto con el arranque TCP.
El job frontend de la primera publicación terminó correctamente, incluidas las
51 pruebas de navegador en Linux. El commit de ajuste vuelve a ejecutar ambos
jobs y a desplegar Vercel; su estado final se verifica por su nuevo SHA.
