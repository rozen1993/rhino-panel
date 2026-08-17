import { SystemIcon, type IconName } from "@/components/system-icon";

const destinations: readonly { label: "Actividades" | "Historial" | "Perfil" | "Burson" | "Cuentas" | "Importar"; icon: IconName; href: string; coordinationOnly?: boolean; supervisionOnly?: boolean }[] = [
  { label: "Actividades", icon: "activities", href: "/actividades" },
  { label: "Historial", icon: "history", href: "/historial" },
  { label: "Burson", icon: "burson", href: "/burson", coordinationOnly: true },
  { label: "Cuentas", icon: "accounts", href: "/cuentas", supervisionOnly: true },
  { label: "Importar", icon: "import", href: "/importacion", supervisionOnly: true },
  { label: "Perfil", icon: "profile", href: "#" },
];

type NavBarProps = { presentation: "mobile" | "desktop"; active?: (typeof destinations)[number]["label"]; contained?: boolean; coordination?: boolean; supervision?: boolean };

export function NavBar({ presentation, active = "Actividades", contained = false, coordination = false, supervision = false }: NavBarProps) {
  const mobile = presentation === "mobile";
  const placement = mobile ? (contained ? "absolute inset-x-0 bottom-0" : "fixed inset-x-0 bottom-0 z-50") : "h-full w-full";
  const visibleDestinations = destinations.filter((destination) => (!destination.coordinationOnly || coordination || supervision) && (!destination.supervisionOnly || supervision));
  return (
    <nav aria-label={`Navegación ${mobile ? "móvil" : "de escritorio"}`} className={`${placement} border-line bg-panel ${mobile ? "border-t" : "border-r"}`}>
      <ul className={mobile ? "mx-auto grid max-w-[390px] grid-flow-col auto-cols-fr" : "flex flex-col py-5"}>
        {visibleDestinations.map((destination) => {
          const selected = destination.label === active;
          return (
            <li key={destination.label}>
              <a aria-current={selected ? "page" : undefined} className={`relative flex min-h-16 items-center font-semibold ${mobile ? "flex-col justify-center gap-1 px-1 pb-1 pt-2 text-center text-[0.625rem]" : "gap-3 border-l-[3px] px-5 py-4 text-sm"} ${selected ? (mobile ? "text-blue after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-blue" : "border-l-blue bg-panel-secondary text-blue") : (mobile ? "text-ink" : "border-l-transparent text-ink")}`} href={destination.href}>
                <SystemIcon className={mobile ? "size-5" : "size-6"} name={destination.icon} /><span>{destination.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
