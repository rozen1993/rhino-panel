import { roles, type Role, type RoleId } from "@/lib/roles";

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
  if (!profile.is_active) return null;
  return {
    ...roles[profile.role],
    accountId: profile.id,
    accountName: profile.display_name,
    bursonLinked: profile.is_burson_operator,
    canCreateOwnActivities: profile.can_create_own_activities,
    mustChangePassword: profile.must_change_password,
  };
}
