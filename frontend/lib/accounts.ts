import { roleIds, type RoleId } from "@/lib/roles";

export const accountsCookieName = "rhino_cuentas_simuladas_v3";

export type AccountHistory = {
  action: string;
  actor: string;
  moment: string;
};

export type Account = {
  id: string;
  name: string;
  initials: string;
  username: string;
  password: string;
  roleId: RoleId;
  bursonLinked: boolean;
  canCreateOwnActivities: boolean;
  mustChangePassword: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history: AccountHistory[];
};

export type AccountFields = Pick<
  Account,
  | "name"
  | "username"
  | "password"
  | "roleId"
  | "bursonLinked"
  | "canCreateOwnActivities"
>;

export type AssignableOperator = {
  id: string;
  name: string;
  bursonLinked: boolean;
};

const createdAt = "2026-01-01T08:00:00-05:00";

function account(
  id: string,
  name: string,
  username: string,
  roleId: RoleId,
  bursonLinked = false,
  canCreateOwnActivities = false,
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
    canCreateOwnActivities,
    mustChangePassword: false,
    active: true,
    createdAt,
    updatedAt: createdAt,
    updatedBy: "Sistema",
    history: [
      {
        action: canCreateOwnActivities
          ? "Cuenta demo creada con permiso de creación propia"
          : "Cuenta de demostración creada",
        actor: "Sistema",
        moment: createdAt,
      },
    ],
  };
}

export const defaultAccounts: Account[] = [
  account("account-admin", "Marco Admin", "admin", "admin"),
  account("account-ana", "Ana Torres", "ana", "operario", false, true),
  account("account-carlos", "Carlos Vega", "carlos", "operario"),
  { ...account("account-burson", "Equipo Burson", "burson", "burson"), active: false },
  account("account-luis", "Luis Mendoza", "luis", "operario"),
  account("account-aunor", "Aunor", "aunor", "aunor"),
];

// Normalize legacy accounts in memory only; never discard their IDs or history.
export function retireBursonAccounts(accounts: Account[]): Account[] {
  return accounts.map(item => item.roleId === "burson"
    ? { ...item, active: false, bursonLinked: false, canCreateOwnActivities: false }
    : item.bursonLinked ? { ...item, bursonLinked: false } : item);
}

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
    typeof value.canCreateOwnActivities === "boolean" &&
    typeof value.mustChangePassword === "boolean" &&
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
    const normalized = retireBursonAccounts(value);
    const hasAdmin = normalized.some(
      (item) => item.active && item.roleId === "admin",
    );
    const capabilitiesMatchRole = normalized.every(
      (item) =>
        (!item.bursonLinked ||
          (item.active && item.roleId === "operario")) &&
        (!item.canCreateOwnActivities ||
          (item.active && item.roleId === "operario")),
    );
    return hasAdmin &&
      value.filter((item) => item.active && item.roleId === "aunor").length <= 1 &&
      capabilitiesMatchRole
      ? normalized
      : defaultAccounts;
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
  c: boolean;
  m: boolean;
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
    typeof value.c === "boolean" &&
    typeof value.m === "boolean" &&
    typeof value.a === "boolean"
  );
}

function hasCompactAccountInvariants(accounts: CompactAccount[]) {
  return (
    accounts.length > 0 &&
    accounts.some((item) => item.a && item.r === "admin") &&
    accounts.every((item) => item.r !== "burson" || !item.a) &&
    accounts.filter((item) => item.a && item.r === "aunor").length <= 1 &&
    accounts.every((item) => !item.b) &&
    accounts.every(
      (item) =>
        (!item.b || (item.a && item.r === "operario")) &&
        (!item.c || (item.a && item.r === "operario")),
    )
  );
}

export function serializeAccountsCookie(accounts: Account[]) {
  return JSON.stringify(
    accounts.map(
      (item): CompactAccount => ({
        i: item.id,
        u: item.username,
        p: item.password,
        r: item.roleId,
        b: item.bursonLinked,
        c: item.canCreateOwnActivities,
        m: item.mustChangePassword,
        a: item.active,
        n: item.name,
      }),
    ),
  );
}

export function parseAccountsCookie(raw: string | undefined): CompactAccount[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(isCompactAccount)) return [];
    const normalized = value.map(item => ({ ...item, b: false, a: item.r === "burson" ? false : item.a, c: item.r === "burson" ? false : item.c }));
    return hasCompactAccountInvariants(normalized) ? normalized : [];
  } catch {
    return [];
  }
}
