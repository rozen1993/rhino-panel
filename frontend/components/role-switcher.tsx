"use client";

import { cambiarRol } from "@/app/acceso/actions";
import { roles, type Role } from "@/lib/roles";

export function RoleSwitcher({ role }: { role: Role }) {
  if ((role.availableRoleIds?.length ?? 0) < 2) return null;
  return <form action={cambiarRol}><label className="sr-only" htmlFor="active-role">Rol activo</label><select className="min-h-9 rounded-[5px] border border-line bg-panel px-2 text-xs font-bold" defaultValue={role.id} id="active-role" name="rol" onChange={(event) => event.currentTarget.form?.requestSubmit()}>{role.availableRoleIds?.map((id) => <option key={id} value={id}>{roles[id].label}</option>)}</select></form>;
}
