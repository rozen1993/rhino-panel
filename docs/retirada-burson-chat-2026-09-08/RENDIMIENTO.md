# Revisión breve de rendimiento — 2026-09-09

Marco aprobó el preview y pidió revisar una pequeña demora antes de continuar con respaldo y publicación.

Skill performance: se midió primero; no se cambió el diseño, la caché de información privada ni la autoridad del servidor para mejorar artificialmente tiempos.

Medición con Playwright, navegador efímero sin extensiones/perfil/cookies del usuario. Script reproducible: frontend/scripts/check-local-performance.mjs. No se modificó el servidor del puerto 3000.

| Página / proceso | TTFB | DOMContentLoaded |
| --- | ---: | ---: |
| Acceso 3108, primera navegación | 131 ms | 233 ms |
| Acceso 3108, segunda navegación | 8 ms | 24 ms |
| Acceso 3108, tercera navegación | 10 ms | 22 ms |
| Panel Aunor 3108, sesión demo | 48 ms | 221 ms |
| Contrato 3108, sesión demo | 29 ms | 60 ms |
| Calendario Aunor 3108, sesión demo | 89 ms | 141 ms |
| Acceso 3000, primera navegación | 1213 ms | 1449 ms |
| Acceso 3000, segunda navegación | 250 ms | 295 ms |
| Acceso 3000, tercera navegación | 118 ms | 164 ms |

3108 usa next start sobre build aislado. La diferencia apunta al proceso/compilación y calentamiento del entorno 3000; no prueba por sí sola la causa de toda interacción lenta. No hay medición equivalente de la versión antigua para afirmar una regresión o un porcentaje de mejora. DOMContentLoaded no equivale a LCP, INP ni carga total. Recursos de navegaciones autenticadas estaban en caché; sus transferencias cero no significan ausencia de peso.

No se reprodujo una demora significativa en las páginas del preview compilado con estos ejemplos pequeños. No se aplicó una optimización especulativa de código. Si ocurre en 3108, registrar pantalla y acción exactas; medir con datos reales antes de declarar resuelto el rendimiento de producción.

Recomendación inmediata: revisar en http://127.0.0.1:3108/acceso, preferiblemente en ventana privada. No comparar la primera compilación de desarrollo con un build ya preparado.

## Paso de publicación

Se prepara commit local de los cambios aprobados y esta evidencia. La rama actual es equipo; master está separada. El proyecto Supabase enlazado es fzbpqgjrdreefontqmnf y Vercel es rhino-panel. Los documentos anteriores limitaban cambios remotos a staging: confirmar ese destino antes de aplicar migraciones que desactivan cuentas. Un commit Git no respalda el contenido de Supabase ni revierte una migración aplicada.
