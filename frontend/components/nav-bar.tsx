import Link from "next/link";
import { SystemIcon, type IconName } from "@/components/system-icon";
import type { Role } from "@/lib/roles";

export type NavLabel = "Actividades" | "Burson" | "Cuentas" | "Histórico";
const destinations: { label: NavLabel; short: string; icon: IconName; href: string; when: (role: Role) => boolean }[] = [
  { label: "Actividades", short: "Panel", icon: "activities", href: "/actividades", when: (role) => role.id !== "burson" },
  { label: "Burson", short: "Burson", icon: "burson", href: "/burson", when: (role) => role.id === "burson" || Boolean(role.bursonLinked) || role.id === "admin" },
  { label: "Cuentas", short: "Cuentas", icon: "accounts", href: "/cuentas", when: (role) => role.id === "admin" },
  { label: "Histórico", short: "Histórico", icon: "calendar", href: "/historico", when: (role) => role.id === "admin" },
];
export function destinationsFor(role: Role) { return destinations.filter((item) => item.when(role)); }

export function NavBar({ presentation, active = "Actividades", role }: { presentation: "mobile" | "desktop"; active?: NavLabel; contained?: boolean; role: Role }) {
  const mobile = presentation === "mobile";
  return <nav aria-label={`Navegación ${mobile ? "móvil" : "de escritorio"}`} className={`${mobile ? "fixed inset-x-0 bottom-0 z-50 border-t border-white/10" : "technical-surface h-full"} bg-navy text-white`}>
    <ul className={mobile ? "mx-auto grid max-w-[480px] grid-flow-col auto-cols-fr" : "flex flex-col gap-1 px-2 py-5 lg:px-3"}>
      {destinationsFor(role).map((item) => { const selected = active === item.label; return <li key={item.label}><Link aria-current={selected ? "page" : undefined} className={`relative flex min-h-16 items-center font-semibold transition ${mobile ? "flex-col justify-center gap-1 text-[0.625rem]" : "justify-center gap-3 rounded-md border-l-[3px] px-2 text-sm lg:justify-start lg:px-4"} ${selected ? mobile ? "text-amber after:absolute after:inset-x-4 after:bottom-0 after:h-[3px] after:bg-amber" : "border-l-blue bg-blue/15 text-white" : mobile ? "text-white/75" : "border-l-transparent text-white/75 hover:bg-white/5 hover:text-white"}`} href={item.href}><SystemIcon className={mobile ? "size-5" : "size-6"} name={item.icon} /><span className={mobile ? "" : "hidden lg:inline"}>{mobile ? item.short : item.label === "Actividades" ? "Mi panel" : item.label}</span></Link></li>; })}
    </ul>
    {!mobile && <div className="mx-5 mt-6 hidden border-t border-white/15 pt-6 lg:block"><p className="text-[0.625rem] font-bold tracking-[0.14em] text-blue">AÑO</p><div className="mt-2 rounded-md border border-white/25 px-4 py-3 text-sm font-bold">2026 <span className="float-right">⌄</span></div></div>}
  </nav>;
}
