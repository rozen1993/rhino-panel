import { cambiarRol } from "@/app/acceso/actions";
import { Card } from "@/components/card";
import { currentRole } from "@/lib/session";
import { roles } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function SelectRolePage() {
  const role = await currentRole();
  if (!role) redirect("/acceso");
  const available = role.availableRoleIds ?? [role.id];
  return <main className="mx-auto w-full max-w-lg space-y-4 px-4 py-10"><header><p className="text-xs font-bold uppercase text-blue">Cuenta multirrol</p><h1 className="mt-1 text-2xl font-bold">Elige cómo vas a trabajar</h1><p className="mt-2 text-sm text-ink-muted">Cada acción quedará registrada con tu cuenta y el rol activo.</p></header><div className="grid gap-3">{available.map((id) => <Card className="p-3" key={id}><form action={cambiarRol}><input name="rol" type="hidden" value={id} /><button className="min-h-11 w-full text-left font-bold text-blue" type="submit">Entrar como {roles[id].label}</button></form></Card>)}</div></main>;
}
