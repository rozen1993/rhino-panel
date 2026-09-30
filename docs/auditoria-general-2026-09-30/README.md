# Auditoría general de DA VINCI

Fecha: 30 de septiembre de 2026 · Código examinado: `1c2e03f247f851a992dea1eeab70ac254950778f`.

## Dictamen ejecutivo

La plataforma tiene una base funcional sólida, pero todavía necesita una ronda de estabilización y cierre operativo antes de añadir más complejidad. No recomiendo reconstruirla ni comprar una base de datos más potente como primera medida.

Los asuntos prioritarios son: actualizar dependencias con alertas de seguridad, completar la configuración contractual real, corregir la recuperación después de guardar y la actualización de las fichas, y formalizar respaldo y acceso de producción. Después conviene simplificar entrega, planificación y navegación.

Hay cinco comportamientos defectuosos reproducidos con datos sintéticos. Además, la consulta remota confirma que el control contractual está implementado pero sin periodos configurados. Pasar las pruebas existentes no significa que todos estos escenarios estén cubiertos.

Esta auditoría no modificó código de aplicación, contraseñas, registros de negocio ni configuración remota; tampoco publicó cambios. Los archivos nuevos son el informe, evidencias y pruebas de diagnóstico. Las capturas antiguas regeneradas por la suite se repusieron a su versión original. La base UUID creada para pruebas fue retirada al terminar, sin tocar la base local de trabajo ni producción.

## 1. Alcance y límites

Revisados: acceso y sesiones; Admin, Operario y Aunor; planificación, edición, material, estados, histórico, clasificación, contrato, reemplazos, cuentas y papelera; consultas, migraciones, permisos, pruebas, publicación, dependencias, rendimiento y presentación adaptable.

Método:

- Lectura del código y del contrato visual vigente, con las decisiones posteriores de DA VINCI.
- Consultas SQL agregadas de solo lectura al proyecto enlazado. No se exportaron datos personales, contraseñas, tokens ni enlaces privados al informe.
- Pruebas de aplicación en modo demo aislado; pruebas SQL en una base UUID desechable.
- Comprobación HTTP pública de Vercel, cabeceras y redirecciones sin sesión.
- Revisión de capturas recién generadas por las pruebas de escritorio y móvil.
- Consulta de documentación oficial de proveedores y avisos de seguridad vigentes.

Límites: no había navegador de usuario conectado para recorrer producción autenticada. Las pruebas interactivas son locales y sintéticas. No se ejecutaron ataques, pruebas de carga, borrados reales, mensajes reales ni cambios de estado en producción. No se verificaron facturación, permisos de carpetas OneDrive, dispositivos físicos, lector de pantalla ni restauración de una nueva copia durante esta auditoría. No es una certificación de seguridad o de conformidad WCAG.

## 2. Estado comprobado

### Datos reales

| Indicador | Resultado |
|---|---:|
| Cuentas | 7 activas: 1 Admin, 5 Operarios, 1 Aunor |
| Actividades totales | 23 |
| Actividades fuera de papelera | 17 |
| Papelera | 6 |
| Abril de 2026 | 14 Entregadas, regularizadas históricamente |
| Septiembre de 2026 | 3 Programadas |
| En proceso, fuera de papelera | 0 |
| Entregadas sin enlace de material | 0 |
| Actividades activas sin clasificación | 16 |
| Relaciones contractuales vigentes | 14: 12 coberturas, 1 micronews, 1 redes |
| Periodos contractuales configurados | 0 |
| Actividades con periodo asignado | 0 |
| Tamaño de PostgreSQL | Aproximadamente 14 MB |
| Migraciones registradas | 23, incluida la ficha compacta |

El tamaño es `pg_database_size`, no una lectura del medidor de facturación de Supabase. No hay evidencia de saturación por espacio. Los materiales se enlazan, no se suben como videos a la base. Vaciar papelera no elimina los archivos externos y no es la primera solución de rendimiento.

### Verificaciones ejecutadas

| Comprobación | Resultado y alcance |
|---|---|
| TypeScript, ESLint y build | Aprobados en modo aislado |
| Pruebas unitarias | 381 aprobadas, 49 archivos |
| Edge Functions de cuentas y contraseñas | 28 aprobadas |
| Navegador | 46 aprobadas, datos demo; incluye varias resoluciones |
| Cadena SQL y contratos | Aprobada en `sr_history_test_4a9d0dd72db846afb89fb6419a13e25b`, después retirada |
| Diagnósticos añadidos para la auditoría | 5 reproducciones confirmadas; no son criterios de aceptación |
| Dependencias de producción, última consulta | 1 paquete con alerta crítica: Next.js |
| Dependencias completas, última consulta | 3 paquetes reportados: 1 crítico y 2 altos |
| Rutas privadas sin sesión | `/actividades`, `/cuentas`, `/historico`, `/papelera` y `/aunor/contrato` redirigen a `/acceso` |
| Tablas públicas | Ninguna encontrada con RLS desactivado |
| Proyección Aunor | Sin columnas de responsable interno; sin SELECT directo de authenticated sobre tablas privadas |

Una consulta inicial de `npm audit --omit=dev` devolvió cero alertas. La repetición al cerrar la revisión detectó Next.js y se contrastó con el aviso del mantenedor. Este informe utiliza el resultado final, no el inicial.

## 3. Hallazgos priorizados

P1: atender antes de ampliar funciones. P2: siguiente ronda de estabilidad y experiencia. P3: mantenimiento o evolución. La severidad de un aviso de paquete no equivale automáticamente a explotabilidad demostrada en esta aplicación.

### F01 · P1 · Dependencias con avisos de seguridad

Instalado `next@16.3.4`. El aviso GHSA-vcvr-r3jv-pc5j afecta versiones desde 16.2.0 anteriores a 16.3.6, bajo una condición específica: `ImageResponse` de Node con datos no confiables dentro de SVG. No se encontraron usos de `next/og` o `ImageResponse` en el código de la aplicación; no se demostró esa vía de explotación. La actualización sigue siendo prioritaria. [Aviso del mantenedor](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).

La auditoría completa también reporta `brace-expansion` 1.1.18/5.0.9 mediante ESLint y `undici` 7.29.0 mediante jsdom. Son rutas de herramientas de desarrollo en el árbol inspeccionado, no hallazgos de ejecución remota demostrados en las páginas. [Aviso de brace-expansion](https://github.com/juliangruber/brace-expansion/security/advisories/GHSA-qhr7-859c-m2p7).

Acción: actualizar Next y su configuración ESLint de forma coordinada, revisar las dependencias transitivas y repetir auditoría, tipos, build, pruebas y despliegue. El parche del aviso es 16.3.6; npm propuso 16.3.8 al consultar. No ejecutar una actualización masiva con `--force` sin revisar compatibilidad. Evidencia: [package.json](../../frontend/package.json), [lockfile](../../frontend/package-lock.json).

### F02 · P1 · Contrato desplegado, pero sin configuración operativa

Hay 14 actividades vinculadas a servicios, pero cero periodos y cero asignaciones de periodo. `contractProgress` cuenta únicamente entregadas asignadas a un periodo confirmado. En consecuencia, los X/Y mensuales no pueden expresar aún el trabajo real. Las metas escritas en `contract-reference.ts` son referencias: no crean periodos reales automáticamente.

Acción: configurar los meses desde abril con las cantidades ya confirmadas por Marco, separar los cuatro servicios anuales y confirmar la asignación de las actividades existentes. Hacerlo con vista previa por servicio/mes, respaldo y trazabilidad, sin recrear trabajos ni inferir fechas reales de entrega. No hace falta volver a preguntar las cantidades ya decididas.

Aceptación: abril muestra los conteos que correspondan a las relaciones confirmadas; ninguna entrega queda invisiblemente fuera por falta de periodo; sustituir un trabajo no lo cuenta dos veces. Evidencia: [cálculo](../../frontend/lib/contract-progress.ts), [referencias](../../frontend/lib/contract-reference.ts), [configuración](../../frontend/components/admin-contract-period.tsx) y consulta remota agregada.

### F03 · P1 · Un guardado confirmado puede terminar como error

Las acciones de actividades ejecutan una RPC y después llaman `refreshActivity`. Si el guardado se confirma pero falla `getSupabaseActivity`, la acción lanza error y el usuario no recibe una confirmación fiable. Se reprodujo con RPC exitosa y lectura posterior fallida. Los controles de versión/idempotencia ayudan contra duplicación, pero no resuelven la incertidumbre visible.

Acción: separar «operación guardada» de «no se pudo actualizar la pantalla», revalidar independientemente y ofrecer releer sin repetir la mutación. Conservar el borrador y manejar explícitamente excepciones de red. La ficha contractual compacta ya tiene un patrón de lectura posterior tolerante que puede servir de referencia.

Aceptación: después de un guardado confirmado, una caída de lectura no muestra «no guardado» ni invita a duplicar el trabajo. Evidencia: [refreshActivity](../../frontend/app/actividades/actions.ts), [acción compacta](../../frontend/app/aunor/admin-management-actions.ts), [reproducción](pruebas/action-reproduction.test.tsx).

### F04 · P1 · La ficha puede mantener una versión anterior

`ActivityDetail` inicializa `serverItem` con props mediante `useState`, pero no incorpora nuevas props si el componente permanece montado. La reproducción cambia título y versión de entrada; sigue mostrándose el título antiguo. Además, no hay actualización de ese detalle por foco como en Aunor. No es corrupción de la base, pero dificulta trabajar con varias cuentas y recuperarse de conflictos.

Acción: sincronización consciente de versiones sin pisar ediciones; aviso «actualizado por otra persona» y recarga del registro concreto. Evitar un refresco indiscriminado de toda la aplicación cada pocos segundos.

Aceptación: una versión nueva llega a la ficha sin exigir cerrar sesión ni perder cambios no guardados. Evidencia: [componente](../../frontend/components/activity-detail.tsx), [reproducción](pruebas/ui-reproductions.test.tsx).

### F05 · P1 · Continuidad de respaldo por formalizar

Existe un respaldo privado local del 30/09 y un registro de restauración verificada en la publicación anterior. Es positivo. No se encontró una programación identificable del respaldo en el repositorio ni en las tareas locales consultadas por nombre; esto no descarta una automatización externa no inspeccionada.

Acción: fijar responsable, frecuencia, retención, aviso de fallos y prueba periódica de recuperación. Propuesta inicial: objetivo de perder como máximo una jornada, con un tiempo de recuperación que se mida en un simulacro. El destino externo y cualquier gasto necesitan decisión expresa de Marco. Supabase recomienda exportaciones periódicas y copias externas para proyectos Free; los archivos de Storage no quedan incluidos en el respaldo de base. [Documentación oficial](https://supabase.com/docs/guides/platform/backups).

Evidencia: [script](../../scripts/backup-live-data.ps1), [verificación previa](../despliegue-ficha-admin-2026-09-30.md). No confundir commit de Git con respaldo de actividades o credenciales.

### F06 · P1 · Verificar la adecuación del alojamiento al uso comercial

Marco declaró usar Hobby; no se accedió a su facturación para confirmar el plan actual. La política vigente reserva Hobby para uso personal no comercial. Por el uso laboral para un cliente descrito, debe resolverse la adecuación del plan o del alojamiento. No depende del número de cuentas ni de los MB usados. [Plan Hobby](https://vercel.com/docs/plans/hobby), [política de uso](https://vercel.com/docs/limits/fair-use-guidelines).

Acción: decisión del propietario antes de consolidar la operación comercial. No contratar ni migrar automáticamente. Es una advertencia operativa de proveedor, no evidencia de un cobro producido durante esta auditoría.

### F07 · P1 · Cerrar formalmente el acceso de pruebas

Las siete cuentas están activas y sin cambio obligatorio de contraseña; no hay factores MFA verificados. Esto no demuestra por sí solo que sigan compartiendo una clave. No se comprobaron contraseñas ni se intentó adivinarlas. El antecedente de claves comunes de pruebas hace necesario revisar el cierre de esa etapa.

Acción: credenciales individuales, cambio obligatorio cuando corresponda, revocación de sesiones de pruebas y MFA al menos para Admin. Mantener recuperación controlada. No añadir al cliente permisos de decisión. Las fechas, responsables de la rotación y canal de entrega se acuerdan antes de ejecutarla.

### F08 · P2 · Aunor puede ver fechas antiguas de una edición reprogramada

Calendarios y panel operativo usan `delivery_due_on`, pero `AunorJourneys` dibuja las jornadas conservadas. Con entrega prevista en mayo y jornada original en abril, el detalle sigue mostrando abril y «Lugar por indicar». Reproducido con datos sintéticos. La consulta real no encontró ediciones activas con esa discrepancia actualmente.

Acción: usar la fecha de entrega como dato principal de Edición también en el detalle Aunor; reservar fechas anteriores para historial explícito, sin pedir lugar. Evidencia: [AunorJourneys](../../frontend/components/aunor-space.tsx), [ActivityJourneys](../../frontend/components/activity-journeys.tsx), [reproducción](pruebas/ui-reproductions.test.tsx).

### F09 · P2 · La vista previa no sigue los filtros de Admin

El listado filtra dentro de `DashboardTable`, pero el panel lateral selecciona desde el conjunto del mes. Al buscar algo inexistente, la tabla queda vacía y «Abrir ficha completa» sigue apuntando a la actividad anterior. Reproducido. Puede llevar a editar un registro distinto del que se cree seleccionado.

Acción: compartir el conjunto filtrado y vaciar o actualizar la selección. Evidencia: [dashboard](../../frontend/components/activity-dashboard.tsx), [reproducción](pruebas/ui-reproductions.test.tsx).

### F10 · P2 · El mes y la búsqueda no están preservados en la navegación

El panel usa estado local y arranca en el mes actual. Al desmontar y volver se pierde el periodo elegido; se reprodujo el reinicio de abril a septiembre. El botón de regreso apunta a `/actividades` sin contexto. El historial del navegador puede conservar ciertas entradas, pero el regreso propio de la aplicación no lo garantiza.

Acción: mes, año, búsqueda y estado en parámetros de URL; preservar la posición cuando resulte útil. Es especialmente importante para cargar trabajos desde abril. Evidencia: [dashboard](../../frontend/components/activity-dashboard.tsx), [ruta de ficha](../../frontend/app/actividades/[id]/page.tsx).

### F11 · P2 · «Entregar material» y «Entregar» expresan dos operaciones parecidas

Guardar un enlace actualiza la ejecución, pero no cambia por sí solo el estado a Entregada. La transición la ejecuta el Operario responsable desde la ficha, después de En proceso y con enlace válido. Relacionar el contrato tampoco entrega la actividad. Funciona según la máquina actual, pero el texto facilita la confusión ya experimentada por el equipo.

Acción: «Registrar material» / «Actualizar material» y «Finalizar y entregar», con un aviso tras guardar el enlace. Alternativa futura: confirmar ambas operaciones en una transacción, manteniendo una opción explícita de guardar material sin finalizar. No cambiar silenciosamente esta regla.

Evidencia: [acciones de ficha](../../frontend/components/activity-detail.tsx), [formulario](../../frontend/components/activity-form.tsx), [transición SQL](../../supabase/migrations/202608280001_activity_authority.sql).

### F12 · P2 · Protección incompleta de formularios y borradores

La creación tiene borrador local por cuenta, pero la edición no (`savesDraft = !editing`). No se encontró protección al abandonar cambios de edición. Lectura/escritura de localStorage no maneja indisponibilidad/cuota y el borrador no tiene caducidad. La separación por cuenta evita mezclarlo en la UI, pero no equivale a cifrado ni limpieza de un dispositivo compartido.

Acción: aviso de cambios sin guardar, recuperación de edición con versión base, manejo de almacenamiento fallido y una política clara de conservación al salir. No borrar borradores reales sin avisar. Evidencia: [formulario](../../frontend/components/activity-form.tsx), [borradores](../../frontend/lib/activity-draft.ts), [salida](../../frontend/app/acceso/actions.ts).

### F13 · P2 · Las lecturas crecerán con todo el histórico

El panel interno descarga todas las actividades visibles y después filtra el mes en el cliente. Aunor lee las actividades y jornadas antes de aplicar la ventana de 72 horas; el alcance de calendario no incluye un filtro de año en la lectura. Su refresco visible de 30 segundos puede iniciar aproximadamente 120 actualizaciones/hora por pestaña; eso no significa 120 consultas SQL, pues cada actualización tiene varias lecturas.

Hoy, con 23 actividades, no prueba una emergencia. Es un riesgo de crecimiento y consumo evitable. Acción: filtros y agregados autorizados en servidor, resumen paginado y detalle bajo demanda, actualización incremental/foco con límites. Mantener aislamiento por cuenta; no compartir una caché global de datos privados. Evidencia: [lecturas de actividades](../../frontend/lib/supabase/activities.ts), [lecturas Aunor](../../frontend/lib/supabase/aunor.ts), [refresco](../../frontend/lib/use-aunor-workspace.ts).

### F14 · P2 · Falta observabilidad operativa demostrable

No se encontró instrumentación propia de errores, métricas de flujos o alertas en el código revisado. Hay mensajes genéricos y algunos logs; esto no niega los logs que ofrecen los proveedores. El error general habla de «datos locales» incluso cuando se trabaja con Supabase y no presenta una referencia de incidencia.

Acción: identificador de error y correlación por acción, métrica de fallos/latencia sin cuerpos privados, panel de incidencias y alertas de disponibilidad. Elegir proveedor y costes después; los requisitos pueden definirse sin comprar nada. Evidencia: [error general](../../frontend/app/error.tsx), [acciones Aunor](../../frontend/app/aunor/actions.ts).

### F15 · P2 · Acceso público y CSP necesitan endurecimiento

El selector público expone intencionadamente nombres, usuarios y roles mediante `access_directory_v1`, incluso al visitante anónimo. No expone contraseñas ni actividades, pero identifica a Admin y al equipo. Para salir de piloto, recomiendo un acceso neutro sin directorio público o una selección local recordada en dispositivos confiables.

La CSP observada sí restringe formularios, marcos y objetos, pero no define `script-src`/`default-src`. No equivale a protección completa contra ejecución de scripts inyectados. No se demostró un XSS. Proponer una política compatible con Next, primero en modo de reporte y luego exigida. Verificar además límites de intentos de autenticación; no se probaron mediante fuerza bruta.

Evidencia: [directorio](../../supabase/migrations/202609090001_access_directory.sql), [acceso](../../frontend/app/acceso/supabase-access.tsx), [cabeceras](../../frontend/lib/security-headers.ts). Cookies HttpOnly/secure y redirecciones privadas son defensas positivas ya presentes.

### F16 · P1 · Las pruebas de producción lógica no están completas en CI

CI ejecuta tipos, lint, unitarias, build, auditoría de dependencias de producción, 28 pruebas de funciones y E2E demo. No ejecuta la cadena SQL/RLS completa ni la integración Auth disponible. `admin-erasure` no tiene archivo unitario incluido en `test:functions`; que exista cobertura de otras capas no reemplaza ese recorrido extremo a extremo.

Acción: integrar las pruebas SQL y de Auth en infraestructura desechable y cubrir contraseña incorrecta, vista previa caducada, dependencias, fallos parciales y recuperación de borrados. Nunca usar producción ni la base de trabajo para ello. Añadir los cinco casos detectados como regresiones con expectativas corregidas, no conservar las aserciones de reproducción como criterio de calidad.

La auditoría de producción hoy detecta una alerta que puede bloquear una nueva ejecución de CI; una ejecución anterior verde no certifica el estado actual de los avisos. Evidencia: [workflow](../../.github/workflows/verify.yml), [scripts](../../frontend/package.json), [verificador SQL](../../frontend/scripts/verify-history-contract.mjs).

### F17 · P2 · Calidad del archivo pendiente de completar

16 de 17 actividades activas carecen de clasificación. No es pérdida ni error de estado: el sistema conserva «Sin clasificar» y evita inventarla. Pero limita la distinción Estándar/Especial solicitada. También hay 3 actividades sin relación contractual, además de las 14 sin periodo.

Acción: bandeja de «Datos por completar», agrupada por actividad y con vista previa de cambios masivos. Admin confirma el marcaje; no convertir automáticamente todos los vacíos a Estándar. Las 14 entregas de abril ya están Entregadas: no requieren repetir inicio/entrega ni alterar sus fechas.

### F18 · P2 · Formularios y presentación conservan fricciones menores

El motivo de baja de Admin usa solo placeholder, sin una etiqueta persistente; no es la misma calidad que los diálogos nuevos. Hay confirmaciones nativas `window.confirm`, múltiples botones de guardado en una ficha y fechas ISO visibles en ciertos detalles. En móvil, la cabecera y selectores de contrato ocupan casi toda la primera pantalla antes del primer conteo.

Acción: etiquetas persistentes, errores asociados al campo, confirmaciones consistentes con foco seguro y fechas legibles. Priorizar el contenido útil en el primer pantallazo. No se certificó toda la accesibilidad por pasar el test de tokens. Evidencia: [ficha](../../frontend/components/activity-detail.tsx), [contrato](../../frontend/components/aunor-contract.tsx), [captura móvil sintética](contrato-movil-demo.png).

## 4. Campos, pantallas y reglas a simplificar

| Elemento | Diagnóstico | Recomendación |
|---|---|---|
| Burson: roles, componentes y ramas de lógica | Retirado del acceso, aún presente por compatibilidad | Separar legado del flujo activo; no eliminar registros ni migraciones históricas |
| Confirmaciones antiguas de Aunor | Quedan campos/textos de versiones anteriores | Conservar como historia etiquetada; no recuperar botones de aprobación ni contarlos como aprobación vigente |
| Acuerdo/llamada independiente | La ficha compacta ya lo integró al reemplazo | Mantener esa decisión; llevar correcciones antiguas al historial, sin otro paso obligatorio |
| Opciones avanzadas del contrato | Conservan publicación, versiones y correcciones | Diferenciar acción vigente de mantenimiento histórico; evitar dos formularios que parezcan guardar lo mismo |
| «Lugar» y descripción vacía de Edición | Se quitaron del formulario, no de todas las vistas | Presentación por tipo de servicio; ocultar campos no aplicables sin borrar datos previos |
| «Origen: Ordinaria» | Bajo valor si Burson ya no participa | Solo mostrar origen cuando explique algo al usuario |
| UUID completo en la cabecera | Ocupa atención sin ayudar al trabajo habitual | Referencia corta con copiar ID en detalles técnicos |
| «Actividades al ingresar» y «Última actualización disponible al ingresar» en acceso | Columnas siempre vacías por privacidad | Retirarlas en el acceso simplificado; no publicar datos para rellenarlas |
| Conversación con Admin que bloquea el material | Regla vigente, no bug accidental | Revisar si conversar debe bloquear; proponer una acción separada «Cerrar versión» con corrección trazable |
| Sesiones expiradas | 166 de 170 registros de sesión ya vencidos | Definir retención técnica; no borrarlas durante la auditoría ni por analogía con la papelera |

No considero obsoletos el historial, la papelera recuperable, la referencia de reemplazo ni las fechas antiguas conservadas: protegen trabajo real. Creatividad y Locución siguen fuera de las entradas del Histórico por decisión expresa de Marco, no por un fallo a corregir sin consulta.

## 5. Mejoras de diseño recomendadas

Mantener azul noche `#021326`, superficies claras, cian operativo, lima para acciones principales, azul para En proceso y verde sólido para Entregada. Conservar sellos de clasificación, modalidades con iconos y contrato por tarjetas. Las guías de diseño y accesibilidad se utilizaron para reducir densidad y mejorar jerarquía, no para imponer una nueva marca.

| Sección | Mejora concreta |
|---|---|
| Panel Admin | Barra compacta con periodo, búsqueda y filtros; vista «Pendientes de cualquier mes»; selección lateral coherente |
| Panel Operario | «Hoy / Próximas / Pendientes» y un siguiente paso claro; distinguir material guardado de entrega final |
| Ficha | Resumen breve arriba; ejecución primero; contrato después; historial y administración plegados; evitar guardados de igual jerarquía |
| Histórico | Conservar calendario; añadir vista lista y búsqueda por título; mantener día/filtro al volver del detalle |
| Contrato | Reducir cabecera móvil y reunir los selectores; mostrar el primer X/Y antes; «Configuración pendiente» en lugar de sugerir cero cumplimiento cuando faltan periodos |
| Cuentas | Alta simple, permisos comprensibles y estado de credencial; destrucción en zona separada con las protecciones actuales |
| Mensajes y errores | «Guardado», «Pendiente de sincronizar» y «No se pudo confirmar» con significados distintos y acciones recuperables |
| Tipografía | Subir el tamaño del contenido operativo pequeño, conservar microetiquetas solo para información secundaria; revisar consistencia Windows/móvil |

Referencias inspeccionadas: [ficha Admin sintética](ficha-admin-demo.png), [contrato móvil sintético](contrato-movil-demo.png) y [contrato visual vigente](../../diseno/direccion-final-traducida/CONTRATO-VISUAL.md). Las capturas son evidencia del estado actual, no propuestas nuevas aprobadas.

## 6. Funcionalidades que sí añadirían valor

Ordenadas por utilidad para el trabajo descrito, no por novedad tecnológica:

1. **Registrar trabajo histórico terminado.** Un flujo Admin con material final, fecha de actividad, entrega real opcional, clasificación y relación contractual. Vista previa y trazabilidad; no fingir que se ejecutó hoy ni entrar como otro usuario.
2. **Centro de contrato para Admin.** Configurar metas/periodos una vez, revisar el mes y relacionar pendientes desde un único sitio. Aunor conserva exclusivamente consulta.
3. **Bandeja de pendientes accionables.** Sin material, vencidas, sin clasificar, sin servicio y sin periodo, con acceso directo a resolver cada caso.
4. **Búsqueda transversal y filtros persistentes.** Encontrar trabajos de abril sin recorrer meses; respetar el alcance de cada rol y ocultar responsables a Aunor.
5. **Duplicar planificación y plantillas.** Para coberturas o ediciones repetidas: copiar solo planificación, pedir fechas y responsable, nunca copiar estado final, material, conversaciones o historial como si fueran nuevos.
6. **Aviso de superposición de jornadas.** Al asignar una actividad, advertir coincidencias del operario. Inicialmente aviso, no bloqueo; no inventar horarios que hoy no se registran.
7. **Resumen mensual verificable.** Reporte PDF/CSV con servicio, periodo, entregas y sustituciones. Totales del mismo cálculo contractual; exportación sin responsables para Aunor. Requiere aprobar esta nueva función, no asumir que el antiguo diseño ya la permitía.
8. **Cierre de mes con reapertura motivada.** Evita cambiar accidentalmente periodos revisados. No equivale a aprobación del cliente ni autorización de pago.
9. **Avisos internos no invasivos.** Asignación, fecha próxima, entrega y comentario. Empezar dentro de la aplicación; correo/WhatsApp y sus costes se evalúan aparte.
10. **Asistente IA de consulta, después.** Resumir avance y buscar trabajos autorizados con enlaces a la fuente. Sin decidir estados, borrar, reasignar o revelar responsables a Aunor; presupuesto limitado y datos solo cuando exista autorización. No sustituye las correcciones anteriores.

## 7. Rendimiento: qué se midió y qué no

En tres peticiones consecutivas sin sesión a `/acceso`, el tiempo hasta cabeceras fue aproximadamente 3191, 308 y 340 ms. Es una muestra pequeña desde esta máquina, no un percentil, una prueba móvil ni una medición LCP/INP. La primera diferencia no permite atribuir por sí sola la causa a un arranque en frío.

Las imágenes fuente de Histórico ocupan aproximadamente 1,6 y 1,8 MB, pero la aplicación usa `next/image`. Las respuestas optimizadas de 1080 px comprobadas fueron WebP de 25.716 y 39.154 bytes. Por tanto, sería incorrecto afirmar que cada visita descarga necesariamente los PNG originales completos.

Prioridades: medir rutas autenticadas en un entorno seguro, reducir el volumen de consultas, mantener cargas por sección y medir navegación móvil. No compartir datos privados en cachés públicas ni añadir precarga de todo el histórico. No hay evidencia aquí que justifique comprar más capacidad de base por rendimiento.

## 8. Lo que está bien y debe conservarse

- Separación de roles en interfaz, acciones y base; creación propia como permiso revocable.
- Aunor solo consulta y recibe una proyección sin el responsable interno.
- Estados acotados: Programada, En proceso y Entregada; clasificación independiente del conteo.
- Control de versiones, claves de idempotencia y guardado contractual atómico, probado con rollback.
- Baja recuperable y destrucción explícita con contraseña, impacto y confirmación; no usarla como limpieza de pruebas.
- Histórico sin inventar fecha de entrega en la regularización.
- Demo prohibida en despliegues Vercel; pruebas separadas de datos reales.
- Cabeceras de seguridad, noindex, cookies protegidas y recuperación de foco en componentes recientes.
- Suite amplia y diseño reconocible. Las mejoras propuestas afinan esos cimientos.

## 9. Hoja de ruta recomendada

| Fase | Entrega | Criterio de cierre |
|---|---|---|
| A · Estabilizar | F01, F03, F04, F08–F10 y ampliar CI (F16) | Dependencias revisadas; cinco reproducciones convertidas en regresiones que exigen el comportamiento correcto; tipos/build/unitarias/E2E/SQL verdes |
| B · Cerrar operación real | F02, F05–F07 y F17 | Periodos reales confirmados, conteos conciliados, acceso de producción y respaldo con responsables; alojamiento resuelto por el propietario |
| C · Simplificar uso | F11–F15 y F18, ingreso histórico, centro contractual y pendientes | Menos pasos, guardado inequívoco, borradores recuperables, filtros estables y datos mínimos por pantalla |
| D · Ampliar con criterio | Plantillas, avisos, reportes y posteriormente IA | Una función por vez, utilidad validada con el equipo, coste y permisos explícitos |

Antes de cada implementación: commit de respaldo y propuesta PNG cuando cambie la composición visible, como pidió Marco. Primero local y datos sintéticos. Si una fase cambia esquema remoto, respaldo privado restaurable; publicación y modificaciones de datos solo dentro del alcance autorizado. Nunca convertir esta auditoría en una autorización implícita para borrar, rotar claves, contratar o desplegar.

## 10. Reproducibilidad y evidencias

Desde `frontend`, las verificaciones utilizadas fueron `npm.cmd run verify` con `SISTEMA_R_DATA_SOURCE=demo` y `SISTEMA_R_ISOLATED_TEST=audit`, `npm.cmd run test:e2e`, `npm.cmd run test:functions`, `node scripts/verify-history-contract.mjs`, y las dos variantes de `npm.cmd audit --json` con/sin `--omit=dev`.

El script SQL debe revisarse antes de reutilizarlo: crea su propia base UUID y solo elimina esa base. La suite de navegador actual tiene una prueba que escribe capturas en `docs`; no repetirla sin preservar esos artefactos o redirigir su salida.

Las cinco reproducciones se conservan en [pruebas](pruebas/). Para repetirlas, copiar esos tres archivos a `frontend/.verificacion/aunor-auditoria-general/` y ejecutar desde `frontend`:

```powershell
npx.cmd vitest run --config .verificacion/aunor-auditoria-general/audit.config.mts
```

Se usan exclusivamente mocks y propiedades sintéticas. Que pasen confirma el defecto observado, no que esté corregido. Tras corregir, deben cambiar sus expectativas. Resumen de mediciones: [evidencia.json](evidencia.json).
