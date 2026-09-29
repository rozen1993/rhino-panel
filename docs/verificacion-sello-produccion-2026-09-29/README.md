# Sello de producción — diseño 01 implementado

29/09/2026. Marco eligió la alternativa 01 de [las cinco propuestas](../propuestas-tags-2026-09-29/README.md).

## Cambios

- Marcaje compartido con icono en una celda propia: gris azulado para Estándar y violeta para Especial. Texto siempre visible; iconos decorativos ocultos a lectores de pantalla.
- Aplicación uniforme en listas, fichas, histórico y vistas de Aunor mediante `ClassificationBadge`.
- Planificación Admin: tarjetas de selección única, descripción breve, indicador de selección y foco visible con teclado. Sin clasificar conserva una opción neutra.
- CSS encapsulado para no alterar los componentes de estado ni el diseño global. Conserva tipografías y colores de DA VINCI, siguiendo la guía de diseño frontend.

No se cambiaron permisos, estados, unidades del contrato, datos guardados ni esquema de base de datos. No se publicó en GitHub/Vercel. Localhost se reinició con la compilación actualizada en modo demo aislado.

## Verificación

- 358 pruebas unitarias en 44 archivos: aprobadas.
- 10 recorridos Playwright: aprobados (`history-contract`, `historical-panel`, `operator-planning`). Incluyen selección exclusiva mediante teclado, persistencia de Especial y visualización del marcaje en ficha e histórico.
- Compilación de producción aislada, `tsc --noEmit`, ESLint y `git diff --check`: aprobados.
- Revisión visual de escritorio y móvil. Pruebas del panel histórico entre 320 y 1920 px.
- Fixtures únicamente en contextos de navegador de pruebas, nunca en registros reales ni en el almacenamiento del navegador personal del usuario.

## Capturas de implementación

| Pantalla | Escritorio | Móvil |
| --- | --- | --- |
| Formulario | [PNG](edicion-1440.png) | [PNG](edicion-390.png) |
| Ficha de actividad | [PNG](regularizacion-1440.png) | [PNG](regularizacion-390.png) |
| Histórico | [PNG](historico-1440.png) | [PNG](historico-390.png) |

El borde cian de las tarjetas seleccionadas en las capturas del formulario es el foco de teclado comprobado por la prueba, no un segundo estado de clasificación.

Las capturas anteriores del 28/09 se conservaron. Para generar las nuevas se utilizó `SISTEMA_R_CAPTURE_DIR=../docs/verificacion-sello-produccion-2026-09-29`.
