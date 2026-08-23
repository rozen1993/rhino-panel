import "server-only";

import { cache } from "react";
import { profileToRole } from "@/lib/profile-role";
import type { Role } from "@/lib/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const currentSupabaseRole = cache(async (): Promise<Role | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;
  if (claimsError || typeof subject !== "string") return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_active, is_burson_operator")
    .eq("id", subject)
    .maybeSingle();
  if (error || !profile) return null;
  return profileToRole(profile);
});
