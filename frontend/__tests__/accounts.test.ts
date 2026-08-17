import { describe, expect, it } from "vitest";
import { accounts } from "@/lib/accounts";

describe("datos de cuentas", () => {
  it("solo asigna el rol confirmado de Martín", () => {
    expect(accounts.find((account) => account.name === "Martín")?.roles).toEqual(["Supervisión"]);
    expect(accounts.filter((account) => account.name !== "Martín").every((account) => account.roles.length === 0)).toBe(true);
  });
});
