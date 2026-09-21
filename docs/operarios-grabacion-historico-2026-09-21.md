# Operarios, modalidades de Grabación e Histórico

Decisiones confirmadas por Marco el 21/09/2026. Prevalecen sobre las reglas
anteriores incompatibles del contrato de producto. Respaldo previo: `dd770d4`.

## Comportamiento

- El operario con permiso de creación ve **Editar actividad** en sus actividades
  propias, únicamente mientras estén **Programadas** y asignadas a su cuenta.
  Puede corregir tipo, título, descripción, lugar y jornadas. No cambia responsable,
  estado ni entrega desde ese formulario. La actividad conserva su ID y sus datos.
- La opción desaparece al revocar el permiso, reasignar o iniciar la actividad.
  El servidor y la base vuelven a comprobar las condiciones al guardar; un
  formulario abierto previamente no conserva una autorización antigua.
- **Entregar material / Actualizar entrega** mantiene su flujo independiente.
- **Grabación** exige al menos una modalidad: **Fotografía**, **Video** o
  **Vuelo con dron**. Se permiten las siete combinaciones no vacías. Cambiar a
  otro tipo limpia la selección. Las modalidades se muestran en la ficha, en
  Histórico y a Aunor, sin revelar a este último el responsable.
- Las grabaciones antiguas conservan todos sus datos y quedan sin clasificar.
  No se les asigna una modalidad por suposición. Al editar su planificación hay
  que seleccionar al menos una; iniciar o entregar no exige reclasificarlas.
- Todos los operarios, con o sin permiso de creación, acceden a **Histórico**
  y consultan todas las actividades activas del equipo como en el Histórico de
  Admin. La Papelera no aparece allí. Los mensajes internos y los permisos de
  escritura continúan limitados a sus participantes y responsables.

## Implementación y pruebas

- Migración aditiva: `202609210001_operator_planning_recording_history.sql`.
- RPC v3 de creación y planificación con modalidades obligatorias; RPC propia
  verifica autor, rol original, responsable, permiso, estado y versión.
- Eventos de corrección conservan valores anteriores y nuevos. No se modifica
  la auditoría existente. Reiniciar conserva las modalidades en la nueva actividad.
- Proyección `team_historical_activities`, de solo lectura, permite la consulta
  del equipo sin ampliar RLS de actividades, conversaciones o auditoría.
- Prueba SQL: `node scripts/verify-operator-planning.mjs`, desde `frontend`.
  Crea una base con nombre UUID, aplica la cadena de migraciones, usa fixtures
  sintéticos y elimina exclusivamente esa base al terminar.
- Pruebas de navegador: `npx playwright test e2e/operator-planning.spec.ts e2e/roles.spec.ts`.
  Ejecutan la demo aislada en escritorio y móvil.

Verificación local completada el 21/09/2026: tipos y lint correctos, 314 pruebas
unitarias y 11 recorridos de navegador aprobados; build de producción correcto.
La prueba PostgreSQL/RLS aprobó además las carreras de revocación y reasignación,
los reintentos, el cambio de tipo, los límites de lectura y la conservación de
material e historial. Se retiraron únicamente las bases UUID creadas por el
verificador. Se revisaron capturas del formulario, ficha e Histórico en
escritorio y móvil. No se aplicó esta migración a producción.

## Publicación

La implementación local no implica que Vercel esté actualizado. Antes de aplicar
la migración remota se requiere un respaldo privado verificado conforme a
`AGENTS.md`. Después se publica el frontend compatible y se verifica acceso,
consulta y formularios sin crear ni borrar datos reales para probar.

La migración retira el acceso directo a las RPC antiguas de planificación para
que no omitan modalidades. Coordinar migración y despliegue: durante el cambio,
un cliente antiguo debe recargar antes de guardar planificación. Las funciones
de ejecución y entrega se mantienen. Un rollback debe conservar la columna y
sus datos; no se revierte mediante borrado del esquema.
