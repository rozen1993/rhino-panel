# Vista rápida: fecha protagonista

Implementación de la propuesta 03 elegida por Marco. El componente mantiene la vista previa adherida al desplazamiento en escritorio y el diálogo con retorno de foco en móvil/tablet.

- Estándar: azul petróleo `#124b57`, sin etiqueta Estándar.
- Especial: morado `#674696` en fecha, marcador, Entregada y Abrir ficha completa.
- Fecha destacada: realización para grabación/locución/creatividad, entrega prevista para edición. Las jornadas adicionales y los rangos continúan visibles; no se cambian fechas ni estados.
- Responsable, origen, descripción, opinión existente y enlaces a ficha/material conservados.
- CSS aislado del resto de la plataforma; los controles y permisos no cambian.

También se publica el ajuste pendiente del histórico: botón Ver detalles morado para especiales y Entregada ligeramente más pequeño (26px en vez de 29px; texto 10,5px en vez de 11px). El tamaño del estado en las demás pantallas no cambia.

## Comprobaciones

Pruebas unitarias: fechas simples y múltiples, edición, ausencia de fecha/material, enlace seguro, navegación de retorno, clasificación y tamaño exclusivo del histórico.

Pruebas de navegador en build demo aislado: versiones estándar/especial a 1440px y 390px, reflujo a 320px con fuente al 200%, selección de filas, vista adherida al scroll, textos extensos, enlaces visibles y cierre/retorno de foco en móvil y tablet. Los ejemplos y capturas son sintéticos; no se usa ninguna base del usuario ni Supabase.

Las capturas `especial-1440.png`, `estandar-1440.png`, `especial-390.png` y `estandar-390.png` se generan con `activity-preview-design.spec.ts`.

Se actualizan las pruebas antiguas para navegar lista → Ver detalles → retorno; la prueba de panel usa el breakpoint de escritorio y la de carga usa la URL del servidor de pruebas, sin puerto fijo.

Resultados del 06/10: TypeScript y ESLint correctos, 468 pruebas unitarias aprobadas (64 archivos), build aislado correcto y 74/74 pruebas de navegador aprobadas. Capturas estándar/especial de escritorio/móvil revisadas visualmente. Auditoría de dependencias de producción: 0 alertas tras el parche; quedan 5 alertas en dependencias de desarrollo, fuera de esta actualización acotada.

## Parche de publicación

El control `npm audit --omit=dev --audit-level=high` detectó una alerta nueva en `sharp`. Se sube únicamente el override 0.35.4 → 0.35.5 y sus binarios asociados, siguiendo el [aviso del mantenedor](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). No se ejecuta un `audit fix` general ni se modifican las versiones de Next.js, React o Supabase.
