# Revisión de las propuestas Aunor

Resultado: entrega visual lista para aprobación de Marco. No es una aprobación funcional ni contractual.

## Participación real de Claude

Claudex se ejecutó con el lanzador existente, perfil o/max, pipeline core. Claude respondió y vio una captura real antes de comenzar. Codex y Claude formularon propuestas independientes sobre composición; una tercera sesión limpia comparó sus conclusiones.

La comparación mantuvo las decisiones del usuario: una cuenta compartida Aunor, sin identificación personal simulada; Admin responde y registra; confirmaciones separadas de mensajes y de pagos. Se adoptaron tres destinos: Mi panel, Lo acordado y Mensajes, con calendario dentro de Mi panel.

Claude revisó visualmente los 16 PNG iniciales y, tras las correcciones, los 16 PNG de borrador-03 más cinco ampliaciones del calendario/estado en móvil. Su revisión final no reportó hallazgos bloqueantes. La evidencia por archivo se conserva en auxiliar/revision-claude-03.json. Las copias de png/ corresponden exactamente a los archivos revisados; VERIFICACION.json registra sus hashes.

## Qué se corrigió

- Contraste de Entregada sobre cabecera oscura.
- Colores y símbolos de estado contrastados con el componente vigente: Programada ○ cian, En proceso ◐ naranja, Entregada ● verde. No se cambia la aplicación.
- Servicios previstos con iconos neutrales, no casillas que sugieran cumplimiento.
- Navegación Aunor sin enlaces redundantes a otras vistas del histórico.
- Calendario ficticio coherente con las actividades: dos coincidencias en junio y una jornada de septiembre.
- Botones de mensajes sin estiramiento; cronología del ejemplo Admin coherente; etiquetas móviles Admin conservadas.

## Comprobación de Codex

Se inspeccionaron las ocho escenas en escritorio y móvil mediante imágenes, con apoyo de otro agente Codex para Lo acordado/reemplazo/Admin. Se reexaminaron las correcciones. El CSS base copiado tiene el mismo SHA256 que la referencia. Los renders pasaron comprobaciones de desborde horizontal a 1366 y 390 px, doce meses, doce servicios, ausencia de contenido interno en vistas cliente y avisos de ejemplos ficticios.

La revisión frontend-design ayudó a conservar tokens, jerarquías, superficies y proporciones del diseño aprobado. No se inventó una dirección estética nueva ni se editaron las capturas previas.

## Observaciones menores conservadas para tu aprobación

- En la bandeja de mensajes, Por relacionar acompaña al título; puede convertirse en etiqueta separada como en las tarjetas.
- La barra de color indica categoría, no estado. La etiqueta de estado mantiene su propio texto/símbolo/color.
- El calendario móvil conserva marcadores anchos y contador superpuesto al borde del día, como el patrón anual existente. Se revisó mediante ampliaciones; otros anchos requieren pruebas reales.
- Admin conserva Panel/Bajas en móvil frente a Mi panel/Papelera en escritorio; no se cambió esa nomenclatura fuera del alcance.

## Límites y pendientes que no se cierran aquí

- PNG estáticos, no prototipo funcional ni prueba de permisos. No se conectó Auth, base de datos, WhatsApp ni otros servicios; no se tocaron cookies de usuario.
- Ninguna escritura de código de aplicación, migración, goal o protocolo; ningún commit ni despliegue.
- Las referencias de servicios proceden del contrato, pero los ejemplos de actividades/fechas/acuerdos son ficticios. No hay cuotas, vigencia, equivalencias ni aprobaciones económicas inferidas.
- Estados vacíos, errores, validaciones, controles funcionales de confirmación, permisos cliente y flujo completo de reemplazo se especificarán/probarán al autorizar la implementación. No se diseñaron reaperturas ni cambios al bloqueo de entregas.
- Se conservan los pendientes técnicos anteriores: validaciones autenticadas del preview, aceptación del equipo/dispositivos, migración de lugares por jornada y gates previos de despliegue. No se aplicó la migración de jornadas a una base de usuario como parte de estas maquetas.

Próximo paso: revisar la galería y aprobar o pedir ajustes. La implementación requiere una nueva autorización.
