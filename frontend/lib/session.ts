import { cookies } from "next/headers";
import { type Role, type RoleId, roleIds, roles } from "@/lib/roles";
import { accountsCookieName, parseAccountsCookie } from "@/lib/accounts";

/**
 * Sesión SIMULADA de Fase 2 (D-053).
 *
 * No hay servidor, ni autenticación, ni base de datos. Esto es una cookie sin
 * firmar que dice qué rol se está probando, para poder recorrer la aplicación
 * como cada uno de los ocho roles.
 *
 * NO PROTEGE NADA. Cualquiera puede cambiar la cookie a mano. La autenticación
 * real es Fase 5, y estas credenciales temporales se eliminan en Fase 9, como
 * exige CLAUDE.md.
 */

export const SESSION_COOKIE = "rhino_rol_prueba";
export const SESSION_ACCOUNT_COOKIE = "rhino_cuenta_prueba";
export const SESSION_ACTIVE_ROLE_COOKIE = "rhino_rol_activo_prueba";

/** Un usuario de prueba por rol (D-053). Credenciales simuladas, no secretas. */
export const testUsers: readonly { roleId: RoleId; roleIds: readonly RoleId[]; user: string; password: string; accountId: string }[] = roleIds.map((id) => ({
  roleId: id,
  roleIds: [id],
  user: id,
  password: `${id}2026`,
  accountId: `test-${id}`,
}));

export function findTestUser(user: string, password: string, accountsCookie?: string) {
  const clean = user.trim().toLowerCase();
  if (accountsCookie) {
    let decoded = accountsCookie;
    try { decoded = decodeURIComponent(accountsCookie); } catch { /* cookie inválida: el parser devolverá vacío */ }
    const account = parseAccountsCookie(decoded).find((candidate) => candidate.u.toLowerCase() === clean && candidate.p === password && candidate.a && candidate.r.length > 0);
    return account ? { roleId: account.r[0], roleIds: account.r, user: account.u, password: account.p, accountId: account.i } : undefined;
  }
  return testUsers.find((candidate) => candidate.user === clean && candidate.password === password);
}

export function isRoleId(value: string | undefined): value is RoleId {
  return value !== undefined && (roleIds as readonly string[]).includes(value);
}

/** El rol de la sesión actual, o null si no se ha entrado. */
export async function currentRole(): Promise<Role | null> {
  const store = await cookies();
  const accountId = store.get(SESSION_ACCOUNT_COOKIE)?.value;
  const accountsCookie = store.get(accountsCookieName)?.value;
  let accountName: string | undefined;
  let availableRoleIds: RoleId[] | undefined;
  if (accountId && accountsCookie) {
    let decoded = accountsCookie;
    try { decoded = decodeURIComponent(accountsCookie); } catch { return null; }
    const account = parseAccountsCookie(decoded).find((candidate) => candidate.i === accountId);
    if (!account?.a) return null;
    availableRoleIds = account.r;
    accountName = account.u;
  }
  const value = store.get(SESSION_ACTIVE_ROLE_COOKIE)?.value ?? store.get(SESSION_COOKIE)?.value;
  if (!isRoleId(value) || (availableRoleIds && !availableRoleIds.includes(value))) return null;
  return { ...roles[value], accountId, accountName, availableRoleIds };
}
