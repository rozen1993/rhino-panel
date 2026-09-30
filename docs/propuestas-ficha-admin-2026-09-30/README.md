# Ficha Admin — tres propuestas visuales

Propuestas para la sección de contrato y reemplazos de la ficha de actividad.
No se ha modificado código de aplicación, base de datos, permisos o despliegues.
Los nombres, fechas, registros y conteos 6/10 → 7/10 son ilustrativos: no describen el contrato real ni lo alteran.

## Alternativas

1. **Ficha compacta — recomendada.** Servicio y periodo juntos, una acción para guardar la relación, resumen público opcional. Reemplazo e historial aparecen como filas compactas. El respaldo de una llamada se completa solo al registrar un reemplazo.
2. **Organización por pestañas.** Contrato, Reemplazo e Historial tienen vistas separadas. Reduce lo visible, a cambio de navegación adicional. Las pestañas de la maqueta admiten flechas, Home y End.
3. **Panel lateral contextual.** Resumen de la ficha a la izquierda y tarea activa a la derecha. Conserva contexto y separa consulta de edición. En móvil se apilan; no pretende mostrar dos columnas estrechas.

La guía frontend-design orientó la jerarquía y la revelación progresiva, manteniendo azul técnico, cian, lima para guardar, superficies claras, tipografías del sistema y radios de 6–10 px. Se reutilizó el patrón del render local de las propuestas de estado, sin conectarlo con la aplicación.

## Criterios comunes

- Entregada conserva la opción 01 aprobada, verde sólido con check blanco.
- Servicio y periodo se confirmarían en una sola operación explícita; elegir campos no guarda nada.
- La vista previa distingue lo que se contaría al guardar de lo ya guardado.
- No se propone cambiar el estado de ejecución al guardar la relación contractual.
- La ficha actual se fija como sustituta, eligiendo la original sin volver a seleccionar la misma actividad.
- Solicitud, fecha, canal y motivo se conservan dentro del flujo de reemplazo. La evidencia enlazada es opcional; no se finge confirmación del cliente.
- Los acuerdos, versiones y correcciones anteriores no se eliminan. Permanecerían en Historial y opciones adicionales.
- Las cuotas mensuales/anuales seguirían configurándose por Admin fuera del recorrido habitual de cada ficha. No se propone sobrescribir cuotas existentes.

## Alcance de una futura implementación

La acción unificada de servicio y periodo requiere coordinación del guardado en servidor, control de versiones y ausencia de guardados parciales. No basta con juntar visualmente los botones actuales.
El formulario compacto de reemplazo debe conservar el acuerdo y su relación: hará falta coordinar ambos registros, reutilizando uno existente cuando corresponda. No se eliminará la validación de respaldo para aparentar menos campos.
Antes de implementar se elegiría una dirección. Estas maquetas no son una migración, no ejecutan acciones de la plataforma y no tienen solicitudes de red.

## Visuales y visor

- `01-escritorio.png`, `02-escritorio.png`, `03-escritorio.png`: vistas principales.
- `01-movil.png`, `02-movil.png`, `03-movil.png`: variantes a 390 px.
- `01-reemplazo.png`, `02-reemplazo.png`, `03-reemplazo.png`: formulario abierto.
- `index.html`: visor local; enlaces al pie para cambiar propuesta.

Reproducir: `node docs/propuestas-ficha-admin-2026-09-30/render.mjs` desde la raíz.
El script renderiza PNG, bloquea accesos remotos, comprueba ausencia de desbordamiento horizontal y verifica las interacciones locales de la maqueta.
