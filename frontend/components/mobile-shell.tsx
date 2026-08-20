import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { TopBar } from "@/components/top-bar";
import type { Role } from "@/lib/roles";
import { currentRole } from "@/lib/session";

type ShellActive = "Actividades" | "Historial" | "Burson" | "Cuentas" | "Histórico" | "Supervisión";

/**
 * Devuelve el rol de la sesión simulada, o manda al acceso si no hay ninguna.
 * Si se pasa `allow`, el rol además tiene que estar en esa lista (D-045).
 */
export async function requireRole(allow?: (role: Role) => boolean): Promise<Role> {
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
  active?: ShellActive;
  backHref?: string;
}) {
  const initials = role.label.slice(0, 2).toUpperCase();
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-paper pb-[4.75rem] md:max-w-[768px] lg:grid lg:max-w-none lg:grid-rows-[4rem_1fr] lg:pb-0">
      <TopBar backHref={backHref} initials={initials} name={role.accountName ?? role.label} role={role} />
      <div className="min-w-0 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] lg:block">
          <NavBar active={active} presentation="desktop" role={role} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <div className="lg:hidden"><NavBar active={active} presentation="mobile" role={role} /></div>
    </div>
  );
}
