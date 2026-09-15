"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NavBar, type NavLabel } from "@/components/nav-bar";
import { TopBar } from "@/components/top-bar";
import type { Role } from "@/lib/roles";

export function ShellFrame({
  children,
  role,
  active = "Actividades",
  backHref,
}: {
  children: ReactNode;
  role: Role;
  active?: NavLabel;
  backHref?: string;
}) {
  const pathname = usePathname();
  if (role.id === "aunor") {
    active = pathname.startsWith("/aunor/contrato") || pathname.startsWith("/aunor/reemplazos") ? "Contrato" : pathname.startsWith("/aunor/historico") || pathname.startsWith("/aunor/calendario") ? "Histórico" : "Actividades";
    backHref = pathname.startsWith("/aunor/actividades/") ? "/aunor" : pathname.startsWith("/aunor/reemplazos/") ? "/aunor/contrato" : undefined;
  }
  const initials = (role.accountName ?? role.label)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className="app-surface min-h-screen bg-paper pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:grid md:grid-rows-[4.5rem_1fr] md:pb-0">
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <TopBar
        backHref={backHref}
        initials={role.id === "aunor" ? "AU" : initials}
        name={role.id === "aunor" ? "Aunor" : role.accountName ?? role.label}
        roleLabel={
          role.id === "aunor" ? "Acceso compartido" : role.bursonLinked
            ? "Operario especial · encargos Burson"
            : role.id === "operario" && role.canCreateOwnActivities
              ? "Operario · creación propia autorizada"
              : role.label
        }
      />
      <div className="min-w-0 md:grid md:grid-cols-[5.125rem_minmax(0,1fr)] lg:grid-cols-[13.625rem_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4.5rem)] md:block">
          <NavBar active={active} presentation="desktop" role={role} />
        </aside>
        <div className="min-w-0" id="contenido-principal" tabIndex={-1}>
          {children}
        </div>
      </div>
      <div className="md:hidden">
        <NavBar active={active} presentation="mobile" role={role} />
      </div>
    </div>
  );
}
