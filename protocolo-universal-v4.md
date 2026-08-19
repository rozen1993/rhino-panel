# PROTOCOLO UNIVERSAL DE TRABAJO — v4.1

Metodología reusable de Marco Vargas para trabajar con Claude como arquitecto/orquestador y Codex como ejecutante/revisor, manteniendo a Marco como único decisor.

El protocolo gobierna cómo se trabaja. Cada proyecto define en su propio CLAUDE.md qué se construye, con qué stack y en qué fases.

---

## 1. JERARQUÍA

Cuando dos instrucciones chocan, gana la de mayor nivel:

1. decisión explícita de Marco;
2. este protocolo universal;
3. CLAUDE.md del proyecto;
4. contratos y documentos de la fase activa;
5. implementación existente.

Si Marco cambia una decisión, el cambio debe terminar en un archivo durable. El chat no es fuente de verdad.

---

## 2. PRINCIPIOS

### 1. Marco decide

Ninguna IA decide alcance, entregable, prioridades, cambios de fase ni aceptación final.

Las IAs pueden proponer. Marco decide.

### 2. Claude gobierna; Codex produce volumen

**Claude:**

- descompone;
- modela;
- escribe contratos;
- define criterios de aceptación;
- concentra la revisión en riesgo.

**Codex:**

- implementa;
- genera volumen;
- escribe pruebas;
- hace migraciones/refactors;
- realiza una segunda revisión independiente.

Señal de incumplimiento: si Claude está escribiendo implementación rutinaria durante varios archivos seguidos, revisar la división de trabajo.

### 3. Una sola fase activa

El proyecto define sus propias fases. Solo una está activa.

No se ejecuta trabajo de una fase futura "para dejarlo listo" si la fase actual no lo autoriza.

### 4. El artefacto más barato para decidir

Si Marco necesita elegir, producir primero el artefacto mínimo que permita tomar la decisión.

No construir una aplicación cuando basta un boceto. No producir cinco alternativas si dos permiten decidir.

### 5. Las instalaciones tienen frontera

Una tecnología incluida en el stack aprobado del proyecto queda autorizada únicamente desde la fase que permite construcción.

Fuera de ese stack:

- una dependencia que cambia arquitectura, seguridad, datos o infraestructura requiere aprobación;
- una dependencia pequeña y reversible solo se justifica si resuelve una necesidad ya aprobada y no duplica capacidades existentes.

Durante fases que prohíben construcción no se instala ni se andamia.

### 6. El archivo es la interfaz

Las IAs no deben depender de recordar conversaciones anteriores.

Si algo importa mañana, se guarda hoy:

- contexto;
- contrato;
- decisiones;
- estado;
- pruebas;
- arquitectura.

Los prompts apuntan a rutas; no repiten documentos enteros.

### 7. Verificar con evidencia

No revisar volumen leyendo volumen.

Preferir tipos, lint, pruebas, build, consultas dirigidas, `git diff --stat` y la revisión de Codex. La lectura humana se reserva para donde exista riesgo o fallo. El tipo de evidencia se elige según el riesgo (§10).

Cada proyecto debe aspirar a un comando único de verificación, por ejemplo `npm run verify`.

### 8. No inventar decisiones

Distinguir dos clases de incertidumbre:

**Bloqueante:** cambia contrato, datos, permisos, seguridad, UX acordada, dependencia importante o alcance.
→ Detener esa línea de trabajo y registrar la duda en la cola de decisiones con opciones y consecuencias.

Detener la línea no es detener la sesión. Si dentro de la fase activa queda trabajo autorizado que no dependa de esa decisión, se continúa por ahí. Lo que nunca se hace es construir encima de una decisión no tomada, ni elegir por Marco para no interrumpirlo.

Marco resuelve la cola en lote. Lo resuelto pasa a `decisiones.md` y desaparece de la cola.

**Local y reversible:** detalle de implementación dentro del contrato, sin consecuencias externas.
→ Elegir la opción más simple, registrar la decisión si puede importar después y continuar.

---

## 3. ROLES

| Rol | Responsable | Función |
|---|---|---|
| Decisor | Marco | Alcance, aceptación, fase activa y decisiones de producto |
| Arquitecto/orquestador | Claude | Modelos, contratos, criterios, coordinación y revisión de riesgo |
| Ejecutante | Codex | Código, pruebas, migraciones, componentes y refactors |
| Revisor independiente | Codex, segunda pasada | Contrastar implementación contra contrato |
| Segunda opinión | Codex read-only | Resolver decisiones difíciles sin contaminar la primera derivación |

Claude puede ejecutar acciones pequeñas cuando hacerlo sea claramente más barato que delegar, pero no debe convertirse en el productor rutinario de volumen.

---

## 4. ESTADO DURABLE

Cada proyecto decide sus archivos, pero debe existir una forma inequívoca de saber:

- qué fase está activa;
- cuál es el objetivo actual;
- qué contrato rige;
- qué decisiones ya están cerradas;
- qué decisiones están esperando a Marco;
- qué queda para pasar la puerta de salida.

Patrón recomendado:

```
CLAUDE.md
docs/
  estado.md
  decisiones.md
  decisiones-pendientes.md
  incidentes.md
  ...
```

- `docs/estado.md` debe ser corto. No es un diario; es el tablero actual.
- `docs/decisiones-pendientes.md` es la cola de decisiones de Marco (principio 8). Cada entrada lleva: qué bloquea, opciones y consecuencias.
- `docs/incidentes.md` alimenta el ciclo de automejora (§12). Sin él, la bitácora conserva el cambio y pierde la razón del cambio.

Un proyecto pequeño puede mantener estos contenidos como secciones de un solo archivo. Lo que no es opcional es poder responder las preguntas anteriores sin releer el chat.

---

## 5. CONTRATO DE ENCARGO A CODEX

Cada encargo usa estos bloques:

```
0. ANTES DE EJECUTAR
   Qué entendiste.
   Qué producirás y dónde.
   Qué crearás/instalarás fuera de esas rutas.
   Qué duda bloqueante existe, si alguna.

1. CONTEXTO
   Archivos concretos que debe leer.

2. TAREA
   Resultado único que debe producir.

3. CONTRATO
   Comportamiento, tipos, nombres, esquemas o interfaces que no puede reinterpretar.

4. FRONTERAS
   Archivos permitidos.
   Archivos prohibidos.
   Efectos externos permitidos.

5. VERIFICACIÓN
   Comandos y criterios exactos que deben quedar verdes.
   Los casos que deben cubrirse salen del contrato y se fijan antes de implementar:
   Claude define qué debe probarse; Codex escribe el código de prueba.

6. REPORTE
   Resumen corto:
   - resultado;
   - archivos tocados;
   - verificación;
   - decisiones locales;
   - dudas/riesgos restantes.
```

**Regla de cierre:**

Si falta una decisión bloqueante, detente y pregunta. No inventes requisitos. Si es un detalle local, reversible y cubierto por el contrato, usa la solución más simple.

### Formato OCRAV

Todo encargo se escribe con estos cinco bloques, en este orden:

| | Bloque | La pregunta que responde |
|---|---|---|
| **O** | Objetivo | ¿Qué queremos conseguir? |
| **C** | Contexto | ¿Qué necesita saber? |
| **R** | Restricciones | ¿Qué NO debe hacer? |
| **A** | Aceptación | ¿Cómo sabemos que funciona? |
| **V** | Verificación | ¿Cómo debe comprobarlo? |

El principio detrás: **cada cosa que el encargo no diga es una decisión que se cede al agente**. Si un bloque queda vago —sobre todo Restricciones y Aceptación— la tarea todavía no está bien acotada.

Cuando el encargo toque diseño, **se adjunta la imagen del diseño aprobado**. No basta con nombrar el archivo ni describirlo con palabras.

### El encargo se audita antes de ejecutarse

**Ningún encargo va directo a ejecución.** El orden es obligatorio:

1. Se escribe el encargo en OCRAV.
2. **Se manda al ejecutante en modo lectura para que lo audite**, con la imagen del diseño aprobado si corresponde.
3. Quien escribió el encargo **verifica** la auditoría: no la acepta sin comprobar lo comprobable.
4. Se corrige el encargo con lo que la auditoría encontró.
5. **Solo entonces** se manda a ejecutar.

El motivo es empírico: varios encargos han fallado **por defectos del contrato, no de la ejecución**. Un contrato pidió dibujar una acción que violaba una regla del propio producto, y el ejecutante obedeció porque el contrato lo decía. Otro no fijó el contenido y el resultado inventó el negocio equivocado. Auditar el encargo cuesta una fracción de lo que cuesta rehacer el trabajo.

El ejecutante **arranca en blanco en cada llamada**: no recuerda la conversación ni encargos previos. Tanto la auditoría como la ejecución necesitan un prompt autosuficiente.

---

## 6. CICLO ESTÁNDAR

1. Marco fija objetivo + fase.
2. Claude lee el estado durable.
3. Claude produce/actualiza el contrato.
4. Marco aprueba cuando hay una decisión humana.
5. Contrato guardado + árbol limpio.
6. Codex ejecuta.
7. Verificación automática.
8. Si falla, clasificar el fallo.
9. Si pasa, Codex revisa contra contrato.
10. Claude lee el informe y las zonas de riesgo.
11. Marco prueba la puerta de salida.
12. Merge/commit.
13. Actualizar estado y decisiones.
14. Abrir la siguiente unidad solo si corresponde.

La parada humana obligatoria existe cuando hay que decidir, no simplemente por completar un trámite.

### Vía corta

El ciclo completo existe para el riesgo, no para el trámite. Un proceso que no escala hacia abajo termina saltándose entero.

Un cambio que **no toca** contrato, datos, permisos, seguridad, UX acordada ni dependencias puede recorrer una vía corta.

**Nunca se omite:**

- encargo con tarea, contrato, fronteras y verificación —pueden ser tres líneas cada uno—;
- árbol limpio antes de delegar;
- verificación automática en verde;
- actualización del estado durable si cambió algo que importe mañana.

**Puede omitirse en vía corta:**

- aprobación previa de Marco (paso 4);
- segunda revisión de Codex (paso 9);
- lectura de riesgo de Claude (paso 10);
- prueba de puerta de salida unidad por unidad — Marco valida el lote (paso 11).

La vía corta la habilita el riesgo, nunca la prisa. Si durante la ejecución aparece cualquiera de los toques anteriores, se detiene y se vuelve al ciclo completo. Ante la duda de si aplica, no aplica.

---

## 7. FALLOS Y ESCALAMIENTO

### Fallo de contrato

Síntomas:

- Codex entendió otra cosa;
- faltaba una regla;
- la especificación admite dos interpretaciones;
- el resultado incumple criterios aun con entorno correcto.

Acción, con techo:

1. **Primer fallo:** devolver a Codex una vez con evidencia del fallo, mismo contrato.
2. **Segundo fallo:** Claude corrige el contrato —no el encargo— y se reintenta.
3. **Tercer fallo:** alto. Revertir al último estado verde en lugar de seguir reparando encima. A la tercera, el problema ya no es la redacción: casi siempre la unidad está mal cortada o hay un fallo de producto encubierto. Claude propone re-alcance —dividir la unidad o cambiar el enfoque— y Marco decide.

Tres fallos sobre el mismo contrato son, por definición, un incidente registrable (§12).

### Fallo de entorno

Síntomas:

- sandbox;
- permisos;
- credenciales;
- red;
- binario ausente;
- servicio externo no disponible.

Acción:

- escalar en el primer fallo;
- no gastar iteraciones reescribiendo el encargo.

### Fallo de producto

La implementación expone una decisión no tomada sobre alcance, UX, datos, permisos o seguridad.

Acción:

- detener;
- Claude formula opciones y consecuencias;
- Marco decide;
- actualizar contrato antes de continuar.

---

## 8. GIT Y FRONTERAS

- `git init` desde el comienzo de un proyecto que producirá archivos.
- Antes de delegar escritura, proteger el trabajo anterior con commit o rama.
- Una tarea debe producir un diff atribuible. Un lote de vía corta también.
- No mezclar una tarea con refactors no solicitados.
- Las fronteras de archivos pueden variar por proyecto; deben declararse cuando el riesgo de pisarse exista.
- Preferir cambios pequeños que puedan revisarse, revertirse y probarse de forma independiente.

---

## 9. ECONOMÍA DE CONTEXTO

### Claude no escribe volumen

Delegar implementación rutinaria cuando el contrato ya está claro.

### Claude no lee volumen

Leer:

- contratos;
- interfaces;
- modelos;
- permisos;
- autenticación;
- migraciones;
- datos sensibles;
- informes de fallos;
- zonas marcadas por revisión.

No leer por rutina cientos de líneas que ya tienen evidencia mecánica y revisión independiente.

### Codex reporta corto

La implementación vive en archivos. El chat debe contener resultado, evidencia, decisiones y riesgos, no volcados de código.

### Contexto por punteros

Prompts cortos que indiquen rutas de archivos.

### Consultas dirigidas

Antes de abrir archivos completos:

- buscar símbolos;
- usar `git diff --stat`;
- revisar tests fallidos;
- inspeccionar líneas concretas.

---

## 10. VERIFICACIÓN Y FUENTES EXTERNAS

La evidencia debe corresponder al riesgo:

- tipos para contratos estáticos;
- tests unitarios para reglas;
- integración para límites entre módulos/servicios;
- E2E para recorridos reales;
- pruebas negativas para permisos;
- restauración real para backups;
- build para empaquetado.

Para frameworks, APIs, servicios o CLIs versionados, la documentación oficial de la versión usada es la fuente técnica preferente. La memoria de una IA no reemplaza verificar una interfaz que puede haber cambiado.

---

## 11. MODOS ESPECIALES

### Revisión read-only

Usar cuando se necesita contraste sin permitir cambios.

### Segunda implementación/revisión

Una instancia distinta de Codex revisa contra el contrato. La primera implementación no se declara a sí misma correcta.

Dos límites hacen que esa revisión valga algo:

- el revisor deriva su juicio del contrato y del diff, no del informe del implementador;
- el revisor no edita las pruebas que evalúa.

Además, una prueba escrita por quien implementa puede pasar estando vacía. En zonas de riesgo, Codex rompe la implementación a propósito y muestra la prueba en rojo antes de darla por buena. Una prueba que pasa contra una implementación rota no es evidencia.

### /claudex

Para decisiones difíciles:

1. Claude deriva una solución.
2. Codex deriva otra sin ver la primera.
3. Se comparan.
4. La discrepancia localiza el riesgo.
5. Claude sintetiza opciones/evidencia.
6. Marco decide cuando corresponda.

La independencia se pierde si una respuesta contamina a la otra antes de la derivación. Vale igual para la segunda revisión.

---

## 12. EVOLUCIÓN Y AUTOMEJORA

Este protocolo puede cambiar durante un proyecto.

### Qué merece modificarlo

Un incidente real que haya causado al menos uno de estos efectos:

- retrabajo;
- fallo de una puerta de salida;
- efecto colateral inesperado;
- gasto significativo de contexto/tiempo;
- conflicto entre Claude y Codex;
- riesgo de seguridad/datos;
- proceso repetidamente innecesario.

No añadir reglas por escenarios imaginarios.

### Ciclo de mejora

Cuando aparece un incidente:

1. Registrar el incidente en `docs/incidentes.md`. Codex redacta el registro a partir de la evidencia —diff, prueba fallida, informe—; Claude separa síntoma de causa raíz.
2. Preguntar si la causa es universal o propia del proyecto.
3. Si es propia: corregir CLAUDE.md/docs del proyecto.
4. Si es universal: Claude propone el cambio mínimo al protocolo.
5. Codex read-only intenta encontrar efectos secundarios o contradicciones.
6. Marco aprueba o rechaza.
7. Si se aprueba: sustituir/combinar reglas antes que acumular excepciones.
8. Subir versión y registrar en la bitácora una línea que apunte al incidente que la originó.

Una regla sin incidente detrás es una regla sin evidencia.

### Plantilla de incidente

```
### Incidente
- Proyecto:
- Fase:
- Qué ocurrió:
- Impacto:
- Causa raíz:
- Regla existente que falló o faltó:
- ¿Local o universal?:
- Cambio propuesto:
- Evidencia de que el cambio habría evitado el incidente:
```

### Higiene al cierre de cada proyecto

Revisar `docs/incidentes.md` y:

- eliminar redundancias;
- fusionar reglas equivalentes;
- retirar reglas obsoletas —incluidas las cuyo incidente ya no puede repetirse—;
- conservar ejemplos solo cuando expliquen una regla mejor que una frase;
- mantener el protocolo lo bastante corto para que realmente se lea.

Automejorarse no significa autoeditarse sin control: Claude y Codex pueden detectar y proponer mejoras; Marco autoriza la nueva versión.

---

## 13. BITÁCORA

| Versión | Fecha | Origen | Cambio |
|---|---|---|---|
| 1.0 | 2026-08-11 | SistemaRhino | Versión inicial: roles, archivo como interfaz, encargos, economía de contexto, ciclo estándar y /claudex. |
| 2.0 | 2026-08-11 | Incidentes reales | Se añadieron fronteras estrictas entre diseño/construcción, autorización de instalaciones, artefacto mínimo para decidir y tratamiento temprano de fallos de entorno. |
| 3.0 | 2026-08-11 | Refactor estructural solicitado por Marco | Se separan las fases del proyecto del protocolo universal; el stack aprobado pasa a funcionar como autorización explícita de dependencias núcleo; se distinguen dudas bloqueantes de decisiones locales reversibles; se formalizan estado durable, fallo de producto y ciclo de automejora sin alterar el principio de aprender de incidentes reales. |
| 4.1 | 2026-08-17 | Decisión de Marco | Se formaliza el formato **OCRAV** para los encargos, la obligación de **adjuntar la imagen del diseño aprobado** cuando el encargo toca diseño, y la **doble pasada**: el ejecutante audita el encargo en lectura antes de ejecutarlo. Origen: encargos que fallaron por defectos de contrato, no de ejecución (ver `docs/incidentes.md` INC-002 y la errata de E-007). |
| 4.0 | 2026-08-11 | Revisión estructural solicitada por Marco | Se cierran cinco huecos del proceso: el registro de incidentes pasa a ser archivo durable que alimenta §12; el bucle de fallo de contrato recibe un techo de tres intentos con reversión y re-alcance; se fijan las condiciones que hacen que la segunda revisión de Codex sea evidencia y no trámite; las dudas bloqueantes pasan a una cola que evita que Marco sea cuello de botella; y el ciclo estándar gana una vía corta habilitada por riesgo. |
