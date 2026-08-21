import Link from "next/link";

export default function HomePage() {
  return <main className="technical-surface flex min-h-screen flex-col px-5 py-6 text-white sm:px-10 lg:px-16">
    <header className="relative z-10 flex items-center justify-between"><span className="brand-condensed text-xl">CONTROL DE ACTIVIDADES<small className="mt-1 block font-sans text-[0.55rem] tracking-[0.2em] text-blue">RHINO AUDIOVISUALES</small></span><span className="text-xs text-white/65">Acceso privado</span></header>
    <section className="relative z-10 my-auto max-w-4xl py-16"><p className="text-xs font-extrabold tracking-[0.2em] text-blue">GESTIÓN AUDIOVISUAL</p><h1 className="brand-condensed mt-4 max-w-4xl text-5xl leading-[.95] drop-shadow-xl sm:text-7xl lg:text-8xl">EL TRABAJO AUDIOVISUAL, BAJO CONTROL.</h1><span className="mt-6 block h-1 w-16 bg-amber" /><p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">Programa, registra y entrega cada actividad desde una plataforma creada para el ritmo real del equipo.</p><Link className="mt-8 inline-flex min-h-12 items-center rounded-md bg-amber px-7 font-extrabold text-[#173000] shadow-[0_8px_24px_rgba(132,214,0,.22)]" href="/acceso">Entrar a la plataforma&nbsp; ›</Link></section>
    <p className="relative z-10 text-xs text-white/45">Rhino Audiovisuales · 2026</p>
  </main>;
}
