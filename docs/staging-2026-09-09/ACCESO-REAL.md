# Tarjetas de acceso reales — 9 de septiembre de 2026

Publicado en https://rhino-panel.vercel.app/acceso desde el árbol local.
Deployment: `dpl_3Z7qX5hF97DhTCXEU6fvxZLa3BuG`, estado READY.
No se realizó commit ni push.

Se conserva la composición de las tarjetas locales con las siete cuentas reales,
mes actual en Lima y usuario precargado en el formulario. Los conteos y fechas
operativos no se publican antes de autenticarse; las columnas lo indican.

Aplicada la migración `202609090001_access_directory.sql` tras dry-run. La RPC
anónima solo entrega username, display_name y role de cuentas activas. No concede
lectura directa sobre perfiles o actividades, ni expone identificadores Auth,
contraseñas o metadatos de autenticación. Los nombres de las cuentas son públicos
en esta pantalla. Si el directorio falla se conserva un acceso manual.

Verificación: TypeScript, lint de archivos modificados y tres pruebas unitarias
aprobados; preflight y build de Vercel aprobados. Navegador remoto a 1440 y 390 px:
siete cuentas, sin desbordamiento horizontal ni errores JS; formulario Aunor con
usuario precargado y cierre con Escape. No se ingresaron contraseñas en esta prueba.
Capturas locales: `frontend/.verificacion/current-access-real-1440.png` y
`frontend/.verificacion/current-access-real-390.png`.

`.vercelignore` limita los despliegues CLI al frontend y excluye variables locales,
compilaciones, dependencias, logs y capturas. Las capturas previas del usuario no
se modificaron.
