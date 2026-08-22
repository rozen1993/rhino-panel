# Sistema R — frontend

Simulación responsive de la plataforma de gestión audiovisual con tres roles: Operario, Admin y Burson. Está construida con Next.js 16, React 19 y Tailwind CSS 4.

## Ejecución local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. Para validar una versión de producción:

```bash
npm run verify
npm run test:e2e
```

## Cuentas de demostración

| Rol | Usuario | Clave |
|---|---|---|
| Admin | `admin` | `admin2026` |
| Operario | `ana` | `ana2026` |
| Operario | `carlos` | `carlos2026` |
| Burson | `burson` | `burson2026` |
| Operario especial | `luis` | `luis2026` |

Los datos se guardan temporalmente en `localStorage` y cookies de prueba. No es una arquitectura de producción ni un sistema de autenticación seguro.

El contrato funcional vigente está en `../docs/handoff-frontend.md` y la dirección visual en `../diseno/direccion-final-traducida/CONTRATO-VISUAL.md`.
