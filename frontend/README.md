# Sistema R — frontend

Plataforma responsive de gestión audiovisual con tres roles: Operario, Admin y Burson. Está construida con Next.js 16, React 19, Tailwind CSS 4 y un primer corte de backend en Supabase.

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

Sin variables, el entorno local usa `SISTEMA_R_DATA_SOURCE=demo`. Para conectar
Supabase, copiar `.env.example` a `.env.local`, seleccionar `supabase` y completar
solo la URL y la publishable key. Ese modo falla explícitamente si falta alguna
variable; nunca muestra fixtures como respaldo.

## Cuentas de demostración

| Rol | Usuario | Clave |
|---|---|---|
| Admin | `admin` | `admin2026` |
| Operario | `ana` | `ana2026` |
| Operario | `carlos` | `carlos2026` |
| Burson | `burson` | `burson2026` |
| Operario especial | `luis` | `luis2026` |

Estas cuentas existen únicamente en modo `demo`; allí los datos siguen en
`localStorage` y cookies de prueba. No reutilizar esas claves en staging.

El contrato funcional vigente está en `../docs/handoff-frontend.md`, la decisión
de backend en `../docs/decision-backend-supabase-2026-08-22.md`, el runbook en
`../supabase/README.md` y la dirección visual en
`../diseno/direccion-final-traducida/CONTRATO-VISUAL.md`.
