"use client";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12"><div className="w-full rounded-[5px] border border-red bg-panel p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-red">Error inesperado</p><h1 className="mt-2 text-2xl font-bold">No pudimos mostrar esta pantalla</h1><p className="mt-2 text-sm text-ink-muted">Tus datos locales no fueron eliminados. Puedes intentar cargar nuevamente.</p><button className="mt-5 min-h-11 w-full rounded-[5px] bg-blue px-4 text-sm font-bold text-white" onClick={() => retry()} type="button">Reintentar</button></div></main>;
}
