export const roleIds = ["operario", "admin", "burson", "aunor"] as const;
export type RoleId = (typeof roleIds)[number];

export const activityTypes = [
  "Grabación",
  "Edición",
  "Creatividad",
  "Locución",
] as const;
export type ActivityType = (typeof activityTypes)[number];

export type Role = {
  id: RoleId;
  label: string;
  seesAllActivities: boolean;
  administers: boolean;
  canCreateOwnActivities: boolean;
  createsBursonRequests: boolean;
  mustChangePassword: boolean;
  bursonLinked?: boolean;
  accountId?: string;
  accountName?: string;
  summary: string;
};

export const roles: Record<RoleId, Role> = {
  aunor: {
    id: "aunor", label: "Aunor", seesAllActivities: false,
    administers: false, canCreateOwnActivities: false,
    createsBursonRequests: false, mustChangePassword: false,
    summary: "Consulta sus actividades publicadas, entregas y contrato.",
  },
  operario: {
    id: "operario",
    label: "Operario",
    seesAllActivities: false,
    administers: false,
    canCreateOwnActivities: false,
    createsBursonRequests: false,
    mustChangePassword: false,
    summary: "Ejecuta las actividades que Admin le asigna.",
  },
  admin: {
    id: "admin",
    label: "Admin",
    seesAllActivities: true,
    administers: true,
    canCreateOwnActivities: false,
    createsBursonRequests: false,
    mustChangePassword: false,
    summary: "Planifica la operación y administra cuentas y permisos.",
  },
  burson: {
    id: "burson",
    label: "Burson",
    seesAllActivities: false,
    administers: false,
    canCreateOwnActivities: false,
    createsBursonRequests: false,
    mustChangePassword: false,
    summary: "Crea y consulta exclusivamente sus propios encargos.",
  },
};

// Keep legacy IDs for historical records; never offer retired roles for access.
export const activeRoleIds = ["operario", "admin", "aunor"] as const;
export function isActiveRole(id: string): boolean { return (activeRoleIds as readonly string[]).includes(id); }
export const roleList = activeRoleIds.map((id) => roles[id]);

export function roleHome(roleId: RoleId) {
  return roleId === "aunor" ? "/aunor" : roleId === "burson" ? "/sin-acceso" : "/actividades";
}

export function allowedActivityTypes() {
  return activityTypes;
}
