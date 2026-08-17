# Estado

Tablero actual del proyecto. No es un diario: si algo deja de ser el estado, se reemplaza.

Quien abra solo este archivo debe poder retomar el trabajo sin leer ninguna conversación.

**Actualizado:** 2026-08-17

---

## Lo que pasó el 2026-08-17

El cliente entregó una **versión 2 completa del requerimiento**, con mockups de referencia. Contradice
parte de lo que ya estaba cerrado. Marco ordenó revisarlo y ejecutar los cambios en la Fase 0.

Consecuencia: **la Fase 1 queda suspendida y la Fase 0 vuelve a estar activa.**

| Para entender qué pasó | Archivo |
|---|---|
| El análisis completo y qué se ejecutó | `docs/impacto-requerimiento-v2.md` |
| Las veintidós decisiones que abre | `docs/decisiones-pendientes.md` |
| Por qué ocurrió y qué evitarlo la próxima vez | `docs/incidentes.md` → INC-001 |
| La fuente original | `actualizacion_del_requerimiento/` |

---

## Fase activa

**Fase 0 — Concepción funcional**, reabierta el 2026-08-17.

## Objetivo actual

Cerrar las decisiones que el requerimiento v2 dejó abiertas, para que exista otra vez un producto que
pueda explicarse pantalla por pantalla sin contradecirse.

## Puerta de salida

El producto puede explicarse pantalla por pantalla y recorrido por recorrido sin depender de decisiones
técnicas de backend, y sin decisiones en revisión abiertas.

## Reglas de la fase

No se instala backend, no se crea base de datos, no se configura Supabase y no se implementa
autenticación real. **No se instala ni se andamia la aplicación.** Nada de esto cambió.

---

## Lo que Marco decidió el 2026-08-17

Cuatro de las bifurcaciones grandes están cerradas:

- **D-019 — es un sistema de supervisión.** Se mantienen los siete estados y el ciclo de observación
  completo. Se descartan los modelos de dos y tres estados de los mockups.
- **D-023 — el material va por enlace.** El operario pega el enlace a la carpeta con sus fotos y
  vídeos; la plataforma no almacena archivos. **Simplifica mucho el proyecto** y cierra D-024 y D-036.
- **D-033 — AUNOR ve y opina.** Puede dejar su feedback, pero **no manda sobre los operarios**: si su
  opinión merece corrección, es supervisión de Rhino quien la convierte en observación interna. La
  plataforma la usa Rhino para controlar a su gente; de AUNOR se quiere que esté contento.

Con eso, siete decisiones salieron de revisión y §5, §8, §10 y §11 de la Fase 0 vuelven a estar firmes.

---

## Dos confirmaciones de una línea que Marco debe dar

La segunda auditoría de Codex detectó que D-019 y D-033 registraban como decisión de Marco cosas que
Claude había **deducido** de sus respuestas. Las deducciones son coherentes y quedan como línea base,
pero necesitan una confirmación expresa:

1. **¿Se conservan exactamente los siete estados y sus transiciones?** «Es un sistema de supervisión»
   descarta la bitácora plana, pero no distingue entre los siete estados actuales y el modelo híbrido
   —menos estados visibles, la observación como marca aparte— que la propia D-019 ofrecía.
2. **¿El feedback de AUNOR pasa siempre primero por supervisión, o puede llegar directo al operario?**
   Aunque no cambie ningún estado, un mensaje directo del cliente a un operario funciona en la práctica
   como una orden. Ver D-041.

---

## Siguiente acción

**Bloqueado esperando respuestas del cliente sobre el equipo**, y las dos confirmaciones de arriba.

Ahora que los estados están decididos, lo que más cosas tiene paradas es **saber quién es quién**:

1. **Marco pregunta al cliente por el equipo — D-020, D-021 y D-022.** ¿Chiara y Kiara son la misma
   persona? ¿Martín deja Operaciones? ¿César pasa a Supervisión? ¿Existe «Locuciones»? De esto dependen
   las cuatro decisiones que siguen en revisión: D-001, D-005, D-011 y D-016.
2. **Marco resuelve D-031 (identidad visual)**, que es lo único que desbloquea la Fase 1.
3. **Marco resuelve D-026 (flujo de acceso)** y **D-041 (mecánica del feedback de AUNOR)**. Ninguna de
   las dos espera al cliente.
4. Se añaden a la Fase 0 los criterios de aceptación de lo ya decidido — sobre todo que el feedback de
   AUNOR no cambie estados ni llegue al operario como orden.
5. Se vuelve a cerrar la Fase 0.

**Las demás preguntas para el cliente** siguen en `docs/impacto-requerimiento-v2.md` §7. Dos de ellas ya
no hacen falta: los archivos de 50 MB (resuelto por D-023) y qué mockup vale en los estados (resuelto
por D-019).

---

## Estado de las decisiones

- **Cerradas: 21** — D-001 a D-005, D-007 a D-017, y D-019, D-023, D-024, D-033 y D-036.
- **En revisión: 4** — D-001, D-005, D-011, D-016. Todas por el catálogo de roles y por Burson.
- **Abiertas: 20** — D-006, D-018, D-020, D-021, D-022, D-025, D-026, D-027, D-028, D-029, D-030,
  D-031, D-032, D-034, D-035, D-037, D-038, D-039, D-040, D-041. Once necesitan al cliente; nueve las
  resuelve Marco.
- **Suspendida: 1** — D-018, la dirección visual, hasta cerrar D-031.

---

## Dónde está el trabajo

| Documento | Qué contiene |
|---|---|
| `docs/impacto-requerimiento-v2.md` | Qué cambió con el requerimiento v2, qué se ejecutó y qué corrigió la auditoría |
| `docs/fase-0-concepcion.md` | Qué es el producto. **Reabierta**: nueve secciones marcadas en revisión |
| `docs/fase-1-ux.md` | Pantallas, navegación y patrones. **Suspendida** |
| `docs/decisiones.md` | Las veintiuna cerradas, cuatro de ellas marcadas en revisión |
| `docs/decisiones-pendientes.md` | Las veinte abiertas, con quién debe contestar cada una |
| `docs/incidentes.md` | INC-001 |
| `docs/encargos/` | Los contratos que ejecuta Codex |
| `diseno/` | Las ocho maquetas de dirección visual |
| `actualizacion_del_requerimiento/` | Ficha v2 en PDF y los tres mockups del cliente |

---

## La Fase 1, suspendida

**El trabajo no se tira.** Las ocho direcciones visuales se conservan enteras y verificadas. Lo que se
suspende es **elegir entre ellas**, porque se encargaron sin saber que la marca ya estaba restringida a
la identidad visual de AUNOR.

La dirección **D · Nocturna** es la más cercana al lenguaje de los mockups del cliente —azul marino muy
oscuro, color solo como señal—, así que adaptarla es una salida real y no hay que darla por perdida.

**No se retoca ninguna maqueta ni se encarga una novena mientras D-031 esté abierta.**

### Las ocho direcciones

| | Dirección | Archivo | Enlace publicado |
|---|---|---|---|
| A | Operativa — tipografía de sistema, bordes duros, ámbar sobre azul marino | `diseno/direccion-a.html` | https://claude.ai/code/artifact/c46869ef-01f6-460b-aa2b-567def7da17d |
| B | Editorial — Georgia serif, crema y coral, formas asimétricas | `diseno/direccion-b.html` | https://claude.ai/code/artifact/d34b8d4a-2939-46d6-a398-b8d8a4335364 |
| C | Institucional — Arial, azul y gris, casi tabular | `diseno/direccion-c.html` | https://claude.ai/code/artifact/c10b26b6-38f6-4667-96c2-e560d800c020 |
| D | Nocturna — oscura, color solo como señal de atención | `diseno/direccion-d.html` | https://claude.ai/code/artifact/e4493509-56e2-488b-8f8b-d4ae69f10149 |
| E | Señalética — Arial Narrow, amarillo y negro, franjas | `diseno/direccion-e.html` | https://claude.ai/code/artifact/67982198-9488-4a56-98b2-7b10a82bc7b8 |
| F | Minimalista, calma — mucho aire, esquinas redondeadas, acento índigo único | `diseno/direccion-f.html` | https://claude.ai/code/artifact/b6d27a51-3eec-4ff3-9a54-2da0e2445027 |
| G | Cálida, humana — tonos tierra, formas orgánicas, sin negro puro | `diseno/direccion-g.html` | https://claude.ai/code/artifact/8f690e99-3dd0-40f3-8169-811d47bf32bd |
| H | Técnica, densa — monoespaciada, grilla apretada, acento verde de señal | `diseno/direccion-h.html` | https://claude.ai/code/artifact/5ae7a8e3-a274-4355-a2a9-dea3d74a8db9 |

Las páginas son privadas. Para republicar una tras cambiar su HTML hay que regenerar la copia sin
`<!doctype>`, `<html>`, `<head>` ni `<body>` y volver a publicarla con la misma ruta de archivo, que es
lo que conserva el enlace.

---

## Contrato vigente

Ninguno. La Fase 0 no produce código.

## Estado de las instalaciones

Nada instalado y nada andamiado. El stack de **STACK — Frontend** queda autorizado al abrir la Fase 2.
El de **STACK — Backend**, al abrir la Fase 4.

---

## Fases cerradas

Ninguna. La Fase 0 se cerró el 2026-08-12 y **se reabrió el 2026-08-17**.

Su cierre original ya llevaba la advertencia de que el documento se había derivado de `CLAUDE.md` y no
de observar cómo trabajan Johann, Eduardo, Chiara y Martín. El requerimiento v2 confirmó ese riesgo:
ver `docs/incidentes.md` → INC-001.
