import { cookies } from "next/headers";
import { type Role, type RoleId, roleIds, roles } from "@/lib/roles";

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

/** Un usuario de prueba por rol (D-053). Credenciales simuladas, no secretas. */
export const testUsers: readonly { roleId: RoleId; user: string; password: string }[] = roleIds.map((id) => ({
  roleId: id,
  user: id,
  password: `${id}2026`,
}));

export function findTestUser(user: string, password: string) {
  const clean = user.trim().toLowerCase();
  return testUsers.find((candidate) => candidate.user === clean && candidate.password === password);
}

export function isRoleId(value: string | undefined): value is RoleId {
  return value !== undefined && (roleIds as readonly string[]).includes(value);
}

/** El rol de la sesión actual, o null si no se ha entrado. */
export async function currentRole(): Promise<Role | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return isRoleId(value) ? roles[value] : null;
}
