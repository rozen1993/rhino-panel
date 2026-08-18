import type { ReactNode } from "react";
import { NavBar } from "@/components/nav-bar";
import { TopBar } from "@/components/top-bar";

export function MobileShell({
  children,
  user = "Johann",
  initials = "JV",
  active = "Actividades",
  coordination = false,
  supervision = false,
  backHref,
}: {
  children: ReactNode;
  user?: string;
  initials?: string;
  active?: "Actividades" | "Historial" | "Perfil" | "Burson" | "Cuentas" | "Importar";
  coordination?: boolean;
  supervision?: boolean;
  backHref?: string;
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-paper pb-[4.75rem] md:max-w-[768px] lg:grid lg:max-w-none lg:grid-rows-[4rem_1fr] lg:pb-0">
      <TopBar backHref={backHref} initials={initials} name={user} />
      <div className="min-w-0 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] lg:block">
          <NavBar active={active} coordination={coordination} presentation="desktop" supervision={supervision} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <div className="lg:hidden"><NavBar active={active} coordination={coordination} presentation="mobile" supervision={supervision} /></div>
    </div>
  );
}
