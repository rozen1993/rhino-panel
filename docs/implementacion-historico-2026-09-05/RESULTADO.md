# Histórico C y lugares por jornada — cierre local

Autorización: respuestas de Marco del 2026-09-05, continuadas después de interrupción por cuota. Cierre verificado el 2026-09-06 UTC (2026-09-05 en Lima). Este corte no cierra ni modifica el goal general.

## Implementado

- `/historico` muestra la entrada C Diagonal Rhino con las dos fotografías ilustrativas aprobadas. Conserva la cabecera, navegación, paleta y tipografías existentes.
- Cada fotografía abre el calendario anual actual por Grabación o Edición (`tipo=grabacion|edicion`), con doce meses, año navegable y detalle. Los enlaces antiguos con solo año siguen funcionando. `Ver todo el Histórico` conserva acceso a las otras categorías sin crear nuevas entradas.
- Coincidencias: contador neutral por actividad única, no por jornada. Lista completa con título, ID estable completo, responsable, lugares y fechas; detalle fecha-lugar y navegación accesible móvil. Se especifica que el resumen lista los lugares de toda la actividad.
- Una actividad puede registrar lugares por jornada, incluso fechas iguales con distintos lugares. Solo días, sin horas. Si el lugar específico está vacío se usa el general; no se inventa un lugar para registros antiguos.
- Admin conserva la planificación; Operario autorizado puede crear inicialmente para sí mismo; responsable conserva solo ejecución; Burson mantiene su canal propio. Detalles de actividad, Burson, formulario de ejecución e Histórico muestran jornadas/lugares.
- Migración aditiva `202609050001_activity_journey_places.sql`: columna por jornada, normalizador puro, wrappers RPC v2 INVOKER que delegan a v1 sin duplicar autoridad. Guard SR011 impide que un cliente antiguo borre lugares nuevos al replanificar. V1 y sus hashes originales se conservan.

## Evidencia

- Baseline anterior a los cambios: 198 pruebas /22 archivos PASS.
- Resultado final: **207 pruebas /23 archivos PASS**, typecheck PASS, lint PASS y `git diff --check` PASS.
- Build de Next y **16 pruebas Playwright PASS** usando demo y puerto3107 separado, Chromium con contextos nuevos. Entrada y calendarios en 390/768/1366/1920px; doce meses, navegación de años, coincidencias, formulario multisede, permisos, claves temporales, Burson y Papelera. Prueba adicional acotada de foco/controles en 320px con fuente raíz aumentada, no auditoría WCAG.
- SQL/RLS: `node scripts/verify-journey-places.mjs` PASS en tres bases efímeras sucesivas. Se aplicaron las siete migraciones anteriores y la octava sobre fixtures ficticios. Roundtrip multisede, replay legado y v2, SR006 entre versiones y place-only, guard SR011 total/parcial, replan legado vacío válido, versionado, concurrencia, validación, permisos/RLS, ejecución, baja/restauración y sesión revocada. Las bases creadas por el ensayo fueron eliminadas al finalizar; ningún dato del usuario se borró.
- No se ejecutó `verify-local-supabase.mjs`: resetea la base habitual y no era seguro en este contexto. El ensayo aislado valida PostgreSQL/RLS, no GoTrue/PostgREST HTTP real.
- Capturas finales: `Implementacion-Historico-C-2026-09-05/verificacion-final/` (20 PNG). Galería: `ABRIR-RESULTADO.html`. Capturas anteriores conservadas sin sobrescribir.

## Claudex y tratamiento de hallazgos

Modo execute, pipeline core, perfil o/max. Codex único escritor; Claude deriva y revisa en lectura. Derivaciones separadas archivadas y comparación en sesión neutral sin herramientas. Activación obligatoria por cambio de datos/migración.

Convergencia: columna por jornada, herencia del lugar general, mismos permisos y conteo por actividad. Diferencias resueltas: wrappers v2 frente a duplicación; normalización solo de la entrada v2; guard explícito contra pérdida por clientes antiguos; pruebas en base separada en vez del runner que resetea el proyecto.

Claude no encontró bloqueantes en el código. Los hallazgos medios son gates operativos (migración antes del frontend y posible SR006 al reintentar una clave entre versiones), no autorizaciones para desplegar. Las cinco pruebas sugeridas se añadieron y pasaron. La variable de build aislado queda ignorada en Vercel. La revisión visual de las capturas finales la hizo Codex: Claude revisó código/CSS y declaró no haber visto las capturas; no se atribuye una inspección visual al par.

La salida JSON directa del revisor llegó mal formada pese a exit0. Se conservó la incidencia y se recuperó el resultado final del journal mediante `-RecoverFile`, sin alterar protocolo o lanzador. Usar `revision-claude-recuperada.json`, no el prefijo incompleto `revision-claude-codigo.json`.

## Antes de publicar o probar contra Supabase habitual

1. Obtener autorización de entorno/despliegue y aplicar la octava migración ANTES de publicar este frontend. Actualmente NO está aplicada en la base local habitual, staging ni producción. Un backend antiguo rechazará la escritura v2 y la lectura explícita de la columna nueva; no hay fallback silencioso.
2. Probar el recorrido autenticado completo en ese entorno: crear, releer, replanificar y consultar por roles. No confundir el ensayo PostgreSQL ni demo con este smoke.
3. Durante el cambio de versión, un reintento de clave enviada por v1 desde v2 puede dar SR006. Consultar primero si se creó la actividad; si no existe, iniciar una solicitud nueva. Nunca forzar replay ni duplicar un trabajo a ciegas.
4. Aceptación visual del equipo y dispositivos reales pendientes. En 320px con fuente raíz al200%, la cabecera/navegación compartidas se comprimen; no se rediseñaron esas superficies fuera del corte aprobado. Las pruebas normales de 390px a1920px pasaron.

## Aplazado y preservado

Rol Aunor, sus permisos, pantallas, cantidades, responsables de conformidad y seguimiento contractual NO implementados. Se registró para definir después: lo pactado, lo realizado, reemplazos y evidencias; comunicaciones WhatsApp, llamadas y Google Meet; un acuerdo verbal registrado no equivale a aprobación económica.

No commit, push, despliegue, cambios de goal/protocolo, acceso a secretos ni cambios de cookies/datos de pruebas personales. Los cambios preexistentes de docs/estado.md permanecen. Siguen abiertos los gates técnicos anteriores del Preview autenticado, bootstrap/limpieza autorizada, dispositivos reales, aceptación y producción separada.

## Repetir las comprobaciones

Desde frontend, Windows:

```text
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npx.cmd playwright test --config playwright.historico.config.ts
node scripts/verify-journey-places.mjs
```

Playwright usa el build `.next-historical-test` para no reutilizar el servidor personal. Next regenera automáticamente next-env.d.ts y añade rutas de tipos al tsconfig. El script SQL requiere Docker operativo con el contenedor local, crea un nombre único y nunca se conecta a la base postgres del usuario.
