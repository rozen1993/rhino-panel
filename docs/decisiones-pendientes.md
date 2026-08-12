# Decisiones pendientes

Cola de decisiones que corresponden a Marco. Cada entrada dice qué bloquea, qué opciones hay y qué
consecuencias tiene cada una.

Marco resuelve en lote. Lo resuelto pasa a `docs/decisiones.md` y desaparece de esta cola.

Resueltas hasta ahora: D-001 a D-005 y D-007 a D-017 — ver `docs/decisiones.md`.

---

## D-018 — ¿Qué dirección visual se elige?

**Fase:** 1
**Bloquea:** la puerta de salida de la Fase 1, los wireframes de las nueve pantallas y el sistema de
diseño. Es la decisión que tiene la fase parada.

Las cinco maquetas están en `diseno/` y publicadas; los enlaces están en `docs/estado.md`. Las cinco
muestran exactamente el mismo contenido, así que lo único que se compara es el lenguaje visual.

**Opciones**

- **A · Operativa.** Tipografía de sistema, bordes duros de 2 px, sombra sólida, ámbar sobre azul
  marino casi negro. Parece un instrumento de trabajo y se lee de lejos. La más segura para el uso en
  vía; la menos memorable.
- **B · Editorial.** Georgia serif, fondo crema, coral de marca, esquinas asimétricas, sombras suaves.
  Parece el trabajo de una productora audiovisual. **Advertencia:** usa metadatos de ~11 px; si se
  elige, hay que subir ese tamaño antes de los wireframes.
- **C · Institucional.** Arial, azul y gris, alineada y casi tabular. El orden es la estética. Es la
  que un cliente como AUNOR reconocería como «un sistema serio». La más cercana a A de las tres nuevas.
- **D · Nocturna.** Interfaz oscura por defecto, pensada para grabaciones nocturnas y para no
  deslumbrar en cabina. El color solo aparece cuando algo exige atención. La más distinta en primera
  impresión; hay que comprobar que se lea bien a pleno sol, que es el otro caso de uso real.
- **E · Señalética vial.** Arial Narrow condensada, amarillo y negro, franjas y formas de señal.
  Identidad tomada del entorno real del trabajo. La de más carácter y la más arriesgada: puede
  envejecer mal o cansar en uso diario.

**Cómo conviene decidir**, en este orden:

1. En la primera pantalla, ¿en cuál salta la tarjeta **Observada** sin buscarla? Si se pierde entre las
   demás, esa dirección rompe el ciclo de supervisión en la vida real.
2. En el formulario, ¿se ven los campos grandes y se entiende de un vistazo el aviso de borrador sin
   enviar? Ese es el momento de alguien de pie en la berma con una mano ocupada.
3. Solo después, si gusta.

**Sin recomendación.** La dirección visual es una decisión de Marco y no hay un criterio técnico que
haga ganar a una sobre las otras; las cinco cumplen el contrato.

---

## D-006 — Excel histórico: disponibilidad y forma real

**Fase:** 0 (informativa) / 7 (bloqueante)

Única entrada abierta. No bloquea la Fase 1.

Conviene resolverlo temprano de todos modos: conocer las columnas reales del Excel —sobre todo las
coberturas de Johann— evita diseñar campos que el histórico no puede llenar y descubrirlo recién en la
Fase 7, cuando ya haya pantallas y esquema hechos.

**Qué hace falta:** una copia del archivo en el proyecto, o al menos la lista de columnas y unas filas
de ejemplo.
