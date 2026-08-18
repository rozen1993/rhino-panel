"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roles } from "@/lib/roles";
import { SESSION_COOKIE, findTestUser } from "@/lib/session";

export async function entrar(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const user = String(formData.get("usuario") ?? "");
  const password = String(formData.get("clave") ?? "");
  const match = findTestUser(user, password);

  // Mismo mensaje para usuario inexistente y clave incorrecta: no se revela
  // cuáles cuentas existen (fase-0-concepcion.md P-1, D-026).
  if (!match) return "El usuario o la clave no son correctos.";

  const store = await cookies();
  store.set(SESSION_COOKIE, match.roleId, { path: "/", sameSite: "lax" });

  const role = roles[match.roleId];
  if (role.externalView === "aunor") redirect("/aunor");
  if (role.externalView === "burson") redirect("/burson");
  if (role.supervises) redirect("/supervision");
  redirect("/actividades");
}

export async function salir() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/acceso");
}
