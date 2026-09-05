# Checkpoint de publicación RC1 — Claudex

**Fecha:** 2026-09-04 (America/Lima)

> Checkpoint histórico resuelto: después de renovarse la cuota se obtuvo una
> revisión nueva completa, se corrigieron los hallazgos confirmados y otra
> pasada terminó `APPROVED` para publicación controlada. El resultado y el
> journal válido están en
> [`evidencia-preview-rc1-2026-09-04.md`](evidencia-preview-rc1-2026-09-04.md).
> La recuperación incompleta de abajo no se convirtió en aprobación y no es el
> bloqueo vigente: ahora falta el smoke autenticado de staging.

**Etapa detenida:** revisión independiente previa al commit y al despliegue de
staging.

**Motivo:** Claude Code terminó con código 1 por límite de cuota antes de emitir
una respuesta final validada. El intento queda incompleto y no autoriza a Codex
a continuar solo.

**Journal recuperable:**
`claudex-20260904T104120293Z-7775de45364f42bf901b3e26d98d33a3.jsonl`, dentro de
`C:\Users\MARCO\AppData\Local\Claudex\recovery\`.

**SHA-256 del journal:**
`1DF4A5EB61A2834887099D36F4268F5C05FC9DE6FB3C70028042B2A9D63FD9DF`.

**Telemetría:** la sesión avisó 91 % consumido y después terminó con estado de
cuota `rejected`; el límite máximo reportó 99 % y renovación el
2026-09-04 a las 08:20 (America/Lima), equivalente a 13:20 UTC.

## Estado preservado

- `HEAD` y `origin/equipo`: `6d52d8f`.
- No se creó commit, no se hizo push y no se desplegó nada.
- Staging continúa con las seis primeras migraciones; la CLI confirmó que solo
  `202609030001_rls_visibility_performance.sql` está pendiente.
- Las versiones remotas anteriores de `admin-accounts` y
  `change-temporary-password` no fueron reemplazadas.
- El Preview publicado continúa siendo el anterior a RC1.
- Gates del candidato local: 198/198 Vitest, 10/10 Playwright, 17/17 Deno,
  51/51 Supabase local, build aprobado y `git diff --check` aprobado.

## Material parcial, todavía no validado

La recuperación propuso `CHANGES_REQUIRED`, pero no constituye el veredicto
final ni una salida validada por esquema. Señaló provisionalmente:

1. posible divergencia silenciosa de `SISTEMA_R_USERNAME_DOMAIN` entre Vercel y
   las Edge Functions;
2. metadata vacía durante `reset-password`;
3. dependencia `npm:@supabase/server@^1` no fijada de forma reproducible;
4. ausencia de sondas remotas posteriores para las policies y el rechazo 401;
5. incertidumbre sobre el empaquetado de archivos de prueba junto a las
   funciones.

No corregir ni descartar estos puntos como si ya fueran hallazgos confirmados.

## Reanudación exacta

Después de renovarse la cuota:

1. ejecutar un nuevo `DryRun` Claudex con perfil `o/max`;
2. pedir una revisión limpia que inspeccione el diff y contraste expresamente
   los cinco puntos recuperados;
3. corregir únicamente los hallazgos confirmados, repetir todos los gates y
   obtener una revisión final completa;
4. solo entonces crear el commit, hacer push, aplicar la migración 7, desplegar
   ambas funciones y generar el Preview de validación RC1.

Producción permanece fuera de alcance.
