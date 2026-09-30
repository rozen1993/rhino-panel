# Contrato Aunor — propuesta 02 implementada en local

Marco eligió **Tarjetas por servicio** el 29 de septiembre de 2026.
Referencia aprobada: `../propuestas-contrato-aunor-2026-09-29/02-tarjetas-por-servicio-escritorio.png`.

## Resultado

- Ocho tarjetas mensuales y cuatro anuales, según los servicios y periodos existentes.
  Corrección posterior de Marco: «Videos de fiesta de fin de año» tiene meta de
  **2 al año**, no al mes. Se conserva la cantidad; cambia su periodicidad.
- Contador X/Y y barra por servicio. Verde solo cuando la meta está alcanzada;
  excedentes visibles sin traslado automático a otros meses.
- Selector de mes y franja de seis meses que se desplaza con el periodo consultado.
- Cada tarjeta abre un diálogo de consulta con entregas y acceso a sus actividades.
- Se mantienen los avisos de reemplazos, sus evidencias, trabajos no computables,
  pendientes de ejecución y trabajos sin periodo o sin servicio asociado.
- La meta desconocida sigue siendo «—». No se inventan periodos ni cuotas.
- Tarjetas anuales compactas con las fechas del ciclo registrado; no se presentan
  esas fechas como vencimiento del contrato.
- Navegación por teclado, Escape, retorno del foco a la tarjeta y bloqueo del
  desplazamiento del fondo mientras el diálogo está abierto.
- Adaptación a escritorio, tablet y móvil, sin añadir controles de gestión para Aunor.

La guía frontend-design ayudó a trasladar la composición aprobada al sistema
existente: se conservaron identidad, tipografías, iconos y colores, y se separaron
los estilos del nuevo componente para no afectar otras pantallas.

## Alcance de seguridad

Presentación únicamente. Se reutiliza `contractProgress`; no se modificaron sus
reglas ni los servicios de lectura, acciones del servidor, permisos o base de datos.
No hubo migraciones, cambios de contraseñas, push a GitHub ni despliegue en Vercel.
Las pruebas del navegador usan `SISTEMA_R_DATA_SOURCE=demo` y una compilación
separada `.next-aunor-test`. No prueban registros de producción ni la base local.

## Capturas de la implementación

- [Escritorio](contrato-escritorio.png)
- [Móvil](contrato-movil.png)
- [Detalle móvil](contrato-detalle-movil.png)

Son capturas de la aplicación real ejecutada en modo demostración. Los datos
ficticios no están automáticamente asociados a abril: por eso se ven cuotas
0/Y, a diferencia de los avances ilustrativos de la propuesta. No se deben
rellenar contadores para hacerlos coincidir con la maqueta.

## Verificación

- TypeScript y ESLint.
- Suite unitaria: 370 pruebas en 46 archivos, incluidas nueve del nuevo componente.
- Suite de navegador: 13 pruebas, con compilación optimizada aislada.
- Revisión responsive a 320, 390, 768, 1024, 1440 y 1920 px.
- Verificación de conteos, exceso 15/10, metas desconocidas y cero, consulta anual,
  separación de pendientes, actualización del workspace y cierre/retorno del foco.

Reproducción de las pruebas de navegador sin sobrescribir capturas anteriores:

```powershell
cd frontend
$env:SISTEMA_R_CAPTURE_DIR='../docs/implementacion-contrato-tarjetas-2026-09-29/regresion'
npx.cmd playwright test e2e/contract-reference.spec.ts e2e/history-contract.spec.ts e2e/aunor.spec.ts --config=playwright.aunor.config.ts
```
