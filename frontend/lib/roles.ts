export const roleIds = ["operario", "admin", "burson"] as const;
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
    createsBursonRequests: true,
    mustChangePassword: false,
    summary: "Crea y consulta exclusivamente sus propios encargos.",
  },
};

export const roleList = roleIds.map((id) => roles[id]);

export function allowedActivityTypes() {
  return activityTypes;
}
