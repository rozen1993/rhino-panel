import Link from "next/link";
import { Avatar } from "@/components/avatar";

export function TopBar({ name, initials, backHref, roleLabel }: { name: string; initials: string; backHref?: string; roleLabel?: string }) {
  return <header className="technical-surface flex min-h-[4.5rem] items-center justify-between border-b border-cyan/20 px-4 text-white shadow-[0_8px_28px_rgba(0,10,25,.16)] sm:px-6">
    <div className="flex min-w-0 items-center gap-3">
      {backHref && <Link aria-label="Volver" className="grid size-10 place-items-center rounded-md border border-white/25 bg-white/[.04] text-xl transition hover:border-lime hover:text-lime" href={backHref}>←</Link>}
      <span className="brand-condensed truncate text-xl leading-none drop-shadow sm:text-[1.7rem]">CONTROL DE ACTIVIDADES<small className="mt-1 block font-sans text-[0.5rem] font-bold tracking-[0.24em] text-cyan sm:text-[0.6rem]">RHINO AUDIOVISUALES</small></span>
    </div>
    <div className="flex items-center gap-3">
      <Avatar initials={initials} size="sm" />
      <span className="hidden leading-tight sm:block"><strong className="block text-sm">{name}</strong><small className="text-[0.6875rem] text-white/65">{roleLabel}</small></span>
      <Link className="hidden min-h-10 items-center rounded-md border border-white/30 bg-white/[.03] px-4 text-sm font-bold transition hover:border-lime hover:bg-white/[.06] hover:text-lime md:flex" href="/acceso">Cerrar sesión</Link>
    </div>
  </header>;
}
