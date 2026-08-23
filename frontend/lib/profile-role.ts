import { roles, type Role, type RoleId } from "@/lib/roles";

export type ProfileRoleRow = {
  id: string;
  display_name: string;
  role: RoleId;
  is_active: boolean;
  is_burson_operator: boolean;
};

export function profileToRole(profile: ProfileRoleRow): Role | null {
  if (!profile.is_active) return null;
  return {
    ...roles[profile.role],
    accountId: profile.id,
    accountName: profile.display_name,
    bursonLinked: profile.is_burson_operator,
  };
}
