import "server-only";

import type {
  Account,
  AccountHistory,
  AssignableOperator,
} from "@/lib/accounts";
import type { Database } from "@/lib/supabase/database.types";
import {
  advanceNumericCursor,
  advanceStringCursor,
  supabasePageSize,
} from "@/lib/supabase/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AccountAuditRow =
  Database["public"]["Tables"]["account_audit_events"]["Row"];
type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

async function fetchAllProfiles(supabase: SupabaseServerClient) {
  const rows: ProfileRow[] = [];
  let cursor: string | null = null;
  for (;;) {
    let query = supabase.from("profiles").select("*");
    if (cursor !== null) query = query.gt("id", cursor);
    const { data, error } = await query
      .order("id", { ascending: true })
      .limit(supabasePageSize);
    if (error)
      throw new Error(`No se pudo cargar el directorio: ${error.message}`);
    const page = (data ?? []) as ProfileRow[];
    if (!page.length) break;
    rows.push(...page);
    cursor = advanceStringCursor(page, cursor, "perfiles");
  }
  return rows;
}

async function fetchAssignableProfileRows(supabase: SupabaseServerClient) {
  const rows: Pick<
    ProfileRow,
    "id" | "display_name" | "is_burson_operator"
  >[] = [];
  let cursor: string | null = null;
  for (;;) {
    let query = supabase
      .from("profiles")
      .select("id, display_name, is_burson_operator")
      .eq("role", "operario")
      .eq("is_active", true);
    if (cursor !== null) query = query.gt("id", cursor);
    const { data, error } = await query
      .order("id", { ascending: true })
      .limit(supabasePageSize);
    if (error)
      throw new Error(`No se pudo cargar el equipo: ${error.message}`);
    const page = data ?? [];
    if (!page.length) break;
    rows.push(...page);
    cursor = advanceStringCursor(page, cursor, "operarios asignables");
  }
  return rows;
}

async function fetchAccountAudits(supabase: SupabaseServerClient) {
  const rows: AccountAuditRow[] = [];
  let cursor = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("account_audit_events")
      .select("*")
      .gt("id", cursor)
      .order("id", { ascending: true })
      .limit(supabasePageSize);
    if (error)
      throw new Error(`No se pudo cargar la auditoria: ${error.message}`);
    const page = (data ?? []) as AccountAuditRow[];
    if (!page.length) break;
    rows.push(...page);
    cursor = advanceNumericCursor(page, cursor, "auditoria de cuentas");
  }
  return rows;
}

export async function listAssignableOperators(): Promise<
  AssignableOperator[]
> {
  const supabase = await createSupabaseServerClient();
  const rows = await fetchAssignableProfileRows(supabase);
  return rows
    .sort(
      (left, right) =>
        left.display_name.localeCompare(right.display_name) ||
        left.id.localeCompare(right.id),
    )
    .map((profile) => ({
      id: profile.id,
      name: profile.display_name,
      bursonLinked: profile.is_burson_operator,
    }));
}

export async function listSupabaseAccounts(): Promise<Account[]> {
  const supabase = await createSupabaseServerClient();
  const [profiles, audits] = await Promise.all([
    fetchAllProfiles(supabase),
    fetchAccountAudits(supabase),
  ]);
  const auditsByProfile = new Map<string, AccountAuditRow[]>();
  audits.forEach((entry) => {
    const current = auditsByProfile.get(entry.target_profile_id) ?? [];
    current.push(entry);
    auditsByProfile.set(entry.target_profile_id, current);
  });

  return profiles
    .sort(
      (left, right) =>
        left.display_name.localeCompare(right.display_name) ||
        left.id.localeCompare(right.id),
    )
    .map((profile): Account => {
    const history: AccountHistory[] = (auditsByProfile.get(profile.id) ?? [])
      .sort(
        (left, right) =>
          right.created_at.localeCompare(left.created_at) || right.id - left.id,
      )
      .map((entry) => ({
        action: entry.action,
        actor: entry.actor_name,
        moment: entry.created_at,
      }));
    return {
      id: profile.id,
      name: profile.display_name,
      initials: profile.display_name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
      username: profile.username,
      // Auth nunca expone hashes ni claves al panel. Este campo existe solo
      // para que el mismo componente pueda operar en el modo demo.
      password: "",
      roleId: profile.role,
      bursonLinked: profile.is_burson_operator,
      canCreateOwnActivities: profile.can_create_own_activities,
      mustChangePassword: profile.must_change_password,
      active: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      updatedBy: history[0]?.actor ?? "Sistema",
      history,
    };
    });
}
