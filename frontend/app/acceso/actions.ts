"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roles } from "@/lib/roles";
import { accountsCookieName, parseAccountsCookie } from "@/lib/accounts";
import { SESSION_ACCOUNT_COOKIE, SESSION_ACTIVE_ROLE_COOKIE, SESSION_COOKIE, findTestUser, isRoleId } from "@/lib/session";

export async function entrar(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const user = String(formData.get("usuario") ?? "");
  const password = String(formData.get("clave") ?? "");
  const store = await cookies();
  const match = findTestUser(user, password, store.get(accountsCookieName)?.value);

  // Mismo mensaje para usuario inexistente y clave incorrecta: no se revela
  // cuáles cuentas existen (fase-0-concepcion.md P-1, D-026).
  if (!match) return "El usuario o la clave no son correctos.";

  store.set(SESSION_COOKIE, match.roleId, { path: "/", sameSite: "lax" });
  store.set(SESSION_ACTIVE_ROLE_COOKIE, match.roleId, { path: "/", sameSite: "lax" });
  if ("accountId" in match && match.accountId) store.set(SESSION_ACCOUNT_COOKIE, match.accountId, { path: "/", sameSite: "lax" });
  else store.delete(SESSION_ACCOUNT_COOKIE);

  if ("roleIds" in match && match.roleIds.length > 1) redirect("/seleccionar-rol");
  const role = roles[match.roleId];
  if (role.externalView === "aunor") redirect("/aunor");
  if (role.externalView === "burson") redirect("/burson");
  if (role.supervises) redirect("/supervision");
  redirect("/actividades");
}

export async function salir() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SESSION_ACCOUNT_COOKIE);
  store.delete(SESSION_ACTIVE_ROLE_COOKIE);
  redirect("/acceso");
}

export async function cambiarRol(formData: FormData) {
  const requested = String(formData.get("rol") ?? "");
  const store = await cookies();
  const accountId = store.get(SESSION_ACCOUNT_COOKIE)?.value;
  const raw = store.get(accountsCookieName)?.value;
  if (!accountId || !raw || !isRoleId(requested)) redirect("/acceso");
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { redirect("/acceso"); }
  const account = parseAccountsCookie(decoded).find((candidate) => candidate.i === accountId && candidate.a);
  if (!account?.r.includes(requested)) redirect("/sin-acceso");
  store.set(SESSION_COOKIE, requested, { path: "/", sameSite: "lax" });
  store.set(SESSION_ACTIVE_ROLE_COOKIE, requested, { path: "/", sameSite: "lax" });
  const role = roles[requested];
  if (role.externalView === "aunor") redirect("/aunor");
  if (role.externalView === "burson") redirect("/burson");
  if (role.supervises) redirect("/supervision");
  redirect("/actividades");
}
