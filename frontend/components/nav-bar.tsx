import Link from "next/link";
import { SystemIcon, type IconName } from "@/components/system-icon";
import type { Role } from "@/lib/roles";

export type NavLabel =
  "Actividades" | "Burson" | "Cuentas" | "Histórico" | "Papelera" | "Mi panel" | "Contrato" | "Mensajes";
const destinations: {
  label: NavLabel;
  short: string;
  icon: IconName;
  href: string;
  when: (role: Role) => boolean;
}[] = [
  { label: "Mi panel", short: "Mi panel", icon: "activities", href: "/aunor", when: (role) => role.id === "aunor" },
  { label: "Contrato", short: "Contrato", icon: "complete", href: "/aunor/contrato", when: (role) => role.id === "aunor" },
  {
    label: "Actividades",
    short: "Panel",
    icon: "activities",
    href: "/actividades",
    when: (role) => role.id === "admin" || role.id === "operario",
  },
  {
    label: "Cuentas",
    short: "Cuentas",
    icon: "accounts",
    href: "/cuentas",
    when: (role) => role.id === "admin",
  },
  {
    label: "Histórico",
    short: "Histórico",
    icon: "calendar",
    href: "/historico",
    when: (role) => role.id === "admin",
  },
  {
    label: "Papelera",
    short: "Bajas",
    icon: "trash",
    href: "/papelera",
    when: (role) => role.id === "admin",
  },
];
export function destinationsFor(role: Role) {
  return destinations.filter((item) => item.when(role));
}

function NavigationLink({
  item,
  selected,
  mobile,
}: {
  item: (typeof destinations)[number];
  selected: boolean;
  mobile: boolean;
}) {
  return (
    <Link
      aria-current={selected ? "page" : undefined}
      aria-label={item.label === "Actividades" ? "Mi panel" : item.label}
      className={`relative flex min-h-14 items-center font-semibold transition duration-200 ${mobile ? "flex-col justify-center gap-1 text-[0.625rem]" : "justify-center gap-3 rounded-md border-l-[3px] px-2 text-sm lg:justify-start lg:px-4"} ${selected ? (mobile ? "text-lime after:absolute after:inset-x-4 after:bottom-0 after:h-[3px] after:bg-lime" : "border-l-cyan bg-cyan/15 text-white shadow-[inset_0_0_24px_rgba(17,183,201,.06)]") : mobile ? "text-white/70" : "border-l-transparent text-white/70 hover:bg-white/[.05] hover:text-white"}`}
      href={item.href}
    >
      <SystemIcon
        className={mobile ? "size-5" : "size-[1.35rem]"}
        name={item.icon}
      />
      <span className={mobile ? "" : "hidden lg:inline"}>
        {mobile
          ? item.short
          : item.label === "Actividades"
            ? "Mi panel"
            : item.label}
      </span>
    </Link>
  );
}

export function NavBar({
  presentation,
  active = "Actividades",
  role,
}: {
  presentation: "mobile" | "desktop";
  active?: NavLabel;
  contained?: boolean;
  role: Role;
}) {
  const mobile = presentation === "mobile";
  const items = destinationsFor(role);
  return (
    <nav
      aria-label={`Navegación ${mobile ? "móvil" : "de escritorio"}`}
      className={`${mobile ? "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,10,25,.2)]" : "technical-surface h-full border-r border-cyan/10"} bg-navy text-white`}
    >
      <ul
        className={
          mobile
            ? "mx-auto grid max-w-[480px] grid-flow-col auto-cols-fr"
            : "flex flex-col gap-1 px-2 py-5 lg:px-3"
        }
      >
        {items.map((item) => (
          <li key={item.label}>
            <NavigationLink
              item={item}
              mobile={mobile}
              selected={active === item.label}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
