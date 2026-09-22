# Propuestas visuales — Operario e Histórico

Estado: **propuestas implementadas y verificadas solo en local**. Modalidades y
confirmación aprobadas por Marco; acciones con el centrado de la revisión 2.
Se adopta Histórico D (corte panorámico), la alternativa recomendada al recibir
«ya ahora sí está bien, procede a implementarlo». A/B se conservan como referencia
descartada y C como alternativa no elegida. No se autoriza publicación.
Respaldo: `61f7297`. Rama: `feat/cambios-locales-2026-09-22`.

## Decisiones confirmadas

- La contraseña real de Admin se cambiará únicamente al publicar la ronda final.
  No se incorpora ninguna contraseña a estos archivos.
- Operario podrá enviar a Papelera una actividad creada por él, aún asignada a
  él, exclusivamente en Programada y conservando el permiso de creación.
- Revocar el permiso o reasignar elimina esa posibilidad. Las actividades de
  Admin no quedan habilitadas para eliminación por el operario.
- Se propone el mismo destino recuperable que usa Admin: Papelera. El operario
  no obtiene acceso a su gestión, restauración ni borrado definitivo.
- Admin podrá restaurar mientras no se haya vaciado la Papelera. El motivo
  quedará registrado y el servidor deberá revalidar permisos al confirmar.
- Histórico: solo Grabación y Edición. Sin «Ver todo el Histórico», sin «VS».
  Creatividad y Locución no tendrán entradas por ahora; no se borran sus datos.

## Dirección de diseño

Referencias: `diseno/direccion-final-traducida/CONTRATO-VISUAL.md`, sus tres
imágenes originales y los componentes actuales. Prevalecen DA VINCI y los roles
vigentes sobre los nombres y perfiles antiguos de las referencias.

Paleta: noche `#021326`, azul técnico `#031D36`, cian `#11B7C9`, lima `#84D600`,
superficie `#F4F7F8`, tinta `#10233F`. Cian legible sobre blanco `#006F83`.
Se conserva naranja para Edición y se usa rojo oscuro para la baja, nunca lima.
Tipografía: Bahnschrift para títulos, Segoe UI para controles, Consolas/Cascadia
para etiquetas. Radios 6–10 px; líneas finas y sombras frías del sistema actual.

1. **Modalidades:** tres opciones equivalentes, con icono, etiqueta y casilla
   claramente marcada; sin el doble marco del fieldset anterior. Fondo cian
   suave solo para seleccionadas. No hay opciones preseleccionadas por defecto:
   las dos marcadas en la maqueta ilustran una selección del usuario.
2. **Acciones:** entrega e inicio conservan su fila y la acción primaria lima.
   Edición y eliminación se agrupan debajo como gestión de la actividad propia.
   Las modalidades describen la actividad y pasan a su cabecera, no a las acciones.
3. **Papelera:** confirmación con actividad, estado, motivo y alcance recuperable.
   No se representa destrucción definitiva ni se otorgan permisos extra.
4. **Histórico A (primera propuesta, no aprobada):** dos tarjetas fotográficas equilibradas, con
   imagen separada del texto sobre blanco. Acceso cian de navegación; sin competir
   con los botones lima de ejecución. Mantiene la personalidad audiovisual.
5. **Histórico B (primera propuesta, no aprobada):** dos filas con fotografía lateral y acción a la derecha;
   ocupa menos altura en escritorio. En móvil usa cabecera fotográfica breve.

La guía frontend-design se usa para ordenar jerarquías y evitar ornamentos
innecesarios, no para introducir otra identidad. La diferencia entre A y B es
la composición de la sección, no el sistema visual del resto de la plataforma.

## Archivos

### Revisión 2

- `02-acciones-v2-escritorio.png`, `02-acciones-v2-movil.png` y
  `02-acciones-panel-v2.png`: Editar y Eliminar tienen icono y texto centrados,
  igual altura, tamaño y peso tipográfico. Se retira la flecha de edición y se
  mantienen su cian, el rojo de eliminación y ambos iconos.
- `06-historico-c-escritorio.png` / `06-historico-c-movil.png`: **ventanas de
  rodaje**. Dos composiciones inmersivas de fotografía, con títulos condensados
  de gran formato y un pie de navegación claramente separado. La fotografía
  pasa a ocupar la superficie de la tarjeta, sin los cuerpos blancos de A/B.
- `07-historico-d-escritorio.png` / `07-historico-d-movil.png`: **corte
  panorámico**. Dos franjas cinematográficas con texto sobre azul noche e imagen
  amplia, unidas visualmente por un corte oblicuo cian/naranja. En móvil la
  imagen ocupa la cabecera y la lectura se apoya en un degradado oscuro.
- Ambas mantienen el encabezado, navegación y contenedor de la plataforma.
  No incorporan estadísticas ficticias, estado «REC», funciones nuevas,
  categorías retiradas ni un «VS». Naranja identifica Edición, no un estado.
- La guía frontend-design orienta esta segunda revisión hacia el lenguaje de
  encuadre y montaje audiovisual, concentrando el cambio en las fotografías,
  escala tipográfica y composición, sin alterar la identidad de la aplicación.

Regenerar esta tanda con `node docs/propuestas-operario-historico-2026-09-22/render.mjs --revision2`.
Las capturas iniciales se conservan como referencia; `verificacion-v2.json`
corresponde a la nueva tanda. El índice incluye C y D antes de las propuestas
anteriores. No se han cambiado los diseños aprobados de modalidades y confirmación.

Cada propuesta tiene PNG `-escritorio` (1440 px) y `-movil` (390 px).
Abrir `index.html` para recorrer las maquetas sin iniciar la aplicación.
Los datos y la cuenta Ana Torres son ejemplos de diseño; no son lecturas remotas.
Las fotografías son los recursos ilustrativos ya existentes en el proyecto.

`node docs/propuestas-operario-historico-2026-09-22/render.mjs` regenera las
capturas con Playwright instalado en frontend, sin instalar dependencias.
El renderizador bloquea peticiones de red y no abre perfiles del navegador
del usuario. No utiliza .env, Supabase, localStorage ni servicios desplegados.

La versión móvil de acciones muestra el nombre, estado y modalidades de la
actividad, luego el panel de trabajo y después el detalle. El operario siempre
identifica el trabajo antes de actuar. Este reordenamiento es parte de la propuesta
aprobada para la implementación local.

Los PNG móviles largos muestran la página desplegada y sitúan la navegación al
pie solo para que no tape contenido en la imagen. La maqueta navegable conserva
la barra fija en pantalla. La confirmación se captura como un viewport real.

## Siguiente paso

Verificación de maquetas completada: 10 PNG revisados visualmente, imágenes
locales cargadas, JavaScript sin errores y sin desbordamiento horizontal a
1440 y 390 px. Selección múltiple comprobada en ambos tamaños. La captura de
confirmación móvil está limitada al viewport para no mostrar el fondo fuera
del diálogo. Git confirma que los únicos archivos nuevos están en esta carpeta;
no se modificaron archivos de la aplicación ni se efectuaron cambios remotos.

Se implementaron D, las modalidades, la confirmación y las acciones centradas en
la aplicación local. No se harán
push, despliegues ni migraciones remotas sin la indicación final del propietario.

Implementación completada: ver `../implementacion-operario-historico-2026-09-22.md`
para alcance, pruebas, capturas reales y pasos pendientes de publicación.
