# E-013 — Alinear el frontend con las decisiones del 2026-08-17

**Fase:** 2 — Construcción frontend
**Ejecuta:** Codex
**Estado:** en auditoría
**Fecha:** 2026-08-17
**Formato:** OCRAV
**Imagen adjunta:** `diseno/piezas-png/pieza-2.png` — la dirección visual aprobada. Única referencia de
forma.

---

```
┌─────────────────────────────┐
│ 1. OBJETIVO                 │
└─────────────────────────────┘
```

El frontend está construido y funcionando, pero **varias decisiones tomadas hoy todavía no están
reflejadas en el código**. Este encargo las aplica. No se diseña nada nuevo ni se añaden pantallas: se
alinea lo que existe con lo que ya está decidido.

Cuatro trabajos, en este orden:

1. **P-9 cambia de oficio**: de simular una importación a mostrar el enlace al Excel histórico.
2. **Las reglas de Locución** en el formulario.
3. **El rol Burson**, que entra pero solo ve su tablero y solo lee.
4. **Rastros de Operación** que queden en código, datos o pruebas.

---

```
┌─────────────────────────────┐
│ 2. CONTEXTO                 │
└─────────────────────────────┘
```

**El producto.** Plataforma web interna de **Rhino Audiovisuales**, productora peruana que trabaja para
**Autopista del Norte (AUNOR)**. Fase 2: frontend con datos simulados, sin backend real.

### Léelo antes de tocar código

1. `diseno/piezas-png/pieza-2.png` — la imagen aprobada. Ábrela.
2. `docs/sistema-diseno.md` — paleta, tipografía, las tres familias de estado, elementos que se repiten.
3. `frontend/lib/roles.ts` — **el catálogo de roles ya está en código**. Ocho roles con sus permisos
   declarados. Es la fuente de verdad de quién puede qué.
4. `docs/decisiones.md` — **D-045, D-048, D-049, D-052, D-055, D-056** son las que aplica este encargo.

### Trabajo 1 · P-9 pasa a ser «Histórico» (D-049, D-055)

Hoy `frontend/app/importacion/page.tsx` simula una importación por lotes: archivo cargado, filas que
entrarían, filas rechazadas con motivo, botón de confirmar.

**Eso ya no va a ocurrir nunca.** Con D-049 el Excel histórico es **un enlace**, igual que cualquier otro
material. La pantalla pasa a mostrar ese enlace: verlo, abrirlo y cambiarlo.

- Ruta: renómbrala a `/historico`, y actualiza el destino del `NavBar`.
- El destino en la navegación se llama **Histórico**, no Importar.
- Contenido: el enlace actual al Excel, un botón para abrirlo, y la posibilidad de cambiarlo. Añade
  cuándo se actualizó por última vez.
- Retira `frontend/lib/import-simulation.ts` y su prueba, que dejan de tener objeto.
- Mantén el acceso restringido a quien administra, con `role.administers`, como está hoy.

### Trabajo 2 · Las reglas de Locución (D-056)

Locución sustituyó a Operación en el catálogo, pero **no hereda sus reglas**. Operación era trabajo en
vía; Locución es trabajo de cabina que produce un archivo de audio.

| Tipo | Ubicación obligatoria | Enlace al entregar | Pasa por «Por subir» |
|---|---|---|---|
| Grabación | **Sí** | Obligatorio | Sí |
| Edición | No | Obligatorio | Sí |
| Creatividad | No | Obligatorio | Sí |
| **Locución** | **No** | **Obligatorio** | **Sí** |
| Coordinación | No | Opcional | No |

Lo que hay que reflejar en el formulario de actividad:

- **La ubicación solo es obligatoria en Grabación.** Hoy el formulario marca el nombre del lugar como
  obligatorio siempre. Debe dejar de estarlo cuando el tipo no es Grabación.
- El resto de reglas —enlace y «Por subir»— son de la máquina de estados y no hay servidor todavía, así
  que **basta con que el formulario y el detalle no las contradigan**. No inventes validación de estados.

### Trabajo 3 · El rol Burson (D-051, D-052)

Burson es un rol con cuenta, pero **solo ve su tablero y solo lee**.

Hoy `frontend/lib/roles.ts` ya lo declara con `seesBurson: true` y vista externa `burson`. Falta que la
pantalla lo respete:

- Cuando entra Burson, el tablero **no muestra ninguna acción de escritura**: ni marcar pendientes como
  resueltos, ni comentar, ni editar.
- Ve la tabla completa, **incluidas las columnas de pendientes de Rhino y pendientes de Burson** — así
  lo decidió D-052.
- **No ve** ningún otro destino: ni actividades, ni historial, ni cuentas. Su navegación es mínima.
- Cuando entra Supervisión o Coordinación, el tablero sigue como está hoy.

### Trabajo 4 · Rastros de Operación (D-048)

El rol y el tipo **Operación ya no existen**. Busca y elimina lo que quede en `frontend/`: datos de
ejemplo, opciones de desplegables, filtros, pruebas, textos.

---

```
┌─────────────────────────────┐
│ 3. RESTRICCIONES            │
└─────────────────────────────┘
```

**No** diseñes pantallas nuevas ni cambies la dirección visual. Esto es alinear, no rediseñar.

**No** conectes nada real: sin fetch, sin Supabase, sin base de datos. Todo simulado.

**No** inventes nombres de personas. El sistema modela roles, no personas (D-047). Donde falte un dato
real, di «Sin asignar».

**No** añadas validación de la máquina de estados. No hay servidor; el frontend solo debe no
contradecir las reglas.

**No** rompas el móvil ni el escritorio ya aprobados. Si una pantalla se ve peor a 390 px o a 1280 px
después de tu cambio, el cambio está mal.

**No** te apartes de `frontend/lib/roles.ts` para decidir permisos. Es la fuente de verdad; si algo
falta ahí, dilo en el reporte en vez de codificarlo suelto en una pantalla.

**No** hagas commits.

---

```
┌─────────────────────────────┐
│ 4. ACEPTACIÓN               │
└─────────────────────────────┘
```

1. `npm run verify` en verde: TypeScript, lint, pruebas y build.
2. La ruta `/historico` existe, muestra el enlace al Excel y **no menciona lotes, filas rechazadas ni
   confirmar importación**. El destino del menú dice Histórico.
3. Entrando como **Locución**, el formulario **no marca la ubicación como obligatoria**.
4. Entrando como **Grabación**, la ubicación **sí** es obligatoria.
5. Entrando como **Burson**: ve el tablero con las dos columnas de pendientes, **sin ningún botón de
   escritura**, y su navegación no ofrece ningún otro destino.
6. Entrando como **Supervisión**, el tablero de Burson sigue funcionando como hoy.
7. **La palabra Operación no aparece en ningún sitio de `frontend/`.**
8. A 390 px y a 1280 px todo sigue viéndose como antes del encargo, salvo lo que este encargo cambia.

---

```
┌─────────────────────────────┐
│ 5. VERIFICACIÓN             │
└─────────────────────────────┘
```

1. `npm run verify` — pega el resultado. Si PowerShell bloquea npm, usa `npm.cmd`.
2. Busca la palabra Operación en `frontend/app`, `frontend/lib`, `frontend/components` y
   `frontend/__tests__`. Debe salir vacío.
3. Añade pruebas que fijen lo decidido, no solo que pase el build:
   - la ubicación es obligatoria en Grabación y no lo es en Locución;
   - el rol Burson no tiene acciones de escritura en su tablero;
   - el catálogo sigue teniendo ocho roles y ninguno se llama Operación.
4. Capturas con `npx playwright screenshot` a 390×844 y 1280×900 de `/historico`, y de `/burson` con la
   cookie `rhino_rol_prueba=burson`. Guárdalas en `frontend/.verificacion/`.
5. Ábrelas y compáralas con `pieza-2.png`: píldoras sólidas, tarjetas planas, sin sombra dura.
6. `git status` no muestra cambios fuera de `frontend/`.

**Reporte:** corto. Qué cambiaste, resultado de verify, resultado de la búsqueda de Operación, las
pruebas añadidas, y **cualquier regla que hayas tenido que decidir por tu cuenta** porque el contrato no
la cubría.

---

## Regla de cierre

Si falta una decisión bloqueante, detente y pregunta. Si es un detalle local y reversible cubierto por
este contrato, elige lo más simple y anótalo. **No inventes reglas de producto.**
