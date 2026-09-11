# Refinamiento visual del Histórico

Respaldo anterior a cualquier edición: `afc6d39` (árbol limpio; commit de checkpoint).

## Cambios

- En proceso: azul intenso `#2563EB`, texto blanco, contraste 5,17:1. Conserva
  etiqueta y símbolo. Token compartido por insignia, tarjetas, tabla y contador.
- Panel interno: fecha seleccionada en la cabecera, tarjetas con jerarquía
  título/estado/responsable y resumen de dos líneas. Lugar resumido, sin repetir
  las fechas ni mostrar UUID en cada tarjeta; homónimos conservan su referencia.
- Detalle: descripción íntegra, responsable y todas las jornadas; opinión e ID
  desplegables. Enlace al material sin modificaciones.
- Regreso: botón compacto «Volver», con nombre accesible completo. Recupera
  la lista del día, su posición de desplazamiento y el foco de la actividad.
- Panel lateral persistente al desplazar el calendario y cabecera interna fija.
  Se mantiene el diálogo móvil, Escape y el recorrido de teclado, ahora también
  por las secciones desplegables.

Se aplicó la guía frontend-design tomando como límite el contrato visual vigente:
no se sustituyeron fuentes, identidad, navegación ni malla anual 1/2/4. El ajuste
autorizado del color quedó registrado en el contrato visual. El panel propio de
Aunor no se rediseñó.

## Alcance y comprobación

Solo presentación y navegación; ninguna migración ni operación sobre datos reales.
Las pruebas usan stores de demostración en contextos de navegador nuevos.

234 pruebas unitarias y 28 de navegador aprobadas antes del retoque final de
espaciado. Se revisaron capturas de escritorio y móvil, textos extensos, tres
actividades coincidentes y la navegación por teclado. La suite visual nueva cubre
320 px con texto al 200 %, 390, 768, 1366 y 1920 px. Las capturas son de datos
ficticios y se generan en `frontend/.verificacion/playwright-existing-results/`.
Tras el retoque final se repitieron y aprobaron los 12 escenarios de Histórico
y panel, con compilación de producción incluida.

Esto no cambia el estado de las actividades ni la política de conservación.
