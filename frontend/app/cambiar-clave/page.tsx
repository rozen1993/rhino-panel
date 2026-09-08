import { redirect } from "next/navigation";
import { roleHome } from "@/lib/roles";
import { TemporaryPasswordGate } from "@/components/temporary-password-gate";
import { resolveDataSource } from "@/lib/data-source";
import { currentRole } from "@/lib/session";

export default async function ChangeTemporaryPasswordPage() {
  const role = await currentRole();
  if (!role) redirect("/acceso");
  if (!role.mustChangePassword)
    redirect(roleHome(role.id));
  return <TemporaryPasswordGate dataSource={resolveDataSource()} role={role} />;
}
