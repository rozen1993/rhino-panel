# Autenticación y permisos integrados — 10 de septiembre de 2026

Resultado: **20 escenarios aprobados**, con GoTrue y PostgREST reales, JWT ES256, las funciones del proyecto y navegador Chromium contra una compilación de producción de Next.js. No se detectaron fallos nuevos del producto en estos recorridos; los cambios de esta ejecución incorporan el verificador reproducible.

Regresión posterior aprobada: 229 pruebas unitarias, 28 pruebas de funciones, typecheck y lint. Al finalizar se comprobó que no quedaban bases `sr_auth_test_…` y que seguían activos solamente los cuatro contenedores originales del proyecto.

## Alcance comprobado

1. Base vacía con todas las migraciones, sin usuarios ni sesiones del equipo.
2. Rechazo de solicitudes sin autenticación por el wrapper real de las funciones.
3. Alta de Operario, clave temporal, política, cambio, limpieza de metadatos e inicio nuevo.
4. Mismo circuito para un segundo Operario independiente.
5. Mismo circuito para Aunor.
6. Mismo circuito para un Administrador adicional.
7. Rechazo del autorrestablecimiento administrativo.
8. Operarios y Aunor no pueden administrar cuentas.
9. Reset invalida sesiones registradas y sesiones Auth aún no registradas; renovar el token no elude la frontera. La clave anterior deja de funcionar y la nueva permite completar el cambio obligatorio.
10. RLS por HTTP: Admin ve las actividades; cada Operario ve únicamente las asignadas; Aunor solo ve la proyección publicada, sin opinión interna.
11. El chat externo permanece retirado; Admin publica entrega y únicamente Aunor puede confirmarla, con reintento idempotente.
12. Rechazo de elevar rol mediante UPDATE directo y de ejecutar RPC de credenciales reservada a servicio.
13. Recuperación de usuario Auth sin perfil, protección contra duplicados y limpieza del usuario Auth creado para un segundo Aunor rechazado.
14. Dos resets simultáneos reales: uno termina y el otro recibe conflicto de operación en curso.
15. Ningún bloqueo de credenciales queda pendiente tras las operaciones satisfactorias.
16. Navegador Admin: acceso real, destino correcto y acceso a Gestión de cuentas.
17. Navegador Operario: acceso real y rechazo de Gestión de cuentas.
18. Navegador Aunor: acceso real y rechazo de Gestión de cuentas.
19. Navegador Aunor: barrera de clave temporal, cambio mediante Server Action, salida, nuevo ingreso y cierre de sesión que impide volver al módulo protegido.
20. Descenso de Admin a Operario, desactivación/reactivación y rechazo de sesiones anteriores; una sesión nueva recupera solamente los permisos vigentes.

## Repetir las pruebas

Desde `frontend`:

```powershell
npm.cmd run test:auth:integration
```

Requisitos: dependencias npm instaladas, Chromium de Playwright y Docker activo con `supabase_db_sistema-r`, `supabase_auth_sistema-r` y `supabase_rest_sistema-r`. El comando resuelve Deno 2.9.6 mediante npm. Puede descargar ese ejecutable si no está en caché. Para instalar Chromium: `npx.cmd playwright install chromium`.

El verificador usa las imágenes de los servicios locales existentes. Copia solamente la estructura Auth y su registro de migraciones, nunca usuarios, contraseñas ni sesiones. Aplica las migraciones del repositorio bajo el rol postgres y genera claves de firma, credenciales y datos nuevos en memoria. No requiere credenciales del proyecto remoto ni del equipo.

Los dos contenedores temporales exponen puertos aleatorios únicamente en 127.0.0.1 y apuntan a una base UUID nueva. El servidor Deno importa los wrappers de producción, incluida su verificación JWT; una pasarela local conecta Auth, REST y funciones. La compilación usa `.next-audit-test`, sin reemplazar `.next` ni detener localhost:3000. No ejecutar dos verificaciones de navegador simultáneamente porque comparten esa carpeta de compilación.

Al finalizar, incluso tras una aserción fallida, se retiran únicamente los recursos UUID creados por esa ejecución. Se conservan los contenedores originales y el código/build local. Una terminación forzada del proceso o de Docker puede impedir el finally: en ese caso identificar los nombres exactos `sr_auth_<uuid>`, `sr_rest_<uuid>` y `sr_auth_test_<uuid>` antes de cualquier limpieza manual; nunca usar una limpieza global de Docker o reset de Supabase.

## Límites y pendientes

- Esto verifica servicios reales **locales**, no la infraestructura alojada de Supabase ni las variables, pasarela o runtime Edge del proveedor. El código importado sí es el del proyecto.
- No se cambió ni desplegó código del producto en esta ejecución; no hubo escrituras al piloto remoto.
- La recuperación de un usuario Auth sin perfil no equivale a recuperación del único administrador. Sigue pendiente el simulacro de ese procedimiento y de fallos ambiguos del proveedor.
- Continúan pendientes aceptación del equipo en dispositivos reales, contenido aprobado de Aunor, producción separada, CI remoto, alertas y respaldos periódicos.
- Las pruebas no simulan todas las interrupciones de red, respuestas tardías ni combinaciones de concurrencia. La prueba unitaria existente conserva el bloqueo cuando el resultado de una escritura Auth es ambiguo; no se ha inyectado ese fallo en el proveedor alojado.
