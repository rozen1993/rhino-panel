import Link from "next/link";
import { SystemIcon, type IconName } from "@/components/system-icon";
import type { Role } from "@/lib/roles";
export type NavLabel = "Actividades" | "Burson" | "Cuentas" | "Histórico";
const destinations: { label: NavLabel; icon: IconName; href: string; when: (role: Role) => boolean }[] = [
  { label: "Actividades", icon: "activities", href: "/actividades", when: (role) => role.id !== "burson" },
  { label: "Burson", icon: "burson", href: "/burson", when: (role) => role.id === "burson" || Boolean(role.bursonLinked) || role.id === "admin" },
  { label: "Cuentas", icon: "accounts", href: "/cuentas", when: (role) => role.id === "admin" },
  { label: "Histórico", icon: "calendar", href: "/historico", when: (role) => role.id === "admin" },
];
export function destinationsFor(role: Role) { return destinations.filter((item) => item.when(role)); }
export function NavBar({ presentation, active = "Actividades", role }: { presentation: "mobile" | "desktop"; active?: NavLabel; contained?: boolean; role: Role }) { const mobile = presentation === "mobile"; return <nav aria-label={`Navegación ${mobile ? "móvil" : "de escritorio"}`} className={`${mobile ? "fixed inset-x-0 bottom-0 z-50 border-t" : "h-full border-r"} border-line bg-panel`}><ul className={mobile ? "mx-auto grid max-w-[430px] grid-flow-col auto-cols-fr" : "flex flex-col py-5"}>{destinationsFor(role).map((item) => { const selected = active === item.label; return <li key={item.label}><Link aria-current={selected ? "page" : undefined} className={`relative flex min-h-16 items-center font-semibold ${mobile ? "flex-col justify-center gap-1 text-[0.625rem]" : "gap-3 border-l-[3px] px-5 py-4 text-sm"} ${selected ? mobile ? "text-amber after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-amber" : "border-l-amber bg-panel-secondary text-blue" : mobile ? "text-ink" : "border-l-transparent"}`} href={item.href}><SystemIcon className={mobile ? "size-5" : "size-6"} name={item.icon} /><span>{item.label}</span></Link></li>; })}</ul></nav>; }
