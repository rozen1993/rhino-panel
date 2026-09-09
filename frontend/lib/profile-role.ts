import { roles, isActiveRole, type Role, type RoleId } from "@/lib/roles";

export type ProfileRoleRow = {
  id: string;
  display_name: string;
  role: RoleId;
  is_active: boolean;
  is_burson_operator: boolean;
  can_create_own_activities: boolean;
  must_change_password: boolean;
};

export function profileToRole(profile: ProfileRoleRow): Role | null {
  if (!profile.is_active || !isActiveRole(profile.role) || !roles[profile.role]) return null;
  return {
    ...roles[profile.role],
    accountId: profile.id,
    accountName: profile.role === "aunor" ? "Aunor" : profile.display_name,
    bursonLinked: false,
    canCreateOwnActivities: profile.can_create_own_activities,
    mustChangePassword: profile.must_change_password,
  };
}
