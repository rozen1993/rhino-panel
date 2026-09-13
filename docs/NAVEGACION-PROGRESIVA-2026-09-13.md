# Navegación progresiva — Aunor

Respaldo de código previo: `21ae438` (no sustituye un respaldo de datos).

## Alcance

El espacio de trabajo Aunor tiene ahora un layout persistente: cabecera,
navegación lateral/inferior y cierre de sesión permanecen montados entre sus
pantallas. Las URL no cambian. La organización interna `(workspace)` deja fuera
las rutas retiradas, que conservan su comportamiento de no encontrado.

La pantalla activa y el botón Volver se actualizan desde la ruta. El marcado y
las clases del marco anterior se conservan en `ShellFrame`. Los otros roles
mantienen sus páginas y permisos; no se trasladaron sus rutas a un layout común.

En Aunor y la navegación principal, `IntentLink` activa la precarga normal de
Next.js al pasar el cursor, enfocar con teclado o tocar. No fuerza `prefetch=true`
ni carga todas las fichas visibles. La estructura puede adelantarse, pero los
datos privados de las páginas dinámicas se solicitan al navegar. No se configuró
una caché global, localStorage ni un periodo extendido de vigencia para ellos.

Mientras llegan los datos, el estado de carga reutiliza superficies, bordes,
cian, tipografía y tarjetas del diseño aprobado. No muestra actividades ficticias.
Respeta movimiento reducido. Antes de disponer incluso de esa estructura, el
enlace comunica que la navegación está en curso con una línea cian y un aviso
para lectores de pantalla.

## Seguridad y datos reales

- Cada página mantiene `requireRole` antes de leer sus datos.
- El nuevo layout también comprueba el rol. La lectura Supabase del perfil está
  deduplicada con React `cache` únicamente dentro de la petición, como antes.
- Proxy, RLS, validación de sesión, cambio obligatorio de clave y autorización
  de acciones no se eliminaron ni se sustituyeron por decisiones del navegador.
- Las confirmaciones mantienen su revalidación del layout Aunor.
- No hubo migraciones, compra de infraestructura ni cambios en datos de trabajo.

## Mediciones y verificación

Antes del cambio, en producción `85186c9`, tres navegaciones autenticadas de
Panel a Contrato tardaron 1891, 1394 y 862 ms hasta ver el encabezado completo
(mediana 1394 ms). La cabecera se reemplazó en las tres navegaciones.
Estas son muestras puntuales, no LCP ni un SLA.

La prueba de navegador nueva retrasa de manera controlada la respuesta de
Contrato después de preparar su estructura. Verifica que el estado de carga
se muestre y que el mismo nodo de cabecera persista durante y después del cambio;
también comprueba la selección del menú y la disponibilidad de Cerrar sesión.

Pruebas de unidad cubren intención por cursor/teclado/tacto, cancelación de
precarga, señal de navegación, menús por rol, Volver y carga accesible.
Las verificaciones funcionales usan el servidor demo aislado, no la base real.

Esta fase busca respuesta visual inmediata y menos trabajo de navegación.
No convierte en instantáneo el primer acceso autenticado ni elimina la latencia
de red. Antes de pagar por más cómputo, sigue siendo necesario medir saturación
y separar el tiempo de autenticación, transporte y consultas.
