import { describe, expect, it } from "vitest";
import { activityTypes, roleIds, roleList, roles } from "@/lib/roles";
import { findTestUser, testUsers } from "@/lib/session";

describe("catalogo de roles", () => {
  it("mantiene ocho roles y cuatro tipos operativos", () => { expect(roleIds).toHaveLength(8); expect(activityTypes).toHaveLength(4); expect(activityTypes).not.toContain(roles.coordinacion.label); });
  it("solo Coordinacion crea ordenes", () => { expect(roleList.filter((role) => role.createsOrders).map((role) => role.id)).toEqual(["coordinacion"]); expect(roles.coordinacion.activityType).toBeUndefined(); });
  it("solo Supervision evalua y administra cuentas", () => { expect(roleList.filter((role) => role.supervises).map((role) => role.id)).toEqual(["supervision"]); expect(roleList.filter((role) => role.administers).map((role) => role.id)).toEqual(["supervision"]); });
  it("Coordinacion y Supervision ven todas las actividades", () => { expect(roleList.filter((role) => role.seesAllActivities).map((role) => role.id).sort()).toEqual(["coordinacion", "supervision"]); });
  it("mantiene un usuario de prueba por rol", () => { expect(testUsers).toHaveLength(roleIds.length); expect(findTestUser("grabacion", "grabacion2026")?.roleId).toBe("grabacion"); expect(findTestUser("grabacion", "otra")).toBeUndefined(); });
});
