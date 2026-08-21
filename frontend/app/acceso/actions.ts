"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { accountsCookieName } from "@/lib/accounts";
import { SESSION_ACCOUNT_COOKIE, SESSION_COOKIE, findTestUser } from "@/lib/session";
export async function entrar(_prev: string | undefined, formData: FormData): Promise<string | undefined> { const store = await cookies(); const match = findTestUser(String(formData.get("usuario") ?? ""), String(formData.get("clave") ?? ""), store.get(accountsCookieName)?.value); if (!match) return "El usuario o la clave no son correctos."; store.set(SESSION_COOKIE, match.roleId, { path: "/", sameSite: "lax" }); store.set(SESSION_ACCOUNT_COOKIE, match.accountId, { path: "/", sameSite: "lax" }); if (match.roleId === "burson") redirect("/burson"); redirect("/actividades"); }
export async function salir() { const store = await cookies(); store.delete(SESSION_COOKIE); store.delete(SESSION_ACCOUNT_COOKIE); redirect("/acceso"); }
