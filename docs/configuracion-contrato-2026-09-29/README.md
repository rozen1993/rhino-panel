# Configuración contractual recibida el 29/09/2026

Se incorporaron las doce metas y las correcciones expresas de Marco: redes 4/mes, micronoticieros 1/mes, webinars 3/mes y seguridad vial 24/mes. Coberturas: 10/mes. Los demás servicios sin periodicidad explícita son mensuales por instrucción del propietario.

[Tabla completa y criterios](../propuestas-historico-contrato-2026-09-28/METAS-POR-CONFIRMAR.md).

## Alcance local

- La demo presenta metas mensuales desde abril de 2026 hasta el mes actual.
- Resumen anual, sociales/ambientales y OSITRAN: 2 por ciclo operativo abril de 2026–marzo de 2027. No declara el vencimiento del contrato.
- Aunor ve el X/Y del periodo, la referencia y la periodicidad. El numerador exige trabajos entregados y asignados; no se rellena con cifras inventadas.
- Admin prepara cuotas y fechas con «Usar referencia confirmada». El guardado sigue pasando por la acción existente, con permisos y trazabilidad; preparar no realiza escrituras.
- Al detectar un periodo existente, se muestran sus valores sin sobrescribirlos. Las asignaciones de actividades siguen siendo explícitas.
- Sin esquema nuevo en esta ronda ni conexión a registros reales. Las migraciones pendientes de la implementación anterior siguen siendo necesarias antes de publicar el conjunto.

## Capturas

- [Contrato en escritorio](contrato-escritorio.png)
- [Contrato en móvil](contrato-movil.png)

Solo datos de demostración. Los trabajos de ejemplo sin periodo permanecen sin asignar.

## Verificación

- 361 pruebas unitarias en 45 archivos: aprobadas.
- 13 recorridos de navegador de `aunor`, `history-contract` y `contract-reference`: aprobados. Comprueban las doce cuotas, consulta mensual/anual, permisos de Aunor, ausencia de asignaciones automáticas y preparación de referencias sin duplicados.
- Compilación demo aislada, TypeScript, ESLint y revisión visual de escritorio/móvil aprobados.
- No se accedió a la base de datos real ni se publicaron cambios. La configuración real queda para el paso de publicación y guardado autorizado.
