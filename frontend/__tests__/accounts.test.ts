import { describe, expect, it } from "vitest";
import { readAccounts, toggleAccount, upsertAccount } from "@/lib/account-store";
import { accountsCookieName, defaultAccounts } from "@/lib/accounts";
import { findTestUser } from "@/lib/session";

function cookieValue(name: string) { return document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1); }

describe("administración de cuentas", () => {
  it("conserva una cuenta inicial por cada rol de prueba", () => {
    expect(defaultAccounts).toHaveLength(8);
    expect(defaultAccounts.every((account) => account.active && account.roleIds.length === 1)).toBe(true);
  });

  it("crea una cuenta con varios roles y evita usuarios duplicados", () => {
    const created = upsertAccount(localStorage, { name: "Cuenta mixta", username: "mixta", password: "clave2026", roleIds: ["grabacion", "edicion"] }, "Supervisión");
    expect(created.ok && created.account.roleIds).toEqual(["grabacion", "edicion"]);
    expect(upsertAccount(localStorage, { name: "Duplicada", username: "MIXTA", password: "otra", roleIds: ["locucion"] }, "Supervisión")).toMatchObject({ ok: false });
  });

  it("bloquea las credenciales de una cuenta desactivada", () => {
    expect(toggleAccount(localStorage, "test-grabacion", "Supervisión").ok).toBe(true);
    expect(findTestUser("grabacion", "grabacion2026", cookieValue(accountsCookieName))).toBeUndefined();
    expect(readAccounts(localStorage).find((account) => account.id === "test-grabacion")?.active).toBe(false);
  });

  it("protege la última cuenta administrativa", () => {
    expect(toggleAccount(localStorage, "test-supervision", "Supervisión")).toMatchObject({ ok: false });
    upsertAccount(localStorage, { name: "Segundo administrador", username: "admin2", password: "admin22026", roleIds: ["supervision"] }, "Supervisión");
    expect(toggleAccount(localStorage, "test-supervision", "Segundo administrador").ok).toBe(true);
  });
});
