# Correcciones locales tras la auditoría general

## Alcance autorizado

Marco confirmó que las fechas ya registradas son la referencia contractual,
que continúa el piloto con trabajo real y que las funciones nuevas requieren
aprobación visual. Respaldo previo: `7df9702`.

Esta ronda modifica código y pruebas **en local**. No publica, no cambia
contraseñas, no contrata alojamiento, no reasigna filas reales y no altera
fechas, estados, enlaces, clasificaciones ni cuentas de producción.

## Correcciones implementadas

| Hallazgo | Resultado local |
|---|---|
| F01 · Dependencias | Next y eslint-config-next 16.3.8; brace-expansion 1.1.21/5.0.12 y undici 7.30.0. Auditoría completa de paquetes sin alertas en la consulta final |
| F02 · Contrato | Cálculo unificado Admin/Aunor por periodo explícito o fecha registrada; metas ya confirmadas. No hace falta recrear ni volver a cargar abril |
| F03 · Guardado y lectura posterior | RPC confirmada + lectura fallida devuelve éxito con advertencia e ID, no «no guardado»; la ficha impide operar sobre su versión obsoleta hasta refrescar |
| F04 · Ficha desactualizada | Incorpora nuevas props, conserva el borrador de mensaje y no sustituye un resultado nuevo por props de menor versión |
| F08 · Edición en Aunor | Usa la fecha prevista de entrega, sin presentar como vigente una jornada antigua ni pedir lugar |
| F09 · Vista previa filtrada | Tabla y panel lateral se basan en el mismo conjunto filtrado; sin coincidencias no queda una ficha accionable anterior |
| F10 · Navegación | Mes, año, texto y estado en URL; enlace de ficha con regreso local validado; conserva el contexto al volver o recargar |
| F11 · Material frente a entrega | Se mantienen los nombres aprobados de los botones; tras guardar material se explica que debe finalizarse con «Entregar» en la ficha. Se ofrece el enlace para volver |
| F12 · Borradores, parcial | Lectura/escritura/borrado toleran bloqueo de almacenamiento y cuota; aviso si no puede guardarse el borrador; protección de cierre/recarga con cambios sin guardar |
| F13 · Rendimiento, parcial | Panel Aunor filtra la ventana de 72 horas antes de descargar; jornadas y entregas solo de las actividades vigentes, por lotes de IDs acotados |
| F14 · Errores, parcial | Mensaje general sin afirmaciones incorrectas sobre «datos locales»; referencia de incidencia cuando Next aporta digest |
| F16 · Verificación, parcial | Nuevo job SQL/RLS/contrato en PostgreSQL 17 desechable; reproduce el mismo verificador local. No usa secretos ni proyecto enlazado |
| F18 · Accesibilidad, parcial | Etiqueta persistente y asociada al motivo de baja; las maquetas respetan foco y adaptación móvil |

El parche de Next corresponde al [aviso del mantenedor](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).
No se utilizó `npm audit fix --force` ni se cambiaron versiones principales.

## Regla contractual confirmada

1. Si Admin ya asignó un periodo explícito válido para ese servicio, se respeta,
   incluso en registros antiguos. Una meta explícita nula o cero no se sustituye.
2. Si no hay asignación, se usan las jornadas registradas o la fecha prevista de
   entrega de Edición. Nunca la fecha de publicación, carga o regularización.
3. Las referencias mensuales parten de abril de 2026. Se mantienen los ocho
   servicios mensuales y los cuatro anuales; fiesta de fin de año es anual.
4. El ciclo anual ya acordado de seguimiento es abril 2026–marzo 2027. No se
   supone una renovación ni una fecha de vencimiento del contrato.
5. Fechas inexistentes, incoherentes o que cruzan periodos quedan por revisar;
   no se inventa una asignación ni se cuenta la misma actividad en dos meses.
6. Solo suman entregadas, relacionadas al servicio, realizadas y no sustituidas.
   Especial no multiplica unidades; los excedentes no pasan a otro mes.

Los periodos de referencia se calculan en lectura. Sus identificadores
`calendar:...` no se guardan ni se envían como IDs de base. Las actividades y
periodos reales permanecen intactos. Una modificación posterior de las fechas
registradas modifica el periodo derivado; una asignación explícita permanece
fija. El nuevo centro contractual, si se aprueba, permitirá revisar excepciones.

## Propuestas pendientes de aprobación

[Galería con cinco propuestas y diez PNG](propuestas-mejoras-2026-09-30/README.md):
registro histórico terminado, centro contractual Admin, pendientes del equipo,
búsqueda transversal, plantillas y reportes mensuales. Son ejemplos ficticios;
no constituyen pantallas implementadas ni muestran conteos reales.

Las guías de diseño, accesibilidad y rendimiento se aplicaron para preservar
la identidad visual, asociar correctamente campos y reducir lecturas innecesarias.
No se reemplazó el diseño de Aunor aprobado por una propuesta sin autorización.

## Pendientes que esta ronda no da por resueltos

- F05: programar y probar respaldos periódicos con retención y responsable.
  No se ha contratado almacenamiento externo ni configurado una tarea que use
  credenciales o escriba fuera del destino autorizado.
- F06/F07: decisión de alojamiento y fin de credenciales de piloto pospuestos
  por Marco hasta terminar las pruebas. No hubo cambio de plan, clave ni MFA.
- F12: recuperación de borradores de edición con versión base, retención en
  dispositivos compartidos y aviso al abandonar mediante enlaces internos.
  `beforeunload` protege cierre/recarga, no toda navegación SPA.
- F13: paginación/filtro del panel interno e Histórico por año, medición de
  latencia autenticada real y reducción del refresco periódico. Esta ronda no
  demuestra una mejora de LCP ni un porcentaje de velocidad de producción.
- F14/F15: alertas operativas completas, CSP compatible con Next y cierre del
  directorio público de cuentas, conservando las decisiones del piloto.
- F16: integración completa de Auth en CI y pruebas específicas adicionales de
  eliminación definitiva. El nuevo job SQL no equivale a un test completo de Auth.
- F17: clasificar trabajos reales. No se decide automáticamente Estándar/Especial.
- F18 y legado: el rediseño general y la retirada de campos necesitan revisión
  visual y pruebas; no se borraron históricos, cuentas ni ramas por compatibilidad.

## Verificación

Las pruebas usan datos sintéticos y bases UUID desechables. No se accedió a
cuentas reales para probar guardados ni se ejecutó ninguna migración contra
el proyecto remoto.

El nuevo verificador `frontend/scripts/verify-sql-ci.mjs` crea un contenedor UUID
sin puertos publicados, verifica migraciones/RLS y lo retira con su volumen
anónimo después de comprobar la etiqueta de propiedad. El código de CI queda
preparado, pero GitHub Actions no se ha ejecutado porque no hubo push.

### Resultados del cierre local · 30/09/2026

- `npm run verify`: TypeScript, ESLint, 401 pruebas unitarias en 53 archivos y
  compilación con Next 16.3.8 correctos.
- `npm run test:functions`: 28 pruebas correctas.
- `npm run test:e2e`: 47 pruebas de navegador correctas con fuente demo aislada.
  Se corrigió durante esta ronda un fallo de compatibilidad con periodos
  explícitos anteriores a abril y se añadió su regresión unitaria.
- Tras el ajuste final del selector de periodos: TypeScript y ESLint correctos;
  26 pruebas de contrato/navegación correctas; nueva compilación y las 2 pruebas
  de `contract-reference.spec.ts` correctas, incluyendo escritorio y móvil.
  La repetición final de toda la suite unitaria volvió a pasar: 401/401 en 53 archivos.
- Verificador de migraciones/SQL/RLS/contrato: correcto tanto en la base UUID
  del contenedor local como en un contenedor PostgreSQL 17 independiente creado
  por `verify-sql-ci.mjs`. Se retiraron únicamente los recursos de esas pruebas.
- Prueba sintética con 500 entregas antiguas: el panel Aunor no descarga esas
  actividades ni sus jornadas. Otra prueba conserva todos los resultados con
  105 actividades vigentes, lotes acotados y paginación reducida del servidor.
- `npm audit --json`: cero vulnerabilidades notificadas en la consulta final,
  incluyendo dependencias de desarrollo. No equivale a ausencia de todo riesgo.
- Diez PNG generados sin red, a 1440 y 390 px, sin errores de JavaScript ni
  desbordamiento horizontal; revisión visual de las propuestas.
- `git diff --check`: correcto. Job YAML validado localmente.

Estos resultados no verifican aún GitHub Actions ni el despliegue de Vercel.
Las nuevas funciones mostradas en los PNG siguen pendientes de aprobación y
no se incorporaron a la aplicación. Los pendientes operativos de este informe
permanecen abiertos.
