import { cookies } from "next/headers";
import { accountsCookieName, defaultAccounts, parseAccountsCookie } from "@/lib/accounts";
import { type Role, type RoleId, roleIds, roles } from "@/lib/roles";
export const SESSION_COOKIE = "rhino_rol_prueba_v2";
export const SESSION_ACCOUNT_COOKIE = "rhino_cuenta_prueba_v2";
export const SESSION_ACTIVE_ROLE_COOKIE = SESSION_COOKIE;
export const testUsers = defaultAccounts.map((item) => ({ roleId: item.roleId, user: item.username, password: item.password, accountId: item.id, name: item.name, bursonLinked: item.bursonLinked }));
export function findTestUser(user: string, password: string, accountsCookie?: string) { const clean = user.trim().toLowerCase(); const cookieAccounts = parseAccountsCookie(accountsCookie); const source = cookieAccounts.length ? cookieAccounts.map((item) => ({ roleId: item.r, user: item.u, password: item.p, accountId: item.i, name: item.n, bursonLinked: item.b, active: item.a })) : testUsers.map((item) => ({ ...item, active: true })); return source.find((item) => item.user === clean && item.password === password && item.active); }
export function isRoleId(value: string | undefined): value is RoleId { return value !== undefined && (roleIds as readonly string[]).includes(value); }
export async function currentRole(): Promise<Role | null> { const store = await cookies(); const roleId = store.get(SESSION_COOKIE)?.value; const accountId = store.get(SESSION_ACCOUNT_COOKIE)?.value; if (!isRoleId(roleId) || !accountId) return null; const cookieAccounts = parseAccountsCookie(store.get(accountsCookieName)?.value); const seed = defaultAccounts.find((item) => item.id === accountId); const account = cookieAccounts.find((item) => item.i === accountId) ?? (seed ? { i: seed.id, u: seed.username, p: seed.password, r: seed.roleId, b: seed.bursonLinked, a: seed.active, n: seed.name } : undefined); if (!account?.a || account.r !== roleId) return null; return { ...roles[roleId], accountId, accountName: account.n, bursonLinked: account.b };
}
