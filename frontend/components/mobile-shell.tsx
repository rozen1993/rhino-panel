import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { NavLabel } from "@/components/nav-bar";
import { ShellFrame } from "@/components/shell-frame";
import type { Role } from "@/lib/roles";
import { currentRole } from "@/lib/session";

export async function requireRole(
  allow?: (role: Role) => boolean,
): Promise<Role> {
  const role = await currentRole();
  if (!role) redirect("/acceso");
  if (role.mustChangePassword) redirect("/cambiar-clave");
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
  return <ShellFrame role={role} active={active} backHref={backHref}>{children}</ShellFrame>;
}
