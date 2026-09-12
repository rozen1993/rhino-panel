import { expect, it } from "vitest";
import { displayOrganizationAuthor } from "@/lib/brand";

it("actualiza solo la etiqueta organizativa heredada", () => {
  expect(displayOrganizationAuthor("Admin · Rhino")).toBe("Admin · DaVinci");
  expect(displayOrganizationAuthor("Admin · DaVinci")).toBe("Admin · DaVinci");
  expect(displayOrganizationAuthor("Aunor")).toBe("Aunor");
  expect(displayOrganizationAuthor("Marco")).toBe("Marco");
  expect(displayOrganizationAuthor("Registro histórico de Rhino Audiovisuales")).toBe("Registro histórico de Rhino Audiovisuales");
});
