import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NavBar, type NavLabel } from "@/components/nav-bar";
import { TopBar } from "@/components/top-bar";
import type { Role } from "@/lib/roles";
import { currentRole } from "@/lib/session";

export async function requireRole(
  allow?: (role: Role) => boolean,
): Promise<Role> {
  const role = await currentRole();
  if (!role) redirect("/acceso");
  if (allow && !allow(role)) redirect("/sin-acceso");
  return role;
}

export async function MobileShell({
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
        initials={initials}
        name={role.accountName ?? role.label}
        roleLabel={
          role.bursonLinked ? "Operario especial · encargos Burson" : role.label
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
