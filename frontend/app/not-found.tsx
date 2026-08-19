import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12"><div className="w-full rounded-[5px] border border-line bg-panel p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">Error 404</p><h1 className="mt-2 text-2xl font-bold">Esta página no existe</h1><p className="mt-2 text-sm text-ink-muted">Revisa la dirección o vuelve a la portada de Rhino Audiovisuales.</p><Link className="mt-5 flex min-h-11 items-center justify-center rounded-[5px] bg-blue px-4 text-sm font-bold text-white" href="/">Volver a la portada</Link></div></main>;
}
