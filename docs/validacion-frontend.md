# Validación del frontend

**Última ejecución local completa:** aprobada el 2026-09-01 sobre la
implementación del Corte 7, incluido el Histórico Supabase desde 2026 y la
preparación fail-closed de despliegue. La
evidencia histórica anterior fue sustituida por el contrato del 2026-08-28; el
estado acumulado se registra en `estado.md`.

## Cobertura ejecutada

- TypeScript estricto y ESLint: aprobados sin errores.
- Vitest: 191 pruebas aprobadas en 21 archivos sobre contrato, roles, permisos, persistencia,
  idempotencia, autoridad de RPC y Server Actions, clave temporal, cuentas,
  vínculo y canal Burson, conversación privada, Papelera, stores, contrato
  visual, lectores Supabase con paginación keyset bajo `max_rows` reducido,
  exclusión de bajas, jornadas, navegación anual y preflight aislado de
  Preview/producción.
- Build optimizado de Next.js: aprobado.
- Edge Functions: `deno fmt --check` y `deno check` aprobados con Deno 2.9.6;
  prueba ejecutada de la huella PBKDF2 con sal, igualdad y diferencia correctas.
- Playwright: 10 recorridos aprobados con fronteras de los tres roles y acceso
  directo, concesión/revocación del permiso individual, cambio obligatorio de
  clave temporal, creación propia forzada al Operario autorizado, flujo
  Admin→responsable, creación/consulta de encargos Burson sin superficies
  internas, conversación Admin–responsable, baja/restauración Admin con
  aislamiento de roles y el Histórico en 390×844, 768×1024, 1366×900 y
  1920×1080, además de navegación por año, piso 2026 y restitución de foco en el
  detalle móvil. El recorrido adicional consulta el build real y verifica CSP
  estructural, COOP, Permissions/Referrer/HSTS, `nosniff`, antiframing,
  `X-Robots-Tag`, ausencia de `X-Powered-By`, metadata, `robots.txt` y una
  redirección privada sin sesión.
- Las pruebas E2E levantan el build de producción, no el servidor de desarrollo.
- `build:vercel` aprobó un Preview sintético aislado. El mismo preflight sin
  variables de despliegue terminó con exit 1: emitió diagnósticos genéricos por
  nombres de configuración faltante y por `VERCEL_ENV` inválido, nunca valores.

## Cambios cubiertos por la corrección de auditoría

- Persistencia del enlace y opinión al crear una actividad.
- Edición protegida por responsable, versión e idempotencia.
- Bloqueo exclusivo del enlace y la opinión tras iniciar la conversación Admin–Operario.
- Transferencia de encargos Burson pendientes al nuevo operario especial.
- Creación Burson idempotente, asignación automática bajo el lock de cuentas,
  DTO Supabase limitado y ruta de consulta separada de la ficha operativa.
- Conversación persistente con apertura única de Admin, control optimista,
  versiones por mensaje, edición/baja por autor, exclusión de mensajes dados de
  baja y aislamiento de Burson.
- Baja reversible con motivo, versión optimista, auditoría, Papelera exclusiva
  de Admin y restauración segura de actividades abiertas con responsable
  inactivo, sin perder hilo, mensajes ni jornadas. Las pruebas de componente
  cubren doble envío, dos tarjetas pendientes, resolución fuera de orden y
  recuperación de errores sin bloquear el resto de la Papelera.
- Cierre de sesión real, navegación mensual funcional y enlaces externos HTTPS validados.
- Store con validación de forma y retorno seguro a datos semilla ante corrupción.
- Acceso mediante diálogo semántico, foco visible, enlace para saltar al contenido y navegación móvil con área segura.
- Histórico interactivo en demo y Supabase con solapamientos, jornadas
  discontinuas, fecha civil de Lima, rejilla anual 1/2/4 y detalle móvil
  accesible. Playwright cubre demo; Vitest cubre la ruta y el lector reales con
  clientes Supabase simulados, sin atribuirles evidencia RLS.
- Despliegues cerrados por defecto: `demo` se rechaza en cualquier ambiente
  Vercel; Preview solo admite staging y Production otro target. La URL Supabase,
  su ref esperado, el origen público HTTPS cotejado con las variables de sistema
  Vercel y la publishable key se validan antes de compilar, sin leer archivos
  `.env` ni imprimir valores. El runtime Vercel repite el rechazo de una clave
  no publicable; el barrido detecta claves legacy o secretas aunque estén
  embebidas y las redirecciones reciben las mismas cabeceras.

## Revisión manual recomendada

1. Abrir `http://localhost:3000` en un teléfono y un equipo de escritorio reales.
2. Ingresar con cada rol y confirmar textos, jerarquía, tacto, teclado y legibilidad.
3. Crear y editar una actividad, completar una entrega, iniciar una conversación como Admin y confirmar el bloqueo del enlace/opinión.
4. Transferir el vínculo Burson y confirmar que solo cambian los encargos pendientes.
5. Dar de baja una actividad, comprobar su aislamiento por rol y restaurarla
   desde la Papelera con teclado y en un viewport móvil.
6. Navegar el Histórico desde 2026, abrir/cerrar el detalle móvil con teclado y
   comprobar el bloqueo de scroll y el retorno de foco en Safari/iOS real.
7. Tras autorización, ejecutar el runbook de Preview, la matriz RLS/RPC de 31
   puntos y comprobar cabeceras, logs y redirects sobre la URL desplegada.

Los recorridos Playwright usan el modo demo. Las rutas Supabase y sus Server
Actions pasan pruebas locales con clientes simulados, y las Edge Functions
pasan sus gates de Deno. Las migraciones aplicables hasta `202608310001` solo
tienen validación estática: compilación PostgreSQL, propagación de códigos,
matriz RLS, consultas/planes reales del Histórico y carreras todavía deben
ejecutarse con Docker o en un ambiente autorizado antes de producción. El
procedimiento, evidencia y Go/No-Go se definen en
`runbook-preview-produccion.md`; no se ha desplegado Preview ni producción.
