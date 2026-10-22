# Publicación de Social · 21/10/2026

Autorizada por Marco: «sincroniza con vercel», reanudada tras confirmar la reactivación de Supabase. Operador: Codex en el repositorio Sistema_R. Ventana: esta sesión.

## Destino y alcance

- GitHub: `rozen1993/rhino-panel`, rama `master`.
- Vercel: proyecto existente `rhino-panel`, producción, raíz `frontend`, dominio `midnightstudios.vercel.app`.
- Supabase: proyecto vinculado `sistema-r`, ref `fzbp…qmnf`. Aunque documentos de septiembre lo llamaban staging, contiene datos reales y es el backend del despliegue utilizado por el equipo.
- Código previsto: `d244730`; respaldo previo de código `8cd5a85`.
- Despliegue anterior Ready: `dpl_7TU5BxrFxbp2ZSMyEYgyAjMRmXK6`, alias anterior `rhino-panel-dr3n6lda4-marcos-projects-65572cc0.vercel.app`.
- Migraciones aditivas pendientes confirmadas por dry-run: `202610200001` y `202610210001`. Sin seeds, resets ni eliminación de datos.
- Funciones: añadir `social-photo-upload` y actualizar `admin-erasure`; mantener JWT requerido.

## Comprobaciones previas

- Supabase: `ACTIVE_HEALTHY` tras reactivación del propietario.
- Inventario previo: 22 actividades, 7 perfiles y 0 objetos Storage. Sin buckets ni políticas Storage anteriores.
- Respaldo: en el directorio privado local ya establecido `LOCALAPPDATA/SistemaR/backups/live`; no se versionan dumps ni credenciales.
- Respaldo completo `20261021-200932-62422a60d4d14a13b06eb86de6db69ba`: esquema y datos, manifiesto SHA-256. Restauración verificada en base UUID desechable: 22 actividades, 7 perfiles, 7 usuarios Auth y 26 migraciones previas. Solo se retiró la base de ensayo; el respaldo permanece privado.
- Ambas migraciones aplicadas. Después: 22 actividades y 7 perfiles sin variación, 0 fotos; bucket `activity-social-photos` privado, límite por objeto 614400 bytes y únicamente política SELECT autenticada.
- `social-photo-upload` v1 y `admin-erasure` v2: ACTIVE, `verify_jwt=true`. Ambas rechazan solicitudes sin sesión con HTTP 401.
- GitHub recibió `d244730`. El primer despliegue falló en TypeScript porque un test importaba el validador Edge fuera de `frontend`, excluido del artefacto Vercel. Se corrige únicamente el empaquetado: excluir `frontend/__tests__` y `frontend/e2e` del despliegue web, conservándolos en Git y en las comprobaciones locales/CI. No se desactiva la comprobación TypeScript de la aplicación.
- Vercel: pendiente de verificar Ready y alias de producción tras esta corrección.

## Reversión y protección de datos

Si falla el frontend, mantener o volver al despliegue anterior de Vercel. Las tablas nuevas permanecen: no revertir la base mediante DROP, reset o restauración encima de datos reales. Cualquier corrección SQL será incremental. No ejecutar pruebas de borrado ni crear actividades/cuentas de demostración en producción. El ensayo de restauración usa exclusivamente una base UUID desechable.
