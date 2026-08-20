# Decisiones operativas de la plataforma

**Fecha:** 2026-08-20  
**Decide:** Marco  
**Estado:** cerrado y ejecutado como extensión aditiva de `docs/decisiones.md`.

## Creación y propiedad

- Solo Coordinación crea actividades y asigna una cuenta responsable. Sustituye D-002.
- Coordinación deja de ser un tipo operativo. Los tipos son Grabación, Edición, Creatividad y Locución.
- La actividad pertenece a la cuenta responsable, no a todas las cuentas que compartan su rol.
- Una cuenta multirrol elige un rol activo. Cada acción registra cuenta y rol activo.
- Coordinación edita datos administrativos y comenta, pero no altera el reporte del operario ni evalúa.

## Entrega y evaluación

- Grabación y Locución requieren enlace de OneDrive.
- Edición y Creatividad requieren enlace y avance 100%.
- Supervisión vuelve a validar esos requisitos al aprobar.
- El operario puede cambiar enlace, avance y mensaje privado hasta que Supervisión tome una decisión.
- Una decisión sobre una versión obsoleta se rechaza y exige revisar la versión nueva.

## Estados y correcciones

- El catálogo incorpora `Rechazada` como octavo estado.
- `Observada` pide una corrección menor; `Rechazada` invalida el material.
- Supervisión indica un motivo y decide si un rechazo permite reenvío.
- Observación y rechazo con reenvío habilitan la corrección; el operario pulsa «Reenviar» y vuelve a
  `Entregada`.
- Un rechazo definitivo permanece bloqueado hasta que Coordinación lo cancele.
- Los ciclos de corrección son ilimitados y auditados.

## Auditoría, cancelación e idempotencia

- Se conservan versiones de enlace, avance y mensaje con cuenta, rol y fecha.
- El mensaje privado es opcional y visible solo para Coordinación y Supervisión.
- Cada autor solo puede editar o eliminar sus comentarios internos.
- Solo Coordinación cancela, con motivo, salvo una actividad ya aprobada.
- Solo Coordinación elimina lógicamente una orden no iniciada; conserva autor, fecha y motivo.
- Una llave idempotente persistida con el borrador impide duplicados después de recargar.

## AUNOR e Histórico

- Existirá una sola cuenta AUNOR.
- Histórico mantiene el acceso especial al Excel de OneDrive.
- El enlace histórico acepta únicamente HTTPS de OneDrive/SharePoint y persiste en la simulación.
