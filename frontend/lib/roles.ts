export const roleIds = ["operario", "admin", "burson"] as const;
export type RoleId = (typeof roleIds)[number];
export const activityTypes = ["Grabación", "Edición", "Creatividad", "Locución"] as const;
export type ActivityType = (typeof activityTypes)[number];
export type Role = { id: RoleId; label: string; seesAllActivities: boolean; administers: boolean; createsOwnActivities: boolean; createsBursonRequests: boolean; bursonLinked?: boolean; accountId?: string; accountName?: string; summary: string };
export const roles: Record<RoleId, Role> = {
  operario: { id: "operario", label: "Operario", seesAllActivities: false, administers: false, createsOwnActivities: true, createsBursonRequests: false, summary: "Registra, ejecuta y entrega sus propias actividades." },
  admin: { id: "admin", label: "Admin", seesAllActivities: true, administers: true, createsOwnActivities: false, createsBursonRequests: false, summary: "Ve toda la operación, conversa con responsables y administra cuentas." },
  burson: { id: "burson", label: "Burson", seesAllActivities: false, administers: false, createsOwnActivities: false, createsBursonRequests: true, summary: "Deja encargos para el operario vinculado y consulta sus resultados." },
};
export const roleList = roleIds.map((id) => roles[id]);
export function allowedActivityTypes(role: Role): readonly ActivityType[] { return role.id === "operario" || role.id === "burson" ? activityTypes : []; }
