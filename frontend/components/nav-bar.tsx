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

function NavigationLink({ item, selected, mobile }: { item: (typeof destinations)[number]; selected: boolean; mobile: boolean }) {
  return <Link aria-current={selected ? "page" : undefined} className={`relative flex min-h-14 items-center font-semibold transition duration-200 ${mobile ? "flex-col justify-center gap-1 text-[0.625rem]" : "justify-center gap-3 rounded-md border-l-[3px] px-2 text-sm lg:justify-start lg:px-4"} ${selected ? mobile ? "text-lime after:absolute after:inset-x-4 after:bottom-0 after:h-[3px] after:bg-lime" : "border-l-cyan bg-cyan/15 text-white shadow-[inset_0_0_24px_rgba(17,183,201,.06)]" : mobile ? "text-white/70" : "border-l-transparent text-white/70 hover:bg-white/[.05] hover:text-white"}`} href={item.href}><SystemIcon className={mobile ? "size-5" : "size-[1.35rem]"} name={item.icon} /><span className={mobile ? "" : "hidden lg:inline"}>{mobile ? item.short : item.label === "Actividades" ? "Mi panel" : item.label}</span></Link>;
}

export function NavBar({ presentation, active = "Actividades", role }: { presentation: "mobile" | "desktop"; active?: NavLabel; contained?: boolean; role: Role }) {
  const mobile = presentation === "mobile";
  const items = destinationsFor(role);
  return <nav aria-label={`Navegación ${mobile ? "móvil" : "de escritorio"}`} className={`${mobile ? "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,10,25,.2)]" : "technical-surface h-full border-r border-cyan/10"} bg-navy text-white`}>
    <ul className={mobile ? "mx-auto grid max-w-[480px] grid-flow-col auto-cols-fr" : "flex flex-col gap-1 px-2 py-5 lg:px-3"}>
      {items.map((item, index) => <li key={item.label}><NavigationLink item={item} mobile={mobile} selected={active === item.label} />{!mobile && index === 0 && role.id === "operario" && <Link className="action-surface mt-1 flex min-h-12 items-center justify-center gap-2 rounded-md px-2 text-sm font-extrabold text-[#173000] shadow-[0_7px_18px_rgba(95,170,0,.2)] transition hover:-translate-y-px lg:justify-start lg:px-4" href="/actividades/nueva"><SystemIcon className="size-5" name="add" /><span className="hidden lg:inline">Nueva actividad</span></Link>}</li>)}
    </ul>
    {!mobile && <div className="mx-5 mt-5 hidden border-t border-white/15 pt-6 lg:block"><label className="data-label text-cyan" htmlFor="nav-year">Año</label><select className="mt-2 min-h-12 w-full rounded-md border border-white/25 bg-[#062641] px-4 text-sm font-bold text-white outline-none focus:border-lime" defaultValue="2026" id="nav-year"><option>2026</option></select></div>}
  </nav>;
}
