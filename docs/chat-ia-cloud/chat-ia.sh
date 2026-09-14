#!/usr/bin/env bash
# Preparacion/verificacion de la COPIA de desarrollo. Nunca desplegar desde aqui.
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

mode="${1:-check}"
case "$mode" in check|setup|verify) ;; *) echo 'Uso: bash scripts/cloud/chat-ia.sh check|setup|verify' >&2; exit 2 ;; esac

# No imprimir valores: impedir que una configuracion real llegue a las pruebas.
node <<'NODE'
const blocked = Object.keys(process.env).filter((name) =>
  /^(?:NEXT_PUBLIC_)?SUPABASE_/.test(name) ||
  /^OPENROUTER_/.test(name) ||
  /^(?:DATABASE_URL|DIRECT_URL|PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE|VERCEL|VERCEL_ENV|VERCEL_TOKEN)$/.test(name)
).filter((name) => process.env[name]);
if (blocked.length) {
  console.error('Entorno no aislado: retirar estas variables del entorno cloud:', blocked.join(', '));
  process.exit(1);
}
const major = Number(process.versions.node.split('.')[0]);
if (major < 22) { console.error('Se requiere Node >=22; seleccionar Node 24 para reproducir CI.'); process.exit(1); }
NODE

for dir in . frontend; do
  for file in "$dir"/.env "$dir"/.env.*; do
    [[ -e "$file" ]] || continue
    [[ "$file" == "$dir/.env.example" ]] && continue
    echo "No se admite un archivo de entorno en esta copia: $file" >&2
    exit 1
  done
done
for path in .vercel frontend/.vercel supabase/.temp; do
  if [[ -e "$path" ]]; then
    echo "Retirar configuracion enlazada antes de usar la copia: $path" >&2
    exit 1
  fi
done

export SISTEMA_R_DATA_SOURCE=demo
export SISTEMA_R_ISOLATED_TEST=audit
export CI=1

case "$mode" in
  check)
    echo 'Configuracion demo comprobada. No se ha consultado ninguna base ni proveedor IA.'
    ;;
  setup)
    cd frontend
    npm ci
    npx playwright install --with-deps chromium
    # Resuelve Deno y su cache durante la fase con red. Pruebas unitarias sin --allow-net.
    npm run test:functions
    ;;
  verify)
    cd frontend
    npm run verify
    npm run test:functions
    npm run test:e2e
    ;;
esac
