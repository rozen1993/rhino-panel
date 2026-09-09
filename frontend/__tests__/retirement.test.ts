import { describe, expect, it } from "vitest";
import { defaultAccounts, parseAccounts } from "@/lib/accounts";
import { profileToRole } from "@/lib/profile-role";
import { replacementsForService } from "@/lib/aunor";
import { createAunorExamples } from "@/lib/aunor-examples";
import { activeRoleIds } from "@/lib/roles";

describe("retirada sin pérdida de registros", () => {
  it("normaliza las cuentas antiguas sin perder IDs, nombres ni credenciales", () => {
    const historical = defaultAccounts.map(a => ({
      ...a, name: a.name + " personalizado", password: "Conservada8!",
      active: true, bursonLinked: a.id === "account-luis",
    }));
    const original = JSON.stringify(historical);
    const accounts = parseAccounts(original);
    expect(accounts.map(a => a.id)).toEqual(historical.map(a => a.id));
    expect(accounts.every(a => a.password === "Conservada8!")).toBe(true);
    expect(accounts.every(a => a.name.endsWith(" personalizado"))).toBe(true);
    expect(accounts.find(a => a.roleId === "burson")?.active).toBe(false);
    expect(accounts.find(a => a.id === "account-luis")).toMatchObject({active:true,roleId:"operario",bursonLinked:false});
    expect(JSON.stringify(historical)).toBe(original);
    expect(activeRoleIds).toEqual(["operario","admin","aunor"]);
  });
  it("un perfil Burson incluso activo no obtiene sesión de aplicación", () => {
    expect(profileToRole({id:"archived",display_name:"Burson",role:"burson",is_active:true,is_burson_operator:false,can_create_own_activities:false,must_change_password:false})).toBeNull();
  });
  it("Observado permanece tras confirmar o corregir el reemplazo, sin marcar otros servicios", () => {
    const w = createAunorExamples();
    const replacement = w.replacements[0];
    const service = w.activities.find(a => a.id === replacement.original_activity_id)!.service_id!;
    expect(replacementsForService(w, service)).toContain(replacement);
    replacement.confirmed_at = "2026-09-08T12:00:00-05:00";
    replacement.confirmed_by = "Aunor";
    replacement.is_current = false;
    expect(replacementsForService(w, service)).toContain(replacement);
    expect(replacementsForService(w, "sin-reemplazos")).toEqual([]);
    expect(w.replacements[0]).toBe(replacement);
  });
});
