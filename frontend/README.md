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

## Preview y producción

Vercel usa `npm run build:vercel`: primero ejecuta un preflight fail-closed y
solo después compila Next.js. El preflight lee exclusivamente variables del
proceso, exige la correspondencia Preview→staging o Production→production,
comprueba el project ref, coteja el origen declarado con las variables de
sistema de Vercel y rechaza claves legacy o privilegiadas. El modo `demo` nunca
es válido en Vercel. Las System Environment Variables deben estar habilitadas y
no se redefinen manualmente.

Las variables y el orden operativo se documentan en
`../docs/runbook-preview-produccion.md`. Ese documento es preparación: no
autoriza por sí mismo un despliegue ni sustituye los gates PostgreSQL/RLS.

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

`demo` es una simulacion local y no constituye una frontera de autenticacion:
las cuentas mutables se sincronizan mediante una cookie sin firma. Las cookies
que identifican la sesion son `httpOnly`, pero la autoridad real de despliegue
pertenece exclusivamente a Supabase/RLS. El preflight rechaza `demo` en Vercel.

El contrato funcional vigente está en `../docs/handoff-frontend.md`, la decisión
de backend en `../docs/decision-backend-supabase-2026-08-22.md`, el runbook de
despliegue en `../docs/runbook-preview-produccion.md`, los gates de backend en
`../supabase/README.md` y la dirección visual en
`../diseno/direccion-final-traducida/CONTRATO-VISUAL.md`.
