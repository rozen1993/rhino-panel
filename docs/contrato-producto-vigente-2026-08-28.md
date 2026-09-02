# Contrato de producto vigente — Sistema R

**Vigente desde:** 2026-08-28

**Decide:** Marco Vargas

**Sustituye para implementación:** cualquier regla anterior incompatible en
`docs/decisiones.md`, `docs/decisiones-operativas-2026-08-20.md`, encargos
históricos y handoffs anteriores.

Este documento convierte las decisiones confirmadas en un contrato comprobable.
Los documentos históricos explican la evolución del proyecto, pero esta fuente
manda sobre el comportamiento que debe implementarse.

## 1. Catálogo cerrado

- Roles: `operario`, `admin`, `burson`.
- Estados: `Programada`, `En proceso`, `Entregada`.
- Tipos: `Grabación`, `Edición`, `Creatividad`, `Locución`.
- `Atrasada` es un indicador calculado, nunca un cuarto estado.

## 2. Autoridad por actor

| Acción | Admin | Operario responsable | Operario autorizado | Burson |
|---|---:|---:|---:|---:|
| Crear actividad ordinaria | Sí, para cualquier Operario | No | Sí, solo para sí mismo | No |
| Editar planificación | Sí | No | No después de crear | No |
| Reasignar responsable | Sí | No | No | No |
| Editar enlace y opinión | No | Sí | Sí, si es responsable | No |
| Iniciar o entregar | No | Sí | Sí, si es responsable | No |
| Baja o restauración | Sí | No | No | No |
| Crear encargo Burson | No | No | No | Sí, propio |
| Consultar encargo Burson | Sí | Solo si es responsable especial | Solo si es responsable especial | Sí, propio |
| Conversación interna | Sí | Sí, si es responsable | Sí, si es responsable | Nunca |
| Histórico | Sí | No | No | No |
| Administrar cuentas/permisos | Sí | No | No | No |

## 3. Planificación y ejecución

La planificación comprende tipo, título, descripción, lugar, jornadas y
responsable. Admin conserva esos campos. El Operario autorizado puede definirlos
al crear una actividad propia, pero las correcciones posteriores pertenecen a
Admin.

La ejecución comprende estado, enlace HTTPS de entrega y opinión. Solo el
Operario responsable puede escribir esos campos y efectuar las dos transiciones
válidas. Entregar exige un enlace HTTPS sin credenciales incrustadas.

El primer mensaje de Admin congela únicamente el enlace y la opinión. No impide
que Admin corrija la planificación ni altera una transición ya válida.

La conversación solo es visible para Admin y el Operario responsable vigente.
Admin la abre después de la entrega; desde entonces el responsable puede
responder. Cada autor puede editar o dar de baja únicamente sus propios
mensajes. Una baja conserva un evento inmutable con el identificador del
mensaje, visible a los participantes, pero nunca copia el cuerpo a auditoría ni
entrega al cliente la fila dada de baja.

## 4. Permiso individual de creación

- Columna normativa: `profiles.can_create_own_activities`.
- Valor predeterminado: `false`.
- Solo puede ser `true` para un perfil `operario`.
- Admin puede concederlo y retirarlo; ambos eventos quedan auditados.
- La RPC comprueba el permiso desde el perfil autenticado y fuerza
  `responsible_id = auth.uid()`.
- El Operario sin permiso no recibe pestaña, botón, CTA ni ruta utilizable de
  creación. El autorizado recibe una acción contextual, no una pestaña
  permanente.
- `can_create_own_activities` e `is_burson_operator` son capacidades
  independientes.

## 5. Canal y autoría

`activities.origin` representa el canal: ordinario (`operario`) o Burson.
`activities.created_by_role` representa quién creó el registro. Por ello, una
actividad ordinaria planificada por Admin tiene `origin = 'operario'` y
`created_by_role = 'admin'`. Esta separación mantiene el aislamiento RLS de
Burson sin inventar un origen adicional.

## 6. Burson

- Existe una sola cuenta Burson activa.
- Burson crea y consulta exclusivamente sus propios encargos.
- El sistema asigna el encargo al único Operario especial activo.
- El Operario especial ejecuta; Burson no cambia estados ni entregas.
- Burson nunca recibe auditoría interna, papelera, cuentas, Histórico ni mensajes
  Admin–Operario.
- Transferir el vínculo especial reasigna atómicamente los encargos pendientes;
  los entregados conservan su responsable histórico.

## 7. Baja, restauración y auditoría

No se elimina físicamente una actividad. Admin registra motivo, actor y momento.
Restaurar limpia el estado de baja para devolver la actividad a operación, pero
el evento original permanece inmutable en auditoría con su motivo completo.

- Una actividad dada de baja desaparece de Actividades, Histórico y Burson; se
  consulta únicamente en una Papelera exclusiva de Admin.
- La baja y la restauración conservan planificación, ejecución, jornadas,
  estado, hilo, mensajes y auditoría. Un mensaje dado de baja no se restaura al
  restaurar la actividad.
- Si una actividad abierta perdió a su responsable activo mientras estaba en la
  Papelera, Admin elige un Operario activo al restaurarla. Una actividad ya
  entregada conserva a su responsable histórico aunque su cuenta esté inactiva;
  un encargo Burson entregado nunca cambia ese responsable durante la
  restauración.

## 8. Cuentas y clave temporal

- No hay signup público.
- Admin crea y administra cuentas mediante una Edge Function privilegiada.
- La función guarda `service_role` únicamente como secreto de Supabase y valida
  primero JWT, sesión activa y rol Admin.
- Una cuenta nueva recibe una clave temporal y
  `profiles.must_change_password = true`.
- Mientras el flag esté activo, RLS y las RPC de negocio fallan cerradas; el
  usuario solo puede leer su perfil y completar el cambio de clave.
- La misma función cambia la clave en Auth y, después del éxito, limpia el flag
  y audita. No se confía en un redirect ni en timestamps internos de GoTrue.
- Desactivar una cuenta revoca sus sesiones. No puede desactivarse el último
  Admin.

## 9. Histórico

El intervalo permitido comienza en `2026-01-01` y continúa hacia adelante. Admin
puede navegar por año. El calendario representa jornadas individuales, rangos y
jornadas discontinuas, admite varias actividades por fecha y abre un detalle
accesible. Las actividades dadas de baja viven en una papelera separada.

## 10. Chat IA separado

No se implementa dentro de Sistema R. El único entregable es
`docs/plan-chat-ia-reutilizable.pdf`, máximo tres páginas. La primera versión es
exclusiva de Admin, de solo lectura, con gateway propio; OpenRouter vive en
servidor y Hermes queda como agente personal separado.

`docs/plan-chat-ia-reutilizable.html` es solo la fuente de edición, no un
componente ni un segundo entregable de producto. El PDF se regenera de forma
reproducible desde `frontend/` con `npm run render:chat-plan`.

## 11. Condiciones de terminado

1. Migraciones reproducibles desde cero y tipos regenerados.
2. Matriz RLS probada directamente contra RPC con identidades distintas.
3. `npm run verify` y `npm run test:e2e` verdes.
4. Ningún fixture aparece en una pantalla configurada para Supabase.
5. Responsive de 390 a 1920 px, teclado, foco y contraste comprobados.
6. Sin secretos privilegiados bajo `frontend/` ni en artefactos versionados.
7. Staging y producción usan proyectos separados; despliegue y secretos se
   ejecutan únicamente con autorización expresa.
