# Contexto vigente de Sistema R

Esta es la fuente breve y vigente para trabajar en el repositorio. El modelo anterior con Coordinación, Supervisión, AUNOR, aprobaciones u observaciones quedó retirado. Las decisiones detalladas están en `docs/decisiones-modelo-tres-roles-2026-08-20.md` y el contrato de implementación en `docs/handoff-frontend.md`.

## Objetivo

Construir la plataforma de gestión de actividades de Rhino Audiovisuales. Marco Vargas es el único decisor del proyecto.

## Modelo operativo

- Existen exactamente tres roles: **Operario**, **Admin** y **Burson**.
- Existen exactamente tres estados: **Programada**, **En proceso** y **Entregada**.
- Las actividades ordinarias se comunican fuera de la plataforma. El operario responsable las registra y gestiona.
- El operario puede indicar jornadas individuales, rangos continuos o varios rangos discontinuos; al entregar debe incluir un enlace HTTPS válido de OneDrive/SharePoint y puede dejar una opinión.
- Admin ve todas las actividades, enlaces e histórico; administra cuentas e inicia conversaciones privadas con el operario responsable. No crea ni ejecuta actividades.
- Burson crea encargos que quedan Programados y se asignan automáticamente al único operario especial activo. Burson solo ve sus propios encargos y no accede a conversaciones internas de Admin.
- Al transferir el vínculo especial, los encargos Burson pendientes pasan al nuevo operario; los entregados conservan su responsable histórico.
- El primer mensaje de Admin en una entrega bloquea posteriores cambios al enlace y a la opinión, pero no impide corregir los demás datos de la ficha.
- La eliminación es lógica y conserva motivo, autor y auditoría.

## Histórico y diseño

- El Histórico es un calendario anual interactivo de doce meses, no una hoja Excel.
- Debe representar fechas individuales, rangos y jornadas discontinuas; una fecha puede contener más de una actividad.
- La dirección visual aprobada está en `diseno/direccion-final-traducida/` y el contrato vigente en `diseno/direccion-final-traducida/CONTRATO-VISUAL.md`.
- La interfaz debe funcionar en móvil, tablet, laptop y PC, con navegación por teclado, foco visible y contraste legible.

## Límites actuales

La aplicación sigue siendo una simulación local con `localStorage` y cookies de prueba. No debe presentarse como autenticación o persistencia apta para producción. La base de datos, autorización de servidor, almacenamiento definitivo y el posible asistente IA son fases posteriores; el asistente IA está expresamente aplazado hasta completar y estabilizar la plataforma.

## Verificación

Trabajar desde `frontend/` y ejecutar `npm run verify`. Los recorridos de navegador se ejecutan con `npm run test:e2e`.
