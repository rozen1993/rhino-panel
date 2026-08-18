import { describe, expect, it } from "vitest";
import { activityTypes, roleIds, roleList, roles } from "@/lib/roles";
import { findTestUser, testUsers } from "@/lib/session";

describe("catálogo de roles (D-022, D-048, D-051, D-053)", () => {
  it("son ocho roles", () => {
    expect(roleIds).toHaveLength(8);
  });

  it("Operación ya no existe (D-048)", () => {
    expect(roleIds).not.toContain("operacion");
    expect(activityTypes).not.toContain("Operación");
  });

  it("Locución existe como rol de trabajo y como tipo (D-022)", () => {
    expect(roles.locucion.kind).toBe("trabajo");
    expect(activityTypes).toContain("Locución");
  });

  it("Burson es un rol externo (D-051)", () => {
    expect(roles.burson.kind).toBe("externo");
    expect(roles.burson.externalView).toBe("burson");
  });

  it("solo Supervisión supervisa y administra (D-045)", () => {
    const supervisan = roleList.filter((role) => role.supervises).map((role) => role.id);
    const administran = roleList.filter((role) => role.administers).map((role) => role.id);
    expect(supervisan).toEqual(["supervision"]);
    expect(administran).toEqual(["supervision"]);
  });

  it("Supervisión no registra trabajo de campo (D-045)", () => {
    expect(roles.supervision.activityType).toBeUndefined();
  });

  it("cada rol de trabajo registra su tipo homónimo (D-045)", () => {
    for (const role of roleList.filter((candidate) => candidate.kind === "trabajo")) {
      expect(role.activityType).toBeDefined();
      expect(activityTypes).toContain(role.activityType!);
    }
  });

  it("solo Coordinación y Supervisión ven todas las actividades (D-003, D-016)", () => {
    const globales = roleList.filter((role) => role.seesAllActivities).map((role) => role.id);
    expect(globales.sort()).toEqual(["coordinacion", "supervision"]);
  });
});

describe("usuarios de prueba (D-053)", () => {
  it("hay exactamente uno por rol", () => {
    expect(testUsers).toHaveLength(roleIds.length);
    expect(testUsers.map((u) => u.roleId).sort()).toEqual([...roleIds].sort());
  });

  it("acepta credenciales correctas y rechaza las que no lo son", () => {
    expect(findTestUser("grabacion", "grabacion2026")?.roleId).toBe("grabacion");
    expect(findTestUser("  GRABACION ", "grabacion2026")?.roleId).toBe("grabacion");
    expect(findTestUser("grabacion", "otra")).toBeUndefined();
    expect(findTestUser("noexiste", "grabacion2026")).toBeUndefined();
  });
});
