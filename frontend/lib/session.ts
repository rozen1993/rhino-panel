import { cookies } from "next/headers";
import {
  accountsCookieName,
  defaultAccounts,
  parseAccountsCookie,
} from "@/lib/accounts";
import { resolveDataSource } from "@/lib/data-source";
import { type Role, type RoleId, roleIds, roles, isActiveRole } from "@/lib/roles";
import { currentSupabaseRole } from "@/lib/supabase/session";

export const SESSION_COOKIE = "rhino_rol_prueba_v2";
export const SESSION_ACCOUNT_COOKIE = "rhino_cuenta_prueba_v2";
export const SESSION_ACTIVE_ROLE_COOKIE = SESSION_COOKIE;

export const testUsers = defaultAccounts.map((item) => ({
  roleId: item.roleId,
  user: item.username,
  password: item.password,
  accountId: item.id,
  name: item.name,
  bursonLinked: item.bursonLinked,
  canCreateOwnActivities: item.canCreateOwnActivities,
  mustChangePassword: item.mustChangePassword,
}));

export function findTestUser(
  user: string,
  password: string,
  accountsCookie?: string,
) {
  const clean = user.trim().toLowerCase();
  const cookieAccounts = parseAccountsCookie(accountsCookie);
  const source = cookieAccounts.length
    ? cookieAccounts.map((item) => ({
        roleId: item.r,
        user: item.u,
        password: item.p,
        accountId: item.i,
        name: item.n,
        bursonLinked: item.b,
        canCreateOwnActivities: item.c,
        mustChangePassword: item.m,
        active: item.a,
      }))
    : testUsers.map((item) => ({ ...item, active: isActiveRole(item.roleId) }));
  return source.find(
    (item) => item.user === clean && item.password === password && item.active && isActiveRole(item.roleId),
  );
}

export function isRoleId(value: string | undefined): value is RoleId {
  return value !== undefined && (roleIds as readonly string[]).includes(value);
}

export async function currentRole(): Promise<Role | null> {
  if (resolveDataSource() === "supabase") return currentSupabaseRole();
  const store = await cookies();
  const roleId = store.get(SESSION_COOKIE)?.value;
  const accountId = store.get(SESSION_ACCOUNT_COOKIE)?.value;
  if (!isRoleId(roleId) || !isActiveRole(roleId) || !accountId) return null;

  const cookieAccounts = parseAccountsCookie(
    store.get(accountsCookieName)?.value,
  );
  const seed = defaultAccounts.find((item) => item.id === accountId);
  const account =
    cookieAccounts.find((item) => item.i === accountId) ??
    (seed
      ? {
          i: seed.id,
          u: seed.username,
          p: seed.password,
          r: seed.roleId,
          b: seed.bursonLinked,
          c: seed.canCreateOwnActivities,
          m: seed.mustChangePassword,
          a: seed.active,
          n: seed.name,
        }
      : undefined);
  if (!account?.a || account.r !== roleId) return null;

  return {
    ...roles[roleId],
    accountId,
    accountName: roleId === "aunor" ? "Aunor" : account.n,
    bursonLinked: false,
    canCreateOwnActivities: account.c,
    mustChangePassword: account.m,
  };
}
