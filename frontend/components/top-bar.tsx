import Link from "next/link";
import { Avatar } from "@/components/avatar";

export function TopBar({ name, initials, backHref, roleLabel }: { name: string; initials: string; backHref?: string; roleLabel?: string }) {
  return <header className="technical-surface flex min-h-[4.5rem] items-center justify-between px-4 text-white sm:px-6">
    <div className="flex min-w-0 items-center gap-3">
      {backHref && <Link aria-label="Volver" className="grid size-10 place-items-center rounded-md border border-white/25 text-xl" href={backHref}>←</Link>}
      <span className="brand-condensed truncate text-lg leading-none sm:text-2xl">CONTROL DE ACTIVIDADES<small className="mt-1 block font-sans text-[0.55rem] font-semibold tracking-[0.2em] text-blue sm:text-[0.625rem]">RHINO AUDIOVISUALES</small></span>
    </div>
    <div className="flex items-center gap-3">
      <Avatar initials={initials} size="sm" />
      <span className="hidden leading-tight sm:block"><strong className="block text-sm">{name}</strong><small className="text-[0.6875rem] text-white/65">{roleLabel}</small></span>
      <Link className="hidden min-h-10 items-center rounded-md border border-white/30 px-4 text-sm font-bold hover:border-amber hover:text-amber md:flex" href="/acceso">Cerrar sesión</Link>
    </div>
  </header>;
}
