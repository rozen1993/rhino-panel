import { roleIds, type RoleId } from "@/lib/roles";
export const accountsCookieName = "rhino_cuentas_simuladas_v2";
export type AccountHistory = { action: string; actor: string; moment: string };
export type Account = {
  id: string;
  name: string;
  initials: string;
  username: string;
  password: string;
  roleId: RoleId;
  bursonLinked: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history: AccountHistory[];
};
export type AccountFields = Pick<
  Account,
  "name" | "username" | "password" | "roleId" | "bursonLinked"
>;
const createdAt = "2026-01-01T08:00:00-05:00";
function account(
  id: string,
  name: string,
  username: string,
  roleId: RoleId,
  bursonLinked = false,
): Account {
  return {
    id,
    name,
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    username,
    password: `${username}2026`,
    roleId,
    bursonLinked,
    active: true,
    createdAt,
    updatedAt: createdAt,
    updatedBy: "Sistema",
    history: [
      {
        action: "Cuenta de demostración creada",
        actor: "Sistema",
        moment: createdAt,
      },
    ],
  };
}
export const defaultAccounts: Account[] = [
  account("account-admin", "Marco Admin", "admin", "admin"),
  account("account-ana", "Ana Torres", "ana", "operario"),
  account("account-carlos", "Carlos Vega", "carlos", "operario"),
  account("account-burson", "Equipo Burson", "burson", "burson"),
  account("account-luis", "Luis Mendoza", "luis", "operario", true),
];
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
function isRoleId(value: unknown): value is RoleId {
  return typeof value === "string" && roleIds.includes(value as RoleId);
}
function isAccount(value: unknown): value is Account {
  if (!isRecord(value)) return false;
  return (
    [
      "id",
      "name",
      "initials",
      "username",
      "password",
      "createdAt",
      "updatedAt",
      "updatedBy",
    ].every((key) => typeof value[key] === "string") &&
    isRoleId(value.roleId) &&
    typeof value.bursonLinked === "boolean" &&
    typeof value.active === "boolean" &&
    Array.isArray(value.history) &&
    value.history.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.action === "string" &&
        typeof entry.actor === "string" &&
        typeof entry.moment === "string",
    )
  );
}
export function parseAccounts(raw: string | null): Account[] {
  if (!raw) return defaultAccounts;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.length || !value.every(isAccount))
      return defaultAccounts;
    const hasAdmin = value.some(
      (account) => account.active && account.roleId === "admin",
    );
    const special = value.filter(
      (account) =>
        account.active && account.roleId === "operario" && account.bursonLinked,
    );
    return hasAdmin && special.length === 1 ? value : defaultAccounts;
  } catch {
    return defaultAccounts;
  }
}
type CompactAccount = {
  i: string;
  u: string;
  p: string;
  r: RoleId;
  b: boolean;
  a: boolean;
  n: string;
};
function isCompactAccount(value: unknown): value is CompactAccount {
  if (!isRecord(value)) return false;
  return (
    typeof value.i === "string" &&
    typeof value.u === "string" &&
    typeof value.p === "string" &&
    typeof value.n === "string" &&
    isRoleId(value.r) &&
    typeof value.b === "boolean" &&
    typeof value.a === "boolean"
  );
}
export function serializeAccountsCookie(accounts: Account[]) {
  return JSON.stringify(
    accounts.map((item): CompactAccount => ({
      i: item.id,
      u: item.username,
      p: item.password,
      r: item.roleId,
      b: item.bursonLinked,
      a: item.active,
      n: item.name,
    })),
  );
}
export function parseAccountsCookie(raw: string | undefined): CompactAccount[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.every(isCompactAccount) ? value : [];
  } catch {
    return [];
  }
}
