# CONTEXTO Y OBJETIVO

> ## ⚠ Partes de este archivo son línea base EN REVISIÓN desde el 2026-08-17
>
> El cliente entregó una versión 2 completa del requerimiento que **contradice varias definiciones de
> este archivo**. Como `CLAUDE.md` está por encima de `docs/` en la jerarquía, sus contratos no pueden
> quedar neutralizados en silencio desde abajo: quedan marcados aquí.
>
> **Esta anotación no resuelve nada.** Todo lo que dice este archivo sigue siendo lo acordado y nada se
> ha sustituido. Lo que cambia es que **no se construye encima de las secciones marcadas** hasta que
> Marco cierre las decisiones correspondientes.
>
> **Marco resolvió cuatro el 2026-08-17** y esas secciones vuelven a ser firmes:
>
> - **Estados** — se mantienen los siete y el ciclo de observación: la plataforma es un sistema de
>   supervisión (D-019).
> - **Celular y mala señal** — sigue como está: el material va por enlace y **no se suben archivos**
>   (D-023), así que solo se envía texto.
> - **AUNOR** — cambia en un punto: **puede dejar su opinión**, pero su feedback no cambia estados ni
>   manda sobre los operarios (D-033). Todo lo demás de esa sección sigue igual.
>
> | Sección todavía en duda | Qué está en duda | Decisiones |
> |---|---|---|
> | Perfiles funcionales | El catálogo de roles: aparece «Locuciones», y Operación y Coordinación pueden quedarse sin titular | D-020, D-021, D-022 |
> | Actividades — campos comunes | Se añade «tipo de servicio»; falta fijar para quién aplica el avance | D-027, D-028 |
> | Ubicación | Los mockups usan un solo campo «Lugar» | D-029 |
> | Burson | La v2 lo nombra como parte de un «canal de comunicación» | D-035 |
> | Seguridad esencial | El acceso propuesto publica el equipo antes de autenticar | D-026, D-039 |
>
> Contexto: `docs/impacto-requerimiento-v2.md` · Decisiones: `docs/decisiones-pendientes.md` ·
> Incidente: `docs/incidentes.md` → INC-001 · Fuente: `actualizacion_del_requerimiento/`

## Proyecto
Construir una plataforma web para Rhino Audiovisuales que centralice el registro, seguimiento, supervisión y consulta de las actividades realizadas para Autopista del Norte (AUNOR).

**Marco Vargas es el único decisor del proyecto.** Define alcance, diseño, arquitectura, datos, seguridad, pruebas, cambios de fase y entrega. César, AUNOR, Burson y los operarios son fuentes de requerimientos o futuros usuarios, pero no deben bloquear el desarrollo ni aprobar etapas.

Durante desarrollo y QA, Marco prueba los distintos perfiles mediante cuentas de prueba o credenciales temporales.

## Perfiles funcionales
- **Johann:** grabaciones y coberturas.
- **Eduardo:** edición y postproducción.
- **Chiara:** coordinación y seguimiento.
- **Martín:** operaciones.
- **Creatividad:** producción y desarrollo creativo.
- **Supervisor / Administrador:** vista global, observaciones, aprobaciones, cuentas e importación.
- **AUNOR:** consulta mensual de solo lectura.
- **Burson:** seguimiento de requerimientos y coordinaciones de redes sociales. No asumir que necesita cuenta propia salvo decisión expresa de Marco.

## Actividades
Tipos:
- Grabación
- Edición
- Coordinación
- Operación
- Creatividad

Campos comunes mínimos:
- fecha
- título
- responsable
- descripción
- estado
- avance de 0 a 100
- fecha prevista de entrega
- fecha real de entrega
- enlace al material
- notas
- ubicación cuando corresponda

### Ubicación
Es un dato importante, especialmente para grabaciones y operaciones.

Considerar:
- `ubicacion_nombre`
- `ubicacion_referencia`
- `kilometro`
- `sentido`
- `latitud`
- `longitud`

`ubicacion_nombre` es obligatoria para grabación y operación. No construir mapas en esta versión salvo decisión posterior.

## Estados
- Programada
- En proceso
- Por subir
- Entregada
- Observada
- Aprobada
- Cancelada

Reglas:
- El colaborador puede avanzar como máximo hasta `Entregada`.
- Solo Supervisor/Administrador puede observar o aprobar.
- Solo se puede observar desde `En proceso`, `Por subir` o `Entregada`.
- Al observar se guarda `estado_pre_observacion`.
- Al resolver, la actividad vuelve exactamente a ese estado.
- Solo `Entregada` y sin observaciones abiertas puede pasar a `Aprobada`.
- Una actividad aprobada no puede cancelarse.
- Dar de baja no elimina físicamente el registro.
- Cada cambio de estado registra autor y fecha.

## AUNOR
Debe tener una vista propia, separada de la interfaz interna, **de solo lectura sobre las actividades y
con escritura limitada a su propio feedback** (D-033, 2026-08-17). AUNOR no puede cambiar ninguna
actividad ni su estado; solo puede dejar su opinión, y esa opinión no manda sobre los operarios de
Rhino. La mecánica exacta está en D-041.

Por mes debe mostrar como mínimo:
- última actualización
- totales por estado
- actividades con fecha, tipo, título, ubicación y estado

Agrupación visible:
- Programada -> Programada
- En proceso / Por subir / Observada -> En trabajo
- Entregada -> Entregada
- Aprobada -> Aprobada
- Cancelada -> Cancelada

AUNOR nunca debe recibir observaciones internas, respuestas internas, pendientes internos, actividades dadas de baja, registros técnicos ni campos no autorizados. La separación debe existir también en servidor, no solo en la interfaz.

## Burson
Mantener un seguimiento separado de las actividades internas de Rhino con:
- solicitud o comisión
- fecha
- responsable
- material solicitado
- estado
- pendientes de Rhino
- pendientes de Burson
- fechas de entrega/aprobación
- comentarios u observaciones

## Histórico Excel
Debe migrarse el histórico existente, especialmente las coberturas de Johann.

La migración debe:
- conservar el original
- registrar lote y fila de origen
- ser idempotente
- ofrecer simulación o vista previa
- separar cargadas y rechazadas con motivo
- permitir anular un lote sin borrar su historial
- comprobar totales y muestras contra el archivo original

## Celular y mala señal
La plataforma es **mobile-first**.

Mientras se llena un formulario:
- guardar borrador local
- conservarlo ante pérdida de conexión o recarga
- mostrar si aún no llegó al servidor
- permitir reintento
- asignar una llave idempotente a cada envío
- impedir duplicados en servidor

No se requiere modo offline completo.

## Seguridad esencial
- cuentas individuales
- autorización validada en servidor
- políticas RLS en los datos que correspondan
- rutas protegidas
- secretos solo del lado servidor
- cuentas desactivables
- staging separado de producción
- migraciones versionadas
- auditoría de cambios importantes
- backups y prueba real de restauración
- validación de entradas
- logs sin contraseñas ni secretos

## Fuera de esta entrega
La aplicación móvil para Play Store es un proyecto posterior. La arquitectura debe permitir reutilizar reglas de negocio, pero no se construirá ahora una API pública, PWA completa ni infraestructura especulativa para esa app.

## Meta final
El proyecto termina únicamente cuando existe una **plataforma publicada y utilizable en producción** que:

1. permite registrar y administrar correctamente los cinco tipos de actividad;
2. funciona de forma cómoda desde celular y protege formularios ante mala señal;
3. aplica permisos reales para cada perfil sin filtrar información entre usuarios;
4. permite a supervisión observar, responder, resolver y aprobar con trazabilidad;
5. ofrece a AUNOR una vista mensual segura y de solo lectura;
6. incorpora el seguimiento de Burson definido en el requerimiento;
7. contiene el histórico del Excel migrado y comprobado;
8. cuenta con backups restaurables y pruebas de seguridad y permisos;
9. ha superado QA integral realizado por Marco utilizando todos los perfiles;
10. queda desplegada, documentada, respaldada y cerrada sin problemas críticos o altos abiertos.

---

# FLUJO DE TRABAJO

Este proyecto se rige por `protocolo-universal-v4.md`. Este archivo define **qué hay que construir**; el protocolo universal define **cómo trabajan Marco, Claude y Codex**.

## Jerarquía
1. Decisión explícita de Marco.
2. `protocolo-universal-v4.md`.
3. Este `CLAUDE.md`.
4. Documentos de `docs/`.
5. Código existente.

Una decisión nueva de Marco debe trasladarse al archivo correspondiente para que no dependa del chat.

## Estado durable mínimo
Crear y mantener cuando corresponda:
- `docs/estado.md` — fase activa, objetivo actual, puerta de salida y siguiente acción.
- `docs/decisiones.md` — decisiones de producto/arquitectura que deben sobrevivir al chat.
- `docs/dominio.md` — entidades, campos, validaciones y relaciones.
- `docs/permisos.md` — matriz exacta de acceso.
- `docs/estados.md` — transiciones permitidas.
- `docs/migracion-excel.md` — mapeo y reglas de importación.
- `docs/sistema-diseno.md` — sistema visual aprobado.

No crear todos por anticipado: cada archivo nace cuando su fase lo necesita.

## Ciclo de cada unidad de trabajo
1. Marco fija objetivo y fase activa.
2. Claude lee las fuentes de verdad necesarias.
3. Claude convierte el objetivo en contrato, criterios de aceptación y prueba.
4. Marco aprueba cuando la tarea implica una decisión de producto/diseño/alcance.
5. El árbol queda limpio y el contrato se guarda.
6. Codex ejecuta dentro de las fronteras autorizadas.
7. Se ejecuta la verificación mecánica.
8. Codex hace una segunda revisión contra el contrato.
9. Claude revisa solo riesgo concentrado: autenticación, permisos, RLS, migraciones, datos, estados y fallos reportados.
10. Marco realiza la prueba de la puerta de salida.
11. Se actualizan estado y decisiones.
12. Solo entonces se abre la siguiente unidad o fase.

## Instalaciones
Durante concepción y diseño visual no se instala ni andamia la aplicación.

Al abrir la fase de **construcción frontend**, quedan autorizadas únicamente las tecnologías del bloque **STACK — Frontend**.

Al abrir la primera fase de **backend**, quedan autorizadas las tecnologías del bloque **STACK — Backend**. Antes de esa fase no se configura Supabase, autenticación, base de datos, RLS ni migraciones reales.

Cualquier dependencia adicional que cambie arquitectura, persistencia, autenticación, seguridad o aumente de forma relevante la superficie del proyecto requiere aprobación de Marco.

Una librería pequeña y reversible puede usarse solo si resuelve una necesidad ya aprobada, no duplica una capacidad existente y queda justificada en el cambio.

## Verificación
Debe existir un comando único, idealmente:

`npm run verify`

Debe cubrir como mínimo:
- TypeScript
- lint
- pruebas unitarias/de dominio
- build

Las pruebas E2E y de integración con Supabase se ejecutan en las puertas de salida que las requieran.

Para APIs o herramientas que cambian con el tiempo, verificar la documentación oficial de la versión usada antes de fijar un contrato técnico.

---

# STACK

Usar versiones estables actuales al abrir la fase correspondiente y fijarlas en el lockfile. No perseguir versiones nuevas durante el proyecto salvo necesidad real.

## Frontend
Autorizado únicamente desde la fase de construcción frontend:

- **Next.js — App Router**
- **React**
- **TypeScript en modo estricto**
- **Tailwind CSS**
- **Zod** para validación de formularios y contratos del lado cliente cuando corresponda
- **Vitest** para lógica frontend aislada
- **Playwright** para recorridos visuales/E2E cuando corresponda
- **Git + GitHub**
- **npm**

Reglas frontend:
- mobile-first;
- App Router;
- Server Components por defecto cuando no introduzcan dependencia de backend real;
- Client Components solo cuando exista interacción del navegador;
- datos simulados/mocks durante las fases frontend;
- borradores locales de formularios pueden desarrollarse y probarse sin servidor;
- no conectar Supabase, Auth, RLS ni base de datos durante las fases frontend;
- no añadir state manager global, PWA, mapas ni librerías UI pesadas sin necesidad demostrada.

## Backend
Autorizado únicamente cuando termine y se congele el frontend:

- **Supabase Postgres**
- **Supabase Auth**
- **Supabase Row Level Security (RLS)**
- **Supabase CLI**
- **Migraciones SQL versionadas**
- **Zod** para validación en límites del servidor
- **Vitest** para reglas de dominio/backend
- **Playwright** para verificar recorridos completos contra el backend real
- **Vercel** para despliegue
- **Next.js server-side**: Server Actions, Route Handlers u otros mecanismos del framework solo cuando sean necesarios

Reglas backend:
- autenticación con Supabase y cookies compatibles con SSR;
- autorización validada en servidor;
- RLS como defensa adicional, no sustituto de las reglas de aplicación;
- `service_role` jamás llega al navegador;
- cambios de esquema solo mediante migraciones;
- fechas con semántica explícita y zona de negocio `America/Lima`;
- idempotencia respaldada por restricciones/reglas de servidor;
- staging y producción con datos/proyectos separados;
- no añadir ORM, realtime, colas u otra infraestructura sin necesidad demostrada.

## Contrato entre frontend y backend
El frontend se construye primero contra **mocks y contratos explícitos**.

Antes de iniciar backend deben estar congelados:
- formas de datos que consume la UI;
- estados;
- errores esperados;
- acciones disponibles;
- recorridos;
- permisos visibles;
- necesidades de carga/guardado.

El backend debe implementar esos contratos sin rediseñar el frontend.

Durante las fases backend se puede usar el frontend congelado como cliente de prueba y conectar sus adaptadores al backend real, pero **no se desarrollan nuevas funcionalidades visuales ni se modifica el diseño**, salvo corrección de un defecto comprobado o decisión explícita de Marco.

## Entornos
- local
- staging
- producción

Staging y producción deben usar proyectos/datos separados.

---

# FASES DEL PROYECTO

El proyecto se divide en dos bloques estrictos:

1. **FRONTEND** — concepción, UX/UI y construcción visual.
2. **BACKEND** — datos, autenticación, reglas, seguridad, migración, integración técnica y producción.

No existe una fase que desarrolle frontend y backend simultáneamente.

El paso entre ambos bloques ocurre mediante un **handoff**: el frontend queda aprobado y congelado; el backend recibe contratos claros que debe implementar.

Solo una fase está activa. Cada fase termina por su **puerta de salida**, no por tiempo transcurrido.

# BLOQUE A — FRONTEND

## Fase 0 — Concepción funcional
**Objetivo:** entender exactamente qué producto debe existir antes de diseñarlo.

Definir:
- alcance dentro/fuera;
- perfiles y necesidades;
- tipos de actividad;
- recorridos principales;
- información que debe mostrar cada pantalla;
- comportamiento de AUNOR y Burson;
- estados desde la perspectiva del usuario;
- ubicación;
- necesidades de mala señal;
- criterios de aceptación funcionales.

No definir todavía tablas, RLS, migraciones, Auth ni arquitectura de base de datos.

**Puerta:** el producto puede explicarse pantalla por pantalla y recorrido por recorrido sin depender de decisiones técnicas de backend.

## Fase 1 — UX y desarrollo visual
**Objetivo:** decidir cómo se verá y cómo se usará.

Crear:
- arquitectura de información;
- navegación;
- wireframes;
- formularios;
- vistas móvil y escritorio;
- pantalla AUNOR;
- supervisión;
- módulo Burson;
- estados vacíos/errores/carga;
- sistema de diseño;
- dirección visual definitiva.

Reglas:
- mobile-first;
- no instalar backend;
- no crear base de datos;
- no configurar Supabase;
- no implementar autenticación real.

**Puerta:** Marco aprueba la dirección visual y entiende todos los recorridos principales desde las pantallas.

## Fase 2 — Construcción frontend
**Objetivo:** convertir el diseño aprobado en una aplicación frontend completa utilizando datos simulados.

Construir:
- Next.js;
- TypeScript;
- Tailwind;
- componentes;
- páginas;
- navegación;
- formularios;
- validaciones visuales;
- responsive;
- estados de carga/error/vacío;
- vista AUNOR;
- vista de supervisión;
- módulo Burson;
- representación de los cinco tipos de actividad;
- borradores locales y comportamiento de mala señal que pueda probarse sin servidor.

Todos los datos provienen de fixtures, mocks o adaptadores falsos.

Está prohibido:
- Supabase real;
- base de datos;
- Auth real;
- RLS;
- migraciones;
- lógica de persistencia real.

**Puerta:** la aplicación puede recorrerse de principio a fin con mocks y coincide con el diseño aprobado.

## Fase 3 — Validación y congelamiento frontend
**Objetivo:** cerrar definitivamente el bloque visual antes de abrir backend.

Validar:
- móvil real;
- escritorio;
- accesibilidad básica;
- navegación;
- formularios;
- mensajes;
- estados;
- ubicación;
- AUNOR;
- Burson;
- todos los perfiles simulados.

Crear el contrato de handoff:
- DTOs/formas de datos;
- acciones que la UI necesita;
- errores esperados;
- estados y transiciones visibles;
- necesidades de consulta;
- eventos de creación/edición;
- reglas de idempotencia vistas desde cliente.

**Puerta:** Marco aprueba el frontend. Diseño y comportamiento visual quedan congelados.

A partir de aquí no se añaden ni rediseñan pantallas salvo defecto real o decisión explícita de Marco.

---

# BLOQUE B — BACKEND

## Fase 4 — Arquitectura backend
**Objetivo:** diseñar el backend que satisfará exactamente los contratos del frontend congelado.

Definir:
- modelo de datos;
- relaciones;
- autenticación;
- perfiles;
- matriz de permisos;
- RLS;
- máquina de estados real;
- auditoría;
- estrategia de idempotencia;
- manejo de fechas Lima;
- modelo Burson;
- consultas AUNOR;
- migración Excel;
- backups;
- separación staging/producción.

No rediseñar frontend.

**Puerta:** el modelo y las reglas pueden implementar todos los contratos del handoff sin contradicciones.

## Fase 5 — Cimientos backend
**Objetivo:** implementar las capacidades centrales del servidor y la base de datos.

Construir:
- Supabase;
- migraciones;
- esquema;
- Auth;
- perfiles;
- autorización;
- RLS;
- auditoría;
- reglas de estados;
- validación server-side;
- manejo de fechas;
- idempotencia;
- pruebas negativas de permisos.

**Puerta:** los perfiles y reglas funcionan correctamente mediante pruebas de backend antes de depender de la UI.

## Fase 6 — Backend funcional e integración técnica
**Objetivo:** implementar toda la persistencia y operaciones requeridas por el frontend congelado.

Construir backend para:
- actividades;
- año/mes;
- ubicación;
- historial;
- observaciones;
- respuestas;
- aprobación;
- supervisión;
- Burson;
- consultas seguras de AUNOR;
- borradores/envíos cuando requieran servidor;
- acciones/consultas definidas en el contrato.

El frontend puede conectarse mediante los adaptadores previstos, pero no se modifica su diseño ni se crean nuevas funciones visuales.

Probar:
- `En proceso -> Observada -> En proceso`;
- `Por subir -> Observada -> Por subir`;
- `Entregada -> Observada -> Entregada -> Aprobada`.

**Puerta:** el backend satisface todos los contratos del frontend y las pruebas de integración pasan.

## Fase 7 — Migración del histórico
**Objetivo:** incorporar el Excel de forma trazable y reversible.

Flujo:
`analizar -> mapear -> limpiar -> simular -> importar staging -> comprobar -> corregir -> importar definitivo`

Comprobar:
- origen = cargadas + rechazadas;
- cero duplicados;
- fechas correctas;
- lote y fila de origen;
- mínimo 20 filas verificadas campo por campo;
- anulación de lote funcional.

**Puerta:** migración reproducible, comprobada y explicable.

## Fase 8 — Seguridad, QA backend y endurecimiento
**Objetivo:** intentar romper las reglas, permisos y persistencia antes de producción.

Probar:
- login correcto/incorrecto;
- usuario desactivado;
- aislamiento entre usuarios;
- escalada de privilegios;
- RLS;
- acceso directo a endpoints/acciones;
- estados prohibidos;
- AUNOR sin campos internos;
- Burson;
- doble envío;
- idempotencia;
- fechas;
- auditoría;
- backup;
- restauración.

El frontend congelado puede utilizarse para ejecutar recorridos completos, pero esta fase no desarrolla frontend.

**Puerta:** cero problemas críticos o altos abiertos y restauración demostrada.

## Fase 9 — Producción y cierre
**Objetivo:** publicar y cerrar técnicamente el sistema.

Realizar:
- producción;
- dominio/HTTPS;
- variables y secretos;
- cuentas reales;
- migración final;
- backup final;
- comprobación de permisos;
- eliminación de credenciales temporales;
- tag/versión de entrega;
- repositorio limpio;
- documentación final;
- registro de mejoras futuras;
- revisión de incidentes que puedan mejorar `protocolo-universal-v4.md`.

Marco realiza los recorridos finales utilizando el frontend ya congelado como interfaz del sistema.

**Puerta final:** se cumple la **Meta final** de este archivo y no queda trabajo obligatorio oculto dentro de pendientes.

