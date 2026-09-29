# Metas contractuales — confirmación recibida el 29/09/2026

**Las doce cantidades y periodicidades ya están resueltas para la configuración operativa.** Este archivo conserva su nombre para no romper enlaces anteriores. El registro del 28/09, al final, queda como antecedente y no como lista vigente de pendientes.

Fuente: imagen aportada por Marco de la cláusula 2.2 (página 2 de 12), más sus aclaraciones expresas del 29/09/2026. No se obtuvo ni se requiere otro anexo para esta ronda. No se copió la imagen contractual al repositorio.

| Servicio | Meta | Periodicidad | Criterio |
| --- | ---: | --- | --- |
| Cobertura fotográfica y audiovisual | 10 | Mensual | Confirmación expresa de Marco |
| Videos para redes sociales | 4 | Mensual | Marco resuelve «cinco (4)» |
| Micronews internos | 1 | Mensual | Marco corrige la cantidad del documento |
| Videos de resumen anual | 2 | Anual | Resumen anual según documento |
| Videos de fiesta de fin de año | 2 | Mensual | Sin periodicidad explícita: mensual por instrucción de Marco |
| Videos de campañas internas | 12 | Mensual | Sin periodicidad explícita: mensual por instrucción de Marco |
| Videos sociales y ambientales | 2 | Anual | El documento dice «videos anuales» |
| Videos de seguridad vial | 24 | Mensual | Marco resuelve «Veinticuatro (21)» |
| Videos de voluntariado | 2 | Mensual | Sin periodicidad explícita: mensual por instrucción de Marco |
| Postproducción de resumen OSITRAN | 2 | Anual | Resumen anual según documento |
| Webinars | 3 | Mensual | Marco confirma 3 al mes |
| Spots / cuñas radiales | 4 | Mensual | Sin periodicidad explícita: mensual por instrucción de Marco |

## Periodos y límites del criterio

- Primer mes operativo: **abril de 2026**, por confirmación del inicio en abril y el contexto del histórico 2026.
- Meses calendario completos, desde el día 1 al último día. No se prorratea ni se traslada excedente.
- Ciclo operativo anual: **01/04/2026–31/03/2027**, como convención de seguimiento bajo la delegación de criterio de Marco. **No establece el vencimiento legal del contrato**, ni el día exacto de firma/inicio jurídico.
- No se presupone renovación ni se genera automáticamente un segundo ciclo anual.
- Una actividad entregada y correctamente vinculada/asignada equivale a una unidad. Especial no multiplica unidades.
- No se cambian fechas, publicaciones, estados o periodos de actividades reales de forma masiva.

## Aplicación local

Referencia: `frontend/lib/contract-reference.ts`. La demo prepara los meses desde abril hasta el mes actual y el ciclo anual señalado. No asigna actividades automáticamente.

En Admin, «Usar referencia confirmada» prepara campos para revisión y guardado explícito. Si el periodo ya existe, conserva sus valores, sin sobrescribir ni duplicar filas.

No se ejecutaron migraciones ni cargas en producción. La publicación y configuración real requieren respaldo privado verificado y el flujo autorizado.

---

## Registro anterior del 28/09/2026 — sustituido por las confirmaciones anteriores

Los nombres y referencias se verificaron por lectura del catálogo remoto el
28/09/2026. Todos remiten a Cláusula 2.2. No se ha modificado ese catálogo ni
consultado un nuevo contrato firmado: esta tabla no pretende sustituirlo.

| Punto existente | Meta Y | Periodicidad | Fuente / pendiente |
|---|---:|---|---|
| Cobertura fotográfica y audiovisual | 10 | Mensual | Indicación expresa de Marco; confirmar unidad: una actividad/cobertura completa, no cada modalidad o jornada |
| Videos para redes sociales | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Micronews internos | 1, por confirmar | Mensual, por confirmar | Marco dio ejemplos abril 1/1 y junio 1/1; confirmar que es obligación mensual |
| Videos de resumen anual | Pendiente | Anual, por confirmar | Sugerido por el nombre; confirmar meta y vigencia |
| Videos de fiesta de fin de año | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Videos de campañas internas | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Videos sociales y ambientales | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Videos de seguridad vial | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Videos de voluntariado | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Postproducción de resumen OSITRAN | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Webinars | Pendiente | Pendiente | Confirmar cantidad y periodo |
| Spots radiales | Pendiente | Pendiente | Confirmar cantidad y periodo |

También faltan **inicio y fin de la vigencia contractual**, y la regla de meses
parciales si el contrato no empieza o termina en los límites de un mes. No se
prorratearán ni trasladarán metas sin confirmación.

## Forma sencilla de responder

Puede adjuntarse la cláusula/anexo con las cantidades, o completar:

```text
Vigencia: desde __ hasta __
Coberturas: 10 por mes; una cobertura equivale a __
Redes: __ por mes / por vigencia
Micronews: __ por mes / por vigencia
Resumen anual: __ por vigencia
Fiesta de fin de año: __ por mes / por vigencia
Campañas: __ por mes / por vigencia
Sociales y ambientales: __ por mes / por vigencia
Seguridad vial: __ por mes / por vigencia
Voluntariado: __ por mes / por vigencia
OSITRAN: __ por mes / por vigencia
Webinars: __ por mes / por vigencia
Spots radiales: __ por mes / por vigencia
Meses parciales, si existen: __
```

Una meta no configurada se verá como «Meta por confirmar», nunca 0/0 ni un
porcentaje inventado. Una meta conocida sin entregas sí debe verse como 0/Y.
Las equivalencias especiales quedan fuera del conteo automático mientras no
exista un acuerdo concreto; no se solicita ahora que cada Especial valga doble.
