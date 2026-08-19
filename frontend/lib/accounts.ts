import { roleIds, roles, type RoleId } from "@/lib/roles";

export const accountsCookieName = "rhino_cuentas_simuladas";
export type AccountHistory = { action: string; actor: string; moment: string };
export type Account = { id: string; name: string; initials: string; username: string; password: string; roleIds: RoleId[]; active: boolean; createdAt: string; updatedAt: string; updatedBy: string; history: AccountHistory[] };
export type AccountFields = Pick<Account, "name" | "username" | "password" | "roleIds">;
const createdAt = "2026-08-17T12:00:00-05:00";
export const defaultAccounts: Account[] = roleIds.map((roleId) => ({ id: `test-${roleId}`, name: roles[roleId].label, initials: roleId.slice(0, 2).toUpperCase(), username: roleId, password: `${roleId}2026`, roleIds: [roleId], active: true, createdAt, updatedAt: createdAt, updatedBy: "Sistema", history: [{ action: "Cuenta de prueba creada", actor: "Sistema", moment: createdAt }] }));
export function parseAccounts(raw: string | null): Account[] { if (!raw) return defaultAccounts; try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value as Account[] : defaultAccounts; } catch { return defaultAccounts; } }
type CompactAccount = { i: string; u: string; p: string; r: RoleId[]; a: boolean };
export function serializeAccountsCookie(accounts: Account[]) { return JSON.stringify(accounts.map((account): CompactAccount => ({ i: account.id, u: account.username, p: account.password, r: account.roleIds, a: account.active }))); }
export function parseAccountsCookie(raw: string | undefined): CompactAccount[] { if (!raw) return []; try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value as CompactAccount[] : []; } catch { return []; } }
