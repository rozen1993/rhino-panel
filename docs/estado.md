# Estado

**Actualizado:** 2026-09-01

**Auditoría de cierre local:**
[`auditoria-final-cortes-0-a-7.md`](auditoria-final-cortes-0-a-7.md). El resultado
es `APTO_PARA_CIERRE_LOCAL`; la liberación permanece en **No-Go remoto** hasta
completar los gates PostgreSQL, staging y Preview real allí documentados.

## Fase activa

Sistema R está en ejecución por cortes sobre el checkpoint Git `0be6965`. El
Corte 0 consolidó el contrato objetivo. Los Cortes 1 y 2 de autoridad y cuentas
quedaron cerrados en código tras dos rondas de revisión cruzada Claudex. El
Corte 3 dejó implementado y revisado el flujo Burson real. El Corte 4 dejó
implementada y revisada la conversación privada Admin–Operario; su revisión
Claudex no encontró defectos críticos ni altos. El Corte 5 dejó implementada,
corregida y revisada la baja reversible con Papelera Admin. El Corte 6 dejó
implementado, corregido y verificado localmente el Histórico Supabase desde
2026. El Corte 7 ya tiene preparación local de Preview/producción, preflight
fail-closed, cabeceras, bloqueo de indexación y runbook; no representa un
despliegue. La ejecución de migraciones y la matriz RLS contra PostgreSQL
continúan como gate acumulado antes de producción.

## Decisiones ya consolidadas

- Admin conserva planificación, asignación, baja y restauración.
- El Operario responsable conserva únicamente la ejecución.
- `can_create_own_activities` es individual, revocable y `false` por defecto.
- Burson crea y consulta encargos propios sin acceso interno.
- La clave inicial es temporal y bloquea el negocio hasta que se cambie.
- El Histórico comienza en 2026 y continúa por año.
- El chat IA no se implementa; solo existe su PDF de planificación separado.

La fuente completa es `contrato-producto-vigente-2026-08-28.md`.

## Estado técnico observado

- La migración inicial `202608220001_backend_foundation.sql` continúa aplicada
  en staging como cimiento. La migración local
  `202608280001_activity_authority.sql` agrega el permiso individual y separa
  planificación, creación propia, ejecución y avance de estado.
- La migración local `202608290001_account_administration.sql` añade las
  invariantes de cuentas, auditoría, revocación de sesiones y puerta de clave
  temporal. Las Edge Functions mantienen la clave de servicio fuera del
  frontend y completan las operaciones de Auth.
- La planificación toma bloqueos compartidos sobre el Admin y el Operario
  asignado. Una desactivación, cambio de rol o revocación concurrente debe
  esperar y revalidar, por lo que no puede quedar una actividad abierta con un
  responsable inactivo. La carrera forma el punto 30 del gate PostgreSQL.
- La clave temporal se compara mediante una huella PBKDF2-SHA256 con sal
  aleatoria y se elimina al completar el cambio; nunca se persiste en claro.
- La migración local `202608300001_burson_channel.sql` añade la única RPC de
  creación Burson. Su idempotencia excluye al responsable derivado y comparte
  el lock de administración de cuentas, por lo que un replay sigue siendo
  válido después de transferir el vínculo especial.
- Burson ya usa datos Supabase con una proyección propia, ruta de detalle
  externa y fronteras directas que impiden abrir la ficha operativa.
- La migración local `202608300002_private_conversations.sql` añade mensajes
  internos, apertura exclusiva de Admin, control optimista, autoría por mensaje,
  baja lógica y acceso RLS limitado a Admin y al responsable vigente. El
  frontend real hidrata el hilo solo en el detalle interno y nunca envía al
  cliente mensajes dados de baja.
- La migración local `202608310001_activity_trash.sql` añade baja y restauración
  versionadas, motivo obligatorio, auditoría inmutable y un índice parcial de
  Papelera. Admin dispone de la ruta real `/papelera`; una actividad dada de
  baja queda fuera de Actividades, Histórico, Burson y de las consultas de los
  demás roles. Restaurar trabajo abierto exige reemplazar a un responsable
  inactivo; el trabajo entregado conserva su responsable histórico.
- El Histórico autentica primero a Admin y lee Supabase mediante RLS de sesión,
  sin `service_role` ni fixtures de respaldo. Acota candidatos al año solicitado,
  excluye Papelera, pagina por keyset, conserva todas las jornadas discontinuas,
  revalida el solapamiento final y comparte un único calendario anual con demo.
- Vercel ejecuta un preflight anterior al build que solo lee `process.env`,
  exige Preview→staging o Production→production, bloquea `demo`, coteja el ref
  esperado y rechaza claves legacy/privilegiadas sin imprimir valores. El build
  añade cabeceras defensivas, elimina `X-Powered-By` y mantiene la plataforma
  privada fuera de indexación mediante metadata, encabezado y `robots.txt`.
- `runbook-preview-produccion.md` separa preparación local, autorización,
  staging, Preview, matriz smoke, evidencia, Go/No-Go, producción aislada,
  observabilidad nativa y rollback forward-only.
- El árbol partió limpio desde `0be6965`; el Goal no hace commit, push ni
  despliegue.

## Verificación local acumulada hasta el Corte 7

- TypeScript, ESLint, 191 pruebas Vitest en 21 archivos y build de producción,
  aprobados sobre la implementación local del Corte 7.
- `build:vercel` aprobó un ambiente Preview sintético aislado y el preflight sin
  variables de despliegue falló cerrado con 11 diagnósticos genéricos, sin
  cargar `.env.local` ni revelar valores.
- La revisión limpia Claudex del Corte 7 no encontró hallazgos críticos, altos
  ni medios. Sus observaciones bajas válidas también quedaron cerradas: paridad
  de la política `sb_publishable_`, detección de claves legacy/secretas incluso
  embebidas, mensaje de data source sin eco y cabeceras comprobadas sobre una
  redirección privada. Después se repitieron todos los gates locales.
- Deno 2.9.6: formato y `deno check` de las dos Edge Functions, aprobados. La
  derivación PBKDF2 también fue ejecutada con igualdad y diferencia correctas.
- Las revisiones Claudex de solo lectura corrigieron y después cerraron los
  hallazgos de vínculo Burson inactivo, permiso alternativo, errores de Edge,
  fecha mínima, huella temporal, auditoría y canal Burson. La revisión del
  Corte 3 confirmó la RPC, el lock compartido, el replay tras transferencia y
  el DTO externo; sus hallazgos locales fueron corregidos.
- La revisión Claudex del Corte 4 verificó estáticamente sus once cláusulas sin
  hallazgos críticos ni altos. Señaló como gate externo pendiente la ejecución
  real de SQL, RLS, grants, códigos PostgREST y carreras, y como corrección local
  el registro completo de `202608300002` en este procedimiento.
- La revisión cruzada Claudex del Corte 5 no encontró defectos críticos ni
  altos. Sus hallazgos válidos quedaron corregidos: evidencia documental,
  orden único del lock de cuentas, detalle de reasignación en auditoría,
  traducción de `40P01`, eliminación de un lector sin consumidores y espera
  independiente por tarjeta. La ejecución real de `202608310001` forma parte
  del gate externo acumulado.
- Playwright demo: 10 recorridos actuales aprobados. Cubren fronteras de rol y
  acceso directo, concesión/revocación del permiso individual, creación propia
  forzada al Operario autorizado, planificación Admin con ejecución exclusiva
  del responsable, creación y consulta Burson sin superficies internas, cambio
  obligatorio de clave temporal, Papelera con baja/restauración, el Histórico
  en cuatro viewports, navegación anual con piso 2026 y retorno de foco desde el
  detalle móvil. El décimo recorrido comprueba sobre el build real las cabeceras
  de seguridad, la ausencia de `X-Powered-By`, metadata `noindex`, `robots.txt`
  y una redirección privada sin sesión.
- Las pruebas Vitest ejecutan además los Server Actions que llaman las RPC de
  planificación, creación propia, permiso individual y administración. También
  simulan un `max_rows` menor que la página solicitada y verifican keyset para
  actividades, jornadas, auditorías, conversaciones, encargos Burson, perfiles,
  cuentas y el Histórico. El loteo de más de cien UUID se prueba tanto a través
  del lector de actividades como en el Histórico; ninguna lectura conserva
  offset.
- El arnés E2E fija `SISTEMA_R_DATA_SOURCE=demo`, levanta el build de producción
  y nunca reutiliza otro servidor.
- Estas pruebas demo validan el contrato de interfaz, pero no demuestran todavía los permisos
  RLS ni las RPC contra una instancia PostgreSQL real.
- `docs/plan-chat-ia-reutilizable.pdf`: PDF 1.4 válido, tres páginas, 58 620
  bytes al generarse.
- Los mismos gates se repetirán después de cada corte de código.

## Próximos gates

1. Compilar las migraciones desde cero cuando exista PostgreSQL local.
2. Ejecutar la matriz RLS, las lecturas reales del Histórico y `EXPLAIN` de sus
   consultas si Docker está disponible.
3. Con autorización explícita, aplicar staging y ejecutar el gate de 31 puntos.
4. Desplegar Preview, completar smoke/Safari real y conservar evidencia.
5. Crear un proyecto separado, backup restaurable y dominio antes del Go de
   producción.
