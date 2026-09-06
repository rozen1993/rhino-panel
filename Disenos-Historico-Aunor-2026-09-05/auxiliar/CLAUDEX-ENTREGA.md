# Registro Claudex — entrega visual

- Fecha: 2026-09-05.
- Invocación: `$claudex o/max execute --pipeline core`.
- Límite: maquetas PNG y auxiliares en esta carpeta nueva. Sin implementación en la aplicación.
- Base: `Revision-Visual-2026-09-05/RECOMENDACION.md` y sus capturas reales.
- Escritor único: Codex. Claude Code: inspección independiente, solo lectura.
- Decisión de diseño ya disponible; se reservó al par para revisar los resultados. No se repitió la auditoría ni se reabrió la decisión.
- Versión vigente: `png-aprobacion/`. La galería enlaza exclusivamente a esa versión.

## Claude operativo y acceso visual

La prueba real mediante el lanzador oficial terminó con código 0 y salida estructurada válida. Claude abrió con Read la captura real del Histórico y describió correctamente su contenido. Evidencia: [claude-operativo.json](claude-operativo.json).

No se utilizó el navegador personal ni la extensión de Chrome. El acceso visual de Claude en este encargo fue a imágenes guardadas, a través del lanzador. Los renderizados de Codex se hicieron con Playwright/Chrome en contextos nuevos offline, sobre HTML local y sin la aplicación.

## Revisión 1

[Salida íntegra](claude-revision-01.json). Finalizó con código 0. Revisó las 14 maquetas principales y tres referencias reales.

Observaciones corregidas:
- Alta: B y C se parecían demasiado en móvil. C ahora mantiene la costura diagonal.
- Media: G-DEMO-01 tenía distinto título entre pantallas. Ahora conserva el mismo título.
- Baja: un rótulo sobre foto tenía poca separación visual. Se reforzó el velado oscuro móvil.
- Límite de captura: se añadió el PNG 15 con la ficha móvil desplazada.

## Revisión final limpia

Nueva invocación independiente, fase review, perfil o/max, pipeline core, contexto project sin persistencia y solo lectura. [Paquete neutral](contrato-revision-final.md) · [Salida íntegra](claude-revision-final.json).

Resultado real de Claude: **APROBABLE CON CORRECCIONES MENORES**. Confirmó que el hallazgo alto quedó resuelto, fidelidad del shell, distinción A/B/C en ambos tamaños, legibilidad de las fotos, doce meses, recuentos y ausencia de aprobaciones contractuales inventadas. Abrió los PNG 01–15 y el complemento 17, más las tres referencias. No afirmó una auditoría integral de accesibilidad.

Correcciones menores posteriores, aplicadas únicamente a maquetas:
1. E-DEMO-01 mantiene «Edición de pieza ilustrativa» en Aunor; «Trabajo sin referencia identificada» pasó a descripción.
2. G-DEMO-02 se llama «Cobertura ilustrativa Sur», coherente con su sede. Los códigos siguen siendo la identidad estable: el sistema no debería exigir títulos únicos.
3. PNG 11 se exportó con viewport de escritorio de 1440 × 1440 para mostrar la opinión y el enlace de material completos, sin cambiar el panel aprobado.

PNG modificados tras esa revisión: 00-comparativa-entradas.png, 05-C-entrada-escritorio.png, 11-coincidencias-escritorio.png, 12-coincidencias-movil.png, 13-aunor-escritorio.png, 14-aunor-movil.png. Los demás mantienen exactamente el mismo SHA-256 que la versión inspeccionada por Claude.

El HTML de 05-C es idéntico byte por byte al de la versión revisada (SHA-256 49903E239E0FED85D4765986B8EE24127B842708E906222629EDF6E10A360A8C): su diferencia de PNG proviene de la nueva rasterización, no de una modificación de contenido o diseño. Se abrió y verificó visualmente también esa nueva exportación; la comparativa 00 la incorpora.

Se verificaron de nuevo todos los PNG, imágenes, enlaces, meses, ausencia de overflow y copias de componentes. Un segundo agente Codex de solo lectura abrió los PNG 11, 13 y 14 y confirmó las tres correcciones. La observación de captura fue verificada además visualmente por el escritor.

No se atribuye a Claude una tercera aprobación inexistente. Conforme al protocolo, las observaciones menores se corrigieron y verificaron; el hallazgo alto sí tuvo una revisión final limpia. La aprobación de producto sigue correspondiendo a Marco.

## Evidencia de cierre

[Manifiesto final, SHA-256 y pruebas](entrega-aprobacion-verificacion.json).

- 18 PNG finales válidos.
- 18 enlaces de galería existentes y todas las imágenes cargadas.
- Cuatro destinos con doce meses; seis DOM de histórico con doce meses.
- Sin errores de página, desbordamientos horizontales o peticiones de red durante la exportación verificada.
- Catorce copias de componentes, utilidades y CSS coinciden con sus originales.
- Ninguna modificación de código de aplicación, datos, cookies, goal o protocolo; ningún commit o despliegue.
- Se preservó el cambio preexistente en `docs/estado.md` y las carpetas de propuestas/revisión anteriores.

Estos PNG no prueban permisos, RLS, comportamiento de la aplicación, conformidad del cliente o autorización económica.

## Recuperación del lanzador

Journals originales del lanzador:
- Operatividad: `claudex-20260905T103423665Z-76136067b95448b1aed3af6bdbab8f52.jsonl`.
- Revisión 1: `claudex-20260905T105658931Z-36957d1202a94eafb9f9599d18c6d583.jsonl`.
- Revisión final limpia: `claudex-20260905T110831066Z-cd256937b70e40499469db20c8f10257.jsonl`.

Ubicación original: `C:\Users\MARCO\AppData\Local\Claudex\recovery\`. Las respuestas finales también quedan conservadas en los JSON de esta carpeta. No hubo recuperación parcial presentada como resultado completo.

**Punto de parada: entrega para aprobación visual de Marco.**
