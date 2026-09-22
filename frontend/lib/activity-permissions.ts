import type { SimulatedActivity } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";

export function canReplanActivity(item: SimulatedActivity, role: Role) {
  if (item.deletedAt || role.mustChangePassword) return false;
  return role.id === "admin" || (role.id === "operario" && role.canCreateOwnActivities &&
    Boolean(role.accountId) && item.createdByRoleId === "operario" &&
    item.createdByAccountId === role.accountId && item.responsibleAccountId === role.accountId &&
    item.status === "Programada");
}

/** Recoverable deletion only; this does not grant access to Admin's trash. */
export function canDeleteOwnActivity(item: SimulatedActivity, role: Role) {
  return role.id === "operario" && canReplanActivity(item, role);
}
