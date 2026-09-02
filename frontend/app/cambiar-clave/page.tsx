import { redirect } from "next/navigation";
import { TemporaryPasswordGate } from "@/components/temporary-password-gate";
import { resolveDataSource } from "@/lib/data-source";
import { currentRole } from "@/lib/session";

export default async function ChangeTemporaryPasswordPage() {
  const role = await currentRole();
  if (!role) redirect("/acceso");
  if (!role.mustChangePassword)
    redirect(role.id === "burson" ? "/burson" : "/actividades");
  return <TemporaryPasswordGate dataSource={resolveDataSource()} role={role} />;
}
