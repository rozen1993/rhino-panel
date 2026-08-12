# Estado

Tablero actual del proyecto. No es un diario: si algo deja de ser el estado, se reemplaza.

Quien abra solo este archivo debe poder retomar el trabajo sin leer ninguna conversación.

**Actualizado:** 2026-08-12

---

## Fase activa

**Fase 1 — UX y desarrollo visual** (Bloque A — Frontend)

## Objetivo actual

Decidir cómo se verá y cómo se usará: arquitectura de información, navegación, wireframes,
formularios, vistas de móvil y escritorio, pantalla de AUNOR, supervisión, módulo Burson, estados
vacíos, de error y de carga, sistema de diseño y dirección visual definitiva.

## Puerta de salida

Marco aprueba la dirección visual y entiende todos los recorridos principales desde las pantallas.

## Reglas de la fase

Mobile-first. No se instala backend, no se crea base de datos, no se configura Supabase y no se
implementa autenticación real. **No se instala ni se andamia la aplicación**: la Fase 1 produce diseño,
no código de producto.

---

## Dónde está el trabajo

| Documento | Qué contiene |
|---|---|
| `docs/fase-0-concepcion.md` | Qué es el producto: alcance, roles, campos, estados, 10 recorridos, 9 pantallas, 29 criterios de aceptación |
| `docs/fase-1-ux.md` | Inventario de pantallas, arquitectura de información, navegación y patrones transversales |
| `docs/decisiones.md` | Las 17 decisiones cerradas, con sus consecuencias |
| `docs/decisiones-pendientes.md` | Lo que espera a Marco |
| `docs/encargos/` | Los contratos que ejecuta Codex |
| `diseno/` | Las cinco maquetas HTML de dirección visual |

---

## Lo entregado en la Fase 1

**E-001 y E-002** — cinco direcciones visuales, cada una con muestrario, P-2 Mis actividades, P-3
detalle de una actividad Observada y P-4 formulario de grabación. Contenido literalmente idéntico entre
las cinco: lo único que cambia es el lenguaje visual.

**E-003** — corrigió los muestrarios de C, D y E, que declaraban la paleta de la dirección A.

Verificado por Claude, no por el informe de Codex: sin recursos externos, sin andamiaje, los siete
estados presentes en las cinco, ninguna acción de supervisión visible, y los hexadecimales declarados
existen en el CSS de su propio archivo.

### Las cinco direcciones

| | Dirección | Archivo | Enlace publicado |
|---|---|---|---|
| A | Operativa — tipografía de sistema, bordes duros, ámbar sobre azul marino | `diseno/direccion-a.html` | https://claude.ai/code/artifact/c46869ef-01f6-460b-aa2b-567def7da17d |
| B | Editorial — Georgia serif, crema y coral, formas asimétricas | `diseno/direccion-b.html` | https://claude.ai/code/artifact/d34b8d4a-2939-46d6-a398-b8d8a4335364 |
| C | Institucional — Arial, azul y gris, casi tabular | `diseno/direccion-c.html` | https://claude.ai/code/artifact/c10b26b6-38f6-4667-96c2-e560d800c020 |
| D | Nocturna — oscura, color solo como señal de atención | `diseno/direccion-d.html` | https://claude.ai/code/artifact/e4493509-56e2-488b-8f8b-d4ae69f10149 |
| E | Señalética — Arial Narrow, amarillo y negro, franjas | `diseno/direccion-e.html` | https://claude.ai/code/artifact/67982198-9488-4a56-98b2-7b10a82bc7b8 |

Las páginas son privadas. Para republicar una tras cambiar su HTML hay que regenerar la copia sin
`<!doctype>`, `<html>`, `<head>` ni `<body>` y volver a publicarla con la misma ruta de archivo, que es
lo que conserva el enlace.

---

## Siguiente acción

**Bloqueado esperando a Marco: elegir dirección visual** — D-018 en `docs/decisiones-pendientes.md`.

En cuanto elija:

1. Encargo a Codex los wireframes de las nueve pantallas en ese lenguaje, en móvil y escritorio.
2. Se congela el sistema de diseño en `docs/sistema-diseno.md`.
3. Se cierra la puerta de la Fase 1.

Los wireframes tienen tres obligaciones heredadas de decisiones ya tomadas, detalladas en
`docs/fase-1-ux.md` §4: el detalle muestra cuándo se modificó por última vez (D-007); el panel de
supervisión destaca las observaciones respondidas y pendientes de cerrar (D-015); y la navegación
cambia según el rol (D-011, D-016).

### Pendiente menor, no bloquea

Marco preguntó por enlaces públicos que pueda ver cualquiera. Se comprobó que **el CLI de Codex no
puede hospedar nada** —no existe tal subcomando, confirmado por el propio Codex— y que las vías reales
son: compartir cada página publicada desde su menú de compartir, o arrastrar la carpeta `diseno/` a
Netlify Drop o Cloudflare Pages desde el navegador, sin instalar nada. Vercel queda para el despliegue
real del proyecto, que es Fase 9.

---

## Contrato vigente

Ninguno. La Fase 1 no produce código de producto.

## Estado de las instalaciones

Nada instalado y nada andamiado. El stack de **STACK — Frontend** queda autorizado al abrir la Fase 2.
El de **STACK — Backend**, al abrir la Fase 4.

---

## Fases cerradas

**Fase 0 — Concepción funcional.** Cerrada el 2026-08-12 por decisión de Marco, que dio la fase por
pasada sin la validación línea por línea de `docs/fase-0-concepcion.md` que se le había propuesto. El
documento se derivó de `CLAUDE.md`, no de observar cómo trabajan Johann, Eduardo, Chiara y Martín. Si
al ver las pantallas aparece algo que no coincide con la operación real, se corrige entonces y se anota
como incidente.
