# Publicación de Aunor de solo lectura - 14/09/2026

## Alcance autorizado

Marco pidió completar el cambio de Aunor («terminarlo entonces», seguido de
«continua»). Se publica el rol de consulta integral con Actividades, Histórico y
Contrato; las entregadas salen del panel a las 72 horas, sin borrarse del histórico.
No incluye cambios de contraseñas, fixtures, eliminaciones, chat IA, planes de pago
ni destinos externos de respaldo. Operador: Codex en el equipo de Marco.

## Destinos y recuperación

- Supabase enlazado: `sistema-r`, referencia `fzbpqgjrdreefontqmnf`. Es la base
  real usada por el despliegue; no se trata como una base de demostración.
- Vercel: `rhino-panel`, dominio `https://rhino-panel.vercel.app`.
- Repositorio público: `rozen1993/rhino-panel`, rama de producción `master`.
- Respaldo de código previo: `591a693`.
- Producción anterior: commit `078c73a7b41396317a638659c4fb2cae27a715f8`,
  despliegue GitHub `6420458550`, estado Vercel `success`.
- Artefacto anterior:
  `https://rhino-panel-2toof2w0r-marcos-projects-65572cc0.vercel.app`.

Si falla la publicación, se conserva el artefacto anterior y se corrige hacia
delante. El esquema nuevo conserva registros y es compatible con las lecturas
anteriores; sí rechaza deliberadamente las confirmaciones antiguas de Aunor.
Un retorno completo de comportamiento requiere revisar conjuntamente aplicación
y esquema. No restaurar ni sobrescribir la base real automáticamente, porque
puede haber trabajo posterior al respaldo.

## Respaldo privado verificado

Se reutilizó el destino privado local habitual, sin enviar datos a terceros:

`%LOCALAPPDATA%/SistemaR/backups/live/20260914-160601-b4c9be70f17847de99d629e478fc2364`

ACL con herencia deshabilitada y acceso exclusivo de Marco. Esquemas respaldados:
`public`, `private`, `auth` y `supabase_migrations`. No se incorporan dumps ni
credenciales a Git. El marcador `COMPLETE.json` registra:

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| schema.sql | 229949 | `5F0B227BF96DD65BDBD850C7E05BD2E6893A798E1F9F2769D2ABF1B74385B388` |
| data.sql | 268472 | `78B47058129CF28582BF706295E8E120FBC3741252550ED2A1B4F286C9EEFA94` |

`verify-backup.mjs` restauró correctamente el respaldo en una base UUID aislada:
7 perfiles, 7 usuarios de Auth, 6 actividades y 17 migraciones. El verificador
retiró únicamente esa base desechable; el respaldo privado se conserva.

Lectura de control remota previa: 7 perfiles, 7 usuarios Auth, 6 actividades
(3 activas), 0 confirmaciones y 0 entregadas sin fecha de entrega.

## Puertas de publicación

1. Suite local: 273/273 unitarias, TypeScript, ESLint y build correctos;
   13 pruebas de navegador, 19 escenarios Auth/REST y verificador SQL aprobados.
2. `db push --dry-run --linked`: únicamente
   `202609140001_aunor_read_only.sql`; sin semillas ni otros cambios pendientes.
3. Aplicar esa migración transaccional, sin resets ni escrituras de trabajo real.
4. Comprobar migraciones, conteos y permisos mediante consultas de solo lectura.
5. Enviar los commits a `master`. La integración existente publica en producción;
   no se cambian variables, región, infraestructura ni plan.
6. Verificar el estado Vercel para el SHA enviado y el dominio público. Las
   evidencias automáticas de commit, Actions y despliegue quedan en GitHub.
7. Comprobar la sesión de Aunor, si el acceso vigente está disponible, únicamente
   navegando por sus pantallas. No crear registros para probar estados ausentes.

La sesión de la CLI local de Vercel estaba vencida. Se usa la integración de GitHub
ya verificada, sin modificar la cuenta ni requerir otro método de autenticación.
