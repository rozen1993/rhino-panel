# Encargo de construccion del chat IA en Codex Cloud

Estado inicial: encargo preparado; todavia no ejecutado en la nube.
Repositorio: `rozen1993/rhino-panel`.
Rama de partida: `codex/chat-ia-cloud-20260914`.
Base de codigo: `41d6f6015387b097fb659ead6aa9745561c20803`.

## Autorizacion y objetivo

El 14/09/2026 Marco pidio construir el chat IA sobre una copia de la plataforma
en la nube, probar esa copia y preparar su posterior acoplamiento. Esta peticion
autoriza la implementacion de desarrollo y su integracion en la copia; sustituye
el alcance exclusivamente documental de la entrega anterior. No volver a pedir
permiso para escribir codigo, preparar migraciones aditivas o ejecutar pruebas
aisladas. No interpreta la peticion como autorizacion a gastar en proveedores,
contratar infraestructura, enviar datos reales o alterar produccion.

Lee primero `AGENTS.md`, `frontend/AGENTS.md` y el documento indicado por Marco:
`docs/auditoria-chat-ia-2026-09-14.md`. La auditoria remite expresamente a
`docs/plan-chat-ia-da-vinci-2026-09-14.md`: usa sus contratos y fases para resolver
H01-H16. El PDF original es un antecedente, no una especificacion para copiar.
Lee las guias pertinentes de `frontend/node_modules/next/dist/docs/` antes de
implementar Next.js, como ordena el AGENTS del frontend.

Construye el asistente y prepara su integracion en DA VINCI conforme al plan:
nucleo reusable, adaptador del producto, puente de mismo origen y panel nativo.
Trabaja fase por fase; verifica cada fase antes de continuar. Resuelve las
decisiones reversibles de implementacion usando la arquitectura recomendada.
Documenta con precision todo requisito que quede pendiente. No llames completo
al plan mientras queden funciones o pruebas requeridas sin completar.

## Aislamiento obligatorio

- Trabaja exclusivamente en esta copia y su rama. No escribir en master/equipo,
  fusionar, desplegar, activar servicios o modificar la plataforma real.
- No necesitas `.env.local`, sesiones reales, contrasenas, dumps ni credenciales
  de Vercel, Supabase u OpenRouter. No copies esos recursos al contenedor.
- Todas las pruebas usan datos sinteticos. La base local de Marco y el proyecto
  Supabase desplegado estan fuera del alcance, incluso para pruebas de lectura.
- Proveedor IA simulado por defecto; ninguna inferencia pagada o envio de datos
  reales. Implementa el adaptador real y sus validaciones sin activarlo. Pruebas
  con red simulada deben demostrar cuerpos, errores, limites y contratos.
- Sin llamadas a rhino-panel.vercel.app ni al dominio de produccion.
- No ejecutar `frontend/scripts/check-public-access.mjs`,
  `frontend/scripts/verify-backup.mjs`, `scripts/backup-live-data.ps1`,
  `frontend/scripts/verify-local-supabase.mjs`, `supabase db reset`,
  `supabase link`, `supabase db push`, `build:vercel` ni despliegues. No retirar
  el guard que mantiene inactivo el verificador historico de reset.
- Los comandos de supabase/README.md son historicos: las restricciones actuales
  de AGENTS y este encargo prevalecen.
- El asistente del producto nunca obtiene herramientas de SQL libre, cuentas,
  cambios de permisos o eliminacion definitiva. Respeta Admin/Operario/Aunor.

## Entorno y verificaciones

Selecciona Node 24. Configuracion inicial desde la raiz:

```bash
bash scripts/cloud/chat-ia.sh setup
```

El script rechaza las variables de conexion conocidas y los archivos `.env`
de raiz/frontend salvo `.env.example`; no es un escaner general de secretos ni
un cortafuegos. Configura el entorno sin secretos y conserva desactivado el
acceso a Internet del agente cuando no haga falta para una tarea concreta.
El setup instala dependencias del lockfile y Chromium, y prepara Deno mediante
pruebas unitarias.
Antes de editar registra la linea base; despues ejecuta:

```bash
bash scripts/cloud/chat-ia.sh verify
```

El runner fija demo y audit en cada ejecucion; no depende de que los exports del
script de setup persistan en la fase del agente. Revisa los scripts antes de
modificarlos y conserva las comprobaciones. No debilitar pruebas para lograr
resultados verdes. Si cambias contratos intencionadamente, explica y prueba la
nueva conducta, manteniendo las reglas de producto.

La bateria anterior NO prueba PostgreSQL/RLS. Para esa verificacion proporciona
PostgreSQL/Supabase efimero dentro de este entorno si esta disponible, crea bases
con nombres UUID y elimina solo recursos que la propia prueba haya creado.
Revisa `verify-aunor.mjs`, `verify-journey-places.mjs` y
`verify-auth-integration.mjs` como patrones; asumen contenedores locales fijos y
no deben ejecutarse sin adaptar/verificar su destino. Nunca conectar el
contenedor cloud a la laptop de Marco. No supongas que Docker esta disponible.
Si falta PostgreSQL/Docker, deja la integracion DB explicitamente pendiente:
los mocks no demuestran RLS ni concurrencia real en base de datos.

## Secuencia de desarrollo

1. F0: contratos, matriz de permisos, sesion pasiva, modelo de amenazas,
   proveedor simulado, pruebas negativas y consumo/reservas atomicas. Construye
   controles de coste antes de conectar un proveedor. No ejecutar F0b pagada.
2. F1: Admin de lectura, agenda/busqueda/pendientes con fuentes verificables y
   borradores de cronogramas; ninguna mutacion de negocio. Panel nativo diferido
   y aislado de errores, siguiendo el contrato visual vigente. Integra el panel
   en la copia tras una bandera desactivada por defecto; habilitala solo en demo
   para pruebas. Texto e imagenes segun el contrato, con proveedor simulado.
3. F2: lectura de Operario/Aunor bajo su alcance real, revalidacion de fuentes y
   aislamiento de memoria. No reactivar Burson ni conversaciones retiradas.
4. F1b/F3/F4: implementa lo previsto tras sus dependencias y pruebas; propuestas
   exactas, confirmacion por boton fuera del modelo, versiones, recibos,
   idempotencia y recuperacion. Prueba escrituras solo en bases desechables;
   mantenlas desactivadas por defecto. No incluir F5 opcional por defecto.
5. Verifica tambien regresiones en acceso, actividades, Historico, Aunor,
   sesiones y controles existentes. Prueba interfaz a 390/768/1366/1920 px,
   teclado y zoom. El chat cerrado no debe causar inferencias ni lecturas.

No prometas calidad, latencia o precio del modelo real a partir de simulaciones.
La evaluacion de modelos, privacidad/endpoints, retencion real, presupuesto y
activacion de roles/comandos se resuelven antes del piloto real. Prepara su
configuracion de modo que queden cerrados cuando falte una decision.

## Entrega y acoplamiento posterior

Entrega el codigo en esta rama con diff revisable y un informe en
`docs/resultado-chat-ia-cloud.md`: fases completas/pendientes, trazabilidad de
H01-H16, pruebas y resultados reales, capturas, cambios de esquema, dependencias
y pasos concretos de integracion y desactivacion. No mostrar secretos en logs.
La revision posterior incorporara los cambios a la plataforma; el despliegue
con migraciones exige un respaldo privado verificado y pruebas de restauracion.
No restaurar ni borrar datos reales para deshacer cambios de codigo.

Si finaliza la tarea antes de completar el alcance, deja un punto de continuidad
exacto, conservando cambios y pruebas. No afirmes que el chat esta construido o
desplegado si solo existen contratos, mocks o una interfaz sin backend completo.
