# Marca visible: DA VINCI

Por petición de Marco, la plataforma se presenta como **DA VINCI**, con esa
capitalización y un espacio entre DA y VINCI. Sustituye a Rhino Audiovisuales en portada, acceso real/demo,
barra superior, metadatos, página 404 y etiquetas organizativas de Aunor.

Se conservan composición, tipografía, colores y tamaños del diseño aprobado.
Este cambio no renombra cuentas ni modifica contraseñas, roles, trabajos,
conversaciones, entregas o registros históricos.

Las vistas heredadas de Supabase aún devuelven `Admin · Rhino` como etiqueta
organizativa calculada. Solo esa etiqueta exacta se presenta como
`Admin · DA VINCI`; no se hace reemplazo global sobre contenido de usuarios.
No hay migración de base de datos.

Permanecen la URL `rhino-panel.vercel.app`, el repositorio, identificadores de
infraestructura, cookies y claves de almacenamiento/borradores. Renombrarlos
queda fuera del alcance y podría invalidar datos o accesos locales.
Las maquetas y documentos históricos no se reescriben retroactivamente.

Respaldo de código previo: `dde637c`.
Respaldo previo al ajuste de DaVinci a DA VINCI: `47a8a9c`.
Pruebas específicas: marca en acceso real, compatibilidad de etiquetas heredadas,
portada y acceso a 390/1366 px, encabezado del panel y página 404.
