# Mockups de dirección final traducida

Colección previa a implementación basada en los tres JPEG entregados en `diseño_final/`.

## Entregables

1. `01-acceso-pc.png` — selección de cuenta y acceso.
2. `02-operario-pc.png` — registro y seguimiento del operario.
3. `03-admin-pc.png` — panorama completo y conversación privada.
4. `04-burson-pc.png` — creación y seguimiento de encargos Burson.
5. `05-historico-pc.png` — calendario anual con detalle persistente.
6. `06-operario-laptop.png` — adaptación a 1366×768.
7. `07-admin-tablet.png` — adaptación a 834×1112.
8. `08-historico-tablet.png` — calendario a dos columnas y panel lateral.
9. `09-operario-mobile.png` — navegación inferior y formulario en una columna.
10. `10-historico-mobile.png` — calendario anual en una columna.

`mockup.html` es la fuente editable y `capturar-mockups.mjs` vuelve a generar toda la colección mediante Playwright.

## Regeneración

Desde la raíz del repositorio:

```powershell
node diseno\direccion-final-traducida\capturar-mockups.mjs
```

La colección es una propuesta visual para aprobación. No modifica el frontend funcional.
