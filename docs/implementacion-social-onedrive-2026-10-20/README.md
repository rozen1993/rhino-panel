# Social · carpetas OneDrive y ejemplos de presentación

> Documento histórico. La decisión posterior añade fotos optimizadas con descarga directa y conserva OneDrive como enlace opcional. Ver [implementación del 21/10/2026](../implementacion-social-fotos-2026-10-21/README.md); sus instrucciones de publicación sustituyen las de este documento.

Implementación iniciada el 20/10/2026, verificada el 21/10/2026. Solo local; sin publicación ni modificaciones de bases de datos reales. Respaldo anterior: `d8f21f3`.

## Resultado

- La pestaña, cabecera y carga ahora se llaman **Social**. La ruta `/aunor/fotos` permanece estable.
- Se conserva la composición de álbumes por actividad aprobada, siguiendo la línea visual DA VINCI. El botón principal es **Abrir carpeta en OneDrive**, con icono de vínculo y apertura en otra pestaña.
- Admin y el operario responsable pueden vincular una carpeta desde **Ficha de actividad → Social**. Aunor solo consulta.
- Los filtros corresponden a las fechas del trabajo (o entrega de edición), no a la fecha en que se guardó el vínculo.
- Se mantienen las actividades entregadas en el panel de Aunor sin la antigua caducidad de 72 horas. Este cambio ya estaba implementado y no se revierte.

## Los tres ejemplos

1. Charla de seguridad vial.
2. Registro aéreo del puente Lacramarca.
3. Jornada de voluntariado.

Se usan las tres imágenes generadas de la propuesta aprobada, una imagen real de muestra por álbum: **no se simulan tres fotos distintas repitiendo una misma imagen**. Están en `frontend/public/social-ejemplos/`; los títulos y la configuración están en `frontend/lib/social-examples.ts`.

Los ejemplos se muestran en una sección propia, marcada como presentación. No son registros de actividad, no cuentan en el contrato, no modifican entregas ni se insertan en la base de datos. Permanecen visibles independientemente del filtro mensual de los álbumes reales.

No se recibieron direcciones de carpetas de la empresa. Por eso muestran **Carpeta pendiente**, deshabilitado. No hay enlaces ficticios ni redirecciones a la portada genérica de OneDrive. Al disponer de material real, el equipo vincula las carpetas desde sus actividades y se puede retirar `socialExamples` de la página sin borrar ningún trabajo.

## OneDrive y almacenamiento

La plataforma guarda únicamente el vínculo de cada carpeta y su historial de cambios. **Las fotos originales permanecen en OneDrive**; no se suben ni se duplican en Supabase. Las imágenes de muestra son recursos estáticos públicos, no fotografías privadas de la empresa.

No hay integración Microsoft Graph ni lectura automática de archivos privados: la plataforma no puede contar fotos ni generar portadas reales de una carpeta privada a partir de un enlace. Los álbumes reales usan una portada neutral hasta que se defina una integración o una portada autorizada. La empresa conserva los permisos de acceso desde Microsoft; guardar un vínculo no concede acceso automáticamente.

Se admiten vínculos HTTPS de `1drv.ms`, `onedrive.live.com` y un tenant `*.sharepoint.com`, sin credenciales ni puertos no estándar. La validación comprueba formato/dominio, **no la existencia de la carpeta**. Usar carpetas corporativas sin identidad del operario en su nombre o ruta, conforme a la privacidad de Aunor.

## Seguridad

- Migración nueva: `supabase/migrations/202610200001_social_onedrive.sql`.
- Tabla privada con RLS, sin escritura directa de clientes; consulta pública filtrada sin autor ni responsable.
- RPC con sesión activa, perfil habilitado, cambio de contraseña resuelto, actividad fuera de papelera y permiso Admin/responsable.
- Control optimista de versión, reintento idempotente del mismo vínculo y auditoría. No se modifica estado, jornadas, entrega ni contrato.
- Cambiar un vínculo conserva su versión anterior en el historial privado.
- El flujo existente de eliminación definitiva mantiene contraseña, vista previa y confirmación. Puede borrar metadatos de Social; **nunca borra carpetas ni fotos de OneDrive**.

La implementación anterior de bucket privado, subida de imágenes, ZIP y Edge Function se retiró del código porque todavía no se había desplegado ni aplicado en bases reales. Su versión anterior permanece en Git. No se ejecutó ninguna limpieza de Storage ni borrado de archivos reales.

## Verificación

- TypeScript y compilación de producción con `SISTEMA_R_DATA_SOURCE=demo`, salida aislada `.next-aunor-test`.
- ESLint sin errores ni advertencias; Vitest: **488 pruebas correctas en 66 archivos**, incluidas UI/servidor para filtros, enlaces, ejemplos separados, permisos y conflictos.
- 28 pruebas Deno de funciones existentes, con clientes simulados.
- PostgreSQL 17 en contenedor/base UUID desechables: cadena completa, permisos, autor oculto, bloqueo de sesiones revocadas, versiones, reintentos, auditoría y papelera. Se retiraron únicamente los recursos de esta prueba.
- Navegador aislado a 1600 y 390 px: tres ejemplos, imágenes, visor, Escape, pestaña Social, ausencia de descarga y de desbordamiento horizontal. Ver `verificacion-visual.json`.
- Ningún acceso de prueba a OneDrive ni a cuentas reales.

## Antes de publicar

1. Obtener un respaldo privado verificado de la base real; no subirlo a Git.
2. Comprobar el historial de migraciones del destino. Esta sustitución presupone que `202610190001_activity_social_photos.sql` **no fue aplicada**. Si sí existe, detenerse y preparar migración incremental conservando todos sus datos; no borrar tablas ni buckets.
3. Aplicar únicamente la nueva migración de Social, sin reset ni semillas. No hace falta habilitar Storage ni una función nueva.
4. Publicar el frontend después de la migración y verificar con el flujo autorizado. Los tres ejemplos estarán visibles para Aunor y estarán identificados como tales.
5. Introducir vínculos reales de las carpetas corporativas y comprobar su acceso con las cuentas Microsoft previstas. No cambiar permisos a públicos como parte de esta implementación.

Reproducción local desde `frontend`: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run test:functions`, `node scripts/verify-sql-ci.mjs`. Para el navegador, servir el build aislado demo en el puerto 3130 y ejecutar `node scripts/verify-social-photos-browser.mjs`.

## Capturas

- [Escritorio](social-1600.png)
- [Móvil](social-390.png)
- [Visor escritorio](muestra-1600.png)
- [Visor móvil](muestra-390.png)
