# Social · fotos optimizadas con descarga directa

Implementación local del 21/10/2026. Respaldo previo: `8cd5a85`. No se publicaron cambios, no se aplicaron migraciones a bases reales ni se subieron fotos del equipo.

## Uso

1. El operario responsable entra en **Entregar material / Actualizar entrega**. Conserva el formulario de enlace y opinión; debajo aparece **Fotos para Social**. También está disponible en la ficha para Admin y el responsable.
2. Selecciona una fotografía, revisa la vista previa, escribe una descripción breve y pulsa **Guardar foto en Social**. Puede añadir hasta tres fotos activas por actividad. Guardar fotos es independiente de guardar el material y no cambia el estado de la actividad.
3. Aunor entra en **Social**, abre el álbum y descarga la foto directamente. Un álbum de varias fotos se descarga en ZIP; el visor permite descargar una sola.
4. **Originales en OneDrive** es opcional. El enlace abre la carpeta corporativa; nunca se inventa ni se hacen públicos sus permisos.
5. **Retirar del álbum** oculta una foto de Aunor, pero la conserva para restaurarla. No libera espacio. La eliminación definitiva sigue el flujo autorizado de Admin, con contraseña, impacto y confirmación; nunca borra originales de OneDrive.

La guía de diseño se aplicó para conservar las tarjetas por actividad aprobadas, colores, tipografía y navegación existentes. Los tres ejemplos se mantienen separados, identificados como imágenes generadas de presentación. Son descargables como muestras; no cuentan como trabajo ni contrato y no se insertan en la base.

## Validación y calidad

| Concepto | Regla |
| --- | --- |
| Entrada | JPG, PNG o WebP, sin animación; máximo 4 MiB y 40 megapíxeles |
| Resolución mínima | Lado largo de 1280 px y corto de 720 px; horizontal o vertical |
| Copia para redes | JPEG, lado máximo 2048 px, hasta 600 KiB; sin recorte ni ampliación |
| Miniatura | WebP, hasta 480 × 360 px dentro del encuadre y 48 KiB |
| Metadatos | Orientación corregida; EXIF/GPS e identidad incrustada no se conservan |
| Cantidad | Hasta tres fotos activas por actividad |

Se intenta JPEG de calidad 88 y luego 82; si hace falta, se reduce moderadamente la resolución. Si no se alcanza el límite manteniendo la calidad y resolución mínimas, se rechaza la foto con explicación. Es compresión con pérdida: no promete calidad idéntica al original. El original permanece en OneDrive y no se almacena temporalmente como objeto en Supabase.

El navegador anticipa errores; el servidor vuelve a decodificar y validar con Sharp antes de guardar. La función Edge verifica tamaño, estructura, dimensiones y ausencia de metadatos privados, además de los permisos por RPC. Su validación estructural no sustituye la decodificación completa realizada por el servidor de la aplicación.

El límite de entrada deja margen para multipart bajo el [límite de petición de Vercel Functions](https://vercel.com/docs/functions/limitations). No se contrata procesamiento de imágenes adicional.

## Almacenamiento y privacidad

- Fotos y miniaturas: bucket **privado** `activity-social-photos` de Supabase Storage.
- PostgreSQL: pequeñas fichas (identificador, dimensiones, bytes, descripción, estado) e historial; **sí consume algo de base de datos**, pero no contiene los archivos de imagen.
- Presupuesto preventivo: 900 MB decimales del proyecto, aviso desde 720 MB. Incluye otros buckets, fotos retiradas y cargas reservadas. No amplía la cuota del proveedor ni verifica el saldo disponible de la organización.
- Una reserva serializada evita superar este presupuesto entre cargas de Social simultáneas. Cargas de otros sistemas ajenos a este flujo también pueden consumir espacio.
- Lectura autenticada, respuestas privadas sin caché pública y comprobación de sesión/permisos en cada descarga. Aunor no recibe la identidad del operario que subió las fotos.
- Escrituras por RPC, auditoría, control de versiones y reintentos sin duplicar la misma foto activa. Las fotos pendientes pueden reintentarse con el mismo archivo.
- No se ejecutan borrados automáticos al llenar la cuota. La limpieza física de una eliminación definitiva autorizada usa Storage API y cola de reintentos; no borra directamente `storage.objects` por SQL.

## Evidencias locales

- Cadena completa de migraciones en PostgreSQL 17, base UUID desechable: roles, sesiones revocadas, máximo tres, reservas/cuota, versiones, retirada/restauración, papelera y cola de eliminación. Se retiraron únicamente los recursos creados por esa prueba.
- 499 pruebas Vitest correctas en 68 archivos: interfaz, API y procesamiento real con Sharp. Otras 32 pruebas Deno correctas para funciones Edge con clientes simulados.
- TypeScript, ESLint y compilación de producción aislada con fuente de datos `demo`.
- Navegador a 1600 y 390 px: descarga de muestra, visor/Escape, ausencia de identidad del responsable, sin desbordamiento, formulario de operario sin formularios anidados; rechazo de archivo grande, dañado y de baja resolución.
- [Social escritorio](social-1600.png), [Social móvil](social-390.png), [entrega móvil](entrega-390.png), [resultado del navegador](verificacion-visual.json).

Estas pruebas no equivalen a una subida HTTP al Storage real: SQL utiliza metadatos de Storage de prueba, Edge usa clientes simulados y navegador usa demo. La comprobación integrada con el servicio desplegado queda pendiente de la publicación autorizada.

## Antes de publicar

1. Obtener un respaldo privado verificado de la base real, fuera de Git. Un dump SQL no respalda los objetos de Storage. No asumir permiso para copiar material a un destino externo.
2. Comprobar historial de migraciones y cuota disponible del destino. Si aparece la antigua `202610190001_activity_social_photos.sql`, detenerse y adaptar una migración incremental: no recrear tablas ni borrar buckets existentes.
3. Conservar/aplicar, según el historial, `202610200001_social_onedrive.sql`, y aplicar la nueva `202610210001_social_optimized_photos.sql`. Es aditiva; no resetea datos ni inserta ejemplos.
4. Revisar que ninguna política antigua de Storage conceda acceso amplio al nuevo bucket. Publicar `social-photo-upload` con verificación JWT y actualizar `admin-erasure` con su consumidor de limpieza. No exponer claves de servicio en el navegador.
5. Publicar el frontend después del backend. Verificar el flujo autorizado con una foto destinada a Social, nunca como prueba destructiva de registros reales. Confirmar permisos, descarga y OneDrive opcional.

No se ha hecho push a GitHub ni despliegue a Vercel en esta implementación.
