# Contrato de handoff del frontend

**Versión:** 2026-08-20 — modelo operativo de tres roles.

## Entidades

- **Cuenta:** un solo rol (`operario`, `admin` o `burson`), estado activo y marca opcional `bursonLinked` exclusiva de Operario. Debe existir exactamente un operario especial activo.
- **Actividad:** origen (`operario` o `burson`), responsable, tipo, título, descripción, lugar, uno o más rangos de fechas, estado, enlace, opinión, versión y auditoría.
- **Conversación privada:** mensajes visibles únicamente para Admin y el operario responsable, con autoría, edición y eliminación lógica auditadas.

## Permisos

- El Operario registra las actividades comunicadas por teléfono, consulta las propias y las avanza. El operario especial también ve todos los encargos Burson y responde por ellos.
- Burson crea encargos que se asignan automáticamente al operario especial. Puede editar o eliminar sus encargos mientras estén Programados y consulta estado, enlace y opinión del operario.
- Admin ve todas las actividades, cuentas e Histórico. No cambia estados ni entregas. Puede iniciar una conversación privada después de la entrega; ese primer mensaje bloquea cambios posteriores al enlace y la opinión.
- Burson nunca accede a la conversación Admin–Operario.
- La eliminación de actividades es lógica y conserva motivo, autor y auditoría.

## Estados y fechas

La transición única es `Programada → En proceso → Entregada` y solo la ejecuta el operario responsable. La entrega exige un enlace HTTPS de OneDrive o SharePoint. “Atrasada” es un indicador calculado respecto de las fechas, no un estado.

Una actividad admite un día, un rango continuo o varios rangos discontinuos. El estado, enlace y opinión son globales para toda la actividad.

## Histórico

Es exclusivo de Admin y muestra los doce meses del año sin filtros. Los tipos se distinguen por color; los rangos se dibujan de forma continua y cualquier fecha marcada abre el detalle. En móvil usa una columna y hoja inferior; en tablet dos columnas y panel lateral; en laptop una malla 4×3 con panel superpuesto; en PC una malla 4×3 con detalle permanente.

Los stores y cookies actuales son adaptadores temporales. Toda autorización deberá repetirse en el backend; ocultar controles en el cliente no constituye seguridad.
