# Pipeline `astro`

Especializa Claudex para transformar fuentes heterogéneas en componentes Astro + Tailwind reutilizables. Este pipeline define criterios, fases y entregables; el modo `decide|execute|review` sigue gobernando los permisos.

## Contrato

La salida debe integrarse en un proyecto Astro receptor sin depender de la página de demostración, la marca original, rutas fijas, IDs globales, estado global ni efectos sobre `html` o `body` que no estén declarados y coordinados.

Tailwind es el destino principal para estructura, responsive y estados. El CSS local con alcance es válido cuando expresa mejor animaciones, propiedades registradas, pseudo-elementos, selectores complejos, valores calculados o comportamiento de `prefers-reduced-motion`.

No conviertas mecánicamente un archivo de distribución. Primero identifica o reconstruye la fuente semántica.

## Comportamiento por modo

- `decide --pipeline astro`: solo lectura. Entrega clasificación, fronteras propuestas, API, estrategia de interactividad, riesgos y gates.
- `execute --pipeline astro`: el anfitrión es el único escritor. Extrae o transforma, implementa, prueba y solicita review independiente.
- `review --pipeline astro`: solo lectura. Audita una componización existente y prioriza hallazgos con evidencia; no corrige.

## Clasificación de entrada

Asigna una clase antes de proponer archivos:

| Clase | `input_class` | Entrada | Tratamiento inicial |
|---|---|---|---|
| A | `flat-source` | HTML/CSS/JS fuente | Normalizar y definir fronteras. |
| B | `bundled-artifact` | Bundle, export o artefacto autónomo | Bloquear conversión directa; localizar manifest, template, source maps o fuente embebida. |
| C | `framework-source` | Proyecto o componente React/Vue/Svelte/otro | Decidir si conservar como isla o portar a Astro/DOM nativo. |
| D | `structured-component` | Componente ya estructurado | Auditar API, estilos, dependencias e instancias múltiples. |
| E | `application` | Página o aplicación completa | Separar demo, layout, contenido y unidades reutilizables antes de migrar. |
| F | `server-data-coupled` | Integración acoplada a servidor o datos | Extraer contratos y adaptadores; no inventar servicios ni credenciales. |

Si la clase es ambigua y cambia materialmente la estrategia, inspecciona evidencia adicional antes de escribir. Registra en `input_class` el valor semántico de la segunda columna, no la letra. Usa `not-applicable` fuera de una clasificación Astro.

## Pipeline

### 1. Inventariar

- Identifica runtimes, frameworks, dependencias, assets, fuentes, rutas, datos, estado, eventos y efectos globales.
- Distingue código fuente de wrappers, loaders, bundles y páginas de demostración.
- Para assets embebidos, registra procedencia y derechos conocidos. No atribuyas una licencia sin evidencia.

### 2. Abrir la compuerta de fuente

Para clase B, no conviertas el runtime de distribución. Extrae la plantilla, estilos, lógica y assets semánticos. Si la fuente no puede recuperarse, reconstruye desde el comportamiento observable y declara la pérdida de trazabilidad. Captura una línea base visual y funcional antes de continuar.

### 3. Definir fronteras

Separa la unidad reutilizable de la página, hero, layout, branding, contenido editorial, CTA y fixtures. Divide componentes solo cuando tengan contrato, reutilización o ciclo de vida propios; evita fragmentación ceremonial.

### 4. Diseñar la API

Usa según corresponda:

- `Astro.props` tipadas con TypeScript;
- slots para contenido compuesto;
- arrays/objetos serializables para colecciones;
- variables CSS para tokens y tematización dinámica;
- atributos `data-*` para trasladar datos serializables al navegador;
- IDs únicos por instancia;
- eventos DOM o callbacks del framework solo cuando el consumidor los necesite.

Declara valores predeterminados, campos requeridos, dependencias, eventos, slots y límites. No fijes rutas, texto, marca o números de contacto del ejemplo dentro de la unidad reusable.

### 5. Elegir interactividad mínima

Aplica esta escalera y detente en el primer nivel suficiente:

1. `.astro` estático, sin JavaScript cliente.
2. `.astro` con `<script>` procesado y DOM nativo.
3. Custom element cuando cada instancia necesite encapsulación y ciclo de vida.
4. Componente de framework hidratado con `client:load`, `client:idle`, `client:visible` o `client:media` según prioridad demostrable.

Los scripts procesados de Astro se deduplican por página: no supongas que se ejecutan una vez por instancia. Inicializa todas las raíces pertinentes o usa un custom element. Implementa cleanup para listeners, observers, timers y bloqueos globales. No apliques `client:*` a un componente `.astro`; esas directivas hidratan componentes de UI frameworks.

### 6. Migrar estilos

- Usa Tailwind para layout, espaciado, tipografía, responsive, estados simples y utilidades repetibles.
- Usa variables CSS para colores, escalas, radios, tiempos y geometría configurables.
- Conserva CSS local con alcance para `@keyframes`, `@property`, pseudo-elementos, selectores relacionales/complejos, cálculos y reduced motion.
- No conviertas estilos a cadenas de utilidades arbitrarias si empeoran mantenibilidad o parametrización.
- Detecta las versiones del proyecto receptor. En Tailwind 4 usa su plugin de Vite; `@astrojs/tailwind` se reserva para proyectos heredados con Tailwind 3.

### 7. Eliminar acoplamientos

- Encapsula selectores por raíz de componente.
- Evita IDs constantes y consultas globales que colisionen.
- Coordina cualquier efecto inevitable sobre `body` —por ejemplo scroll lock— entre instancias y restaura exactamente el estado previo.
- Haz abortables o desmontables los listeners globales.
- No navegues, hagas fetch ni accedas a almacenamiento sin que el contrato lo requiera.

### 8. Implementar artefactos

Entrega solo lo necesario, normalmente:

- componente(s) `.astro`;
- controlador `.ts` o componente de framework únicamente si está justificado;
- tipos y tokens;
- demo mínima aislada del componente;
- contrato de integración con props, slots, eventos y dependencias;
- pruebas y notas de compatibilidad.

No crees un proyecto Astro completo cuando el usuario pidió un componente para un proyecto existente.

### 9. Verificar

Adapta los comandos al repositorio y conserva evidencia:

- build y typecheck;
- paridad funcional y visual contra la línea base;
- responsive en los tamaños relevantes;
- teclado, foco, semántica, contraste y reduced motion;
- dos instancias simultáneas e independientes;
- ausencia de IDs, listeners y estilos globales no declarados;
- presupuesto de JavaScript y justificación de cada isla;
- arranque en un receptor Astro limpio cuando el alcance lo permita;
- procedencia de assets y fuentes de clase B.

### 10. Revisar y entregar

Solicita review independiente con el contrato, el diff y los resultados de las comprobaciones. Corrige hallazgos válidos y repite los gates afectados. Informa artefactos, integración, evidencia y riesgos residuales.

## Encadenamiento con `refine`

- Clases A, C y D: ejecuta un triaje breve; si hay deuda material, `refine` y después `astro`.
- Clase B: extracción semántica de `astro`, luego `refine` sobre la fuente recuperada y finalmente la componización `astro`.
- Omite `refine` cuando no haya deuda material o la entrada ya tenga una línea base, pruebas y calidad suficientes. Los gates propios de `astro` nunca se omiten.
