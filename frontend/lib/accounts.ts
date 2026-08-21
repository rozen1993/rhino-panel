import type { RoleId } from "@/lib/roles";
export const accountsCookieName = "rhino_cuentas_simuladas_v2";
export type AccountHistory = { action: string; actor: string; moment: string };
export type Account = { id: string; name: string; initials: string; username: string; password: string; roleId: RoleId; bursonLinked: boolean; active: boolean; createdAt: string; updatedAt: string; updatedBy: string; history: AccountHistory[] };
export type AccountFields = Pick<Account, "name" | "username" | "password" | "roleId" | "bursonLinked">;
const createdAt = "2026-01-01T08:00:00-05:00";
function account(id: string, name: string, username: string, roleId: RoleId, bursonLinked = false): Account { return { id, name, initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), username, password: `${username}2026`, roleId, bursonLinked, active: true, createdAt, updatedAt: createdAt, updatedBy: "Sistema", history: [{ action: "Cuenta de demostración creada", actor: "Sistema", moment: createdAt }] }; }
export const defaultAccounts: Account[] = [account("account-admin", "Marco Admin", "admin", "admin"), account("account-ana", "Ana Torres", "ana", "operario"), account("account-carlos", "Carlos Vega", "carlos", "operario"), account("account-burson", "Equipo Burson", "burson", "burson"), account("account-luis", "Luis Mendoza", "luis", "operario", true)];
export function parseAccounts(raw: string | null): Account[] { if (!raw) return defaultAccounts; try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value as Account[] : defaultAccounts; } catch { return defaultAccounts; } }
type CompactAccount = { i: string; u: string; p: string; r: RoleId; b: boolean; a: boolean; n: string };
export function serializeAccountsCookie(accounts: Account[]) { return JSON.stringify(accounts.map((item): CompactAccount => ({ i: item.id, u: item.username, p: item.password, r: item.roleId, b: item.bursonLinked, a: item.active, n: item.name }))); }
export function parseAccountsCookie(raw: string | undefined): CompactAccount[] { if (!raw) return []; try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value as CompactAccount[] : []; } catch { return []; } }
