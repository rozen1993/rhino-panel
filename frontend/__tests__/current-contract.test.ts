import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const normativeSources = [
  "CLAUDE.md",
  "docs/contrato-producto-vigente-2026-08-28.md",
  "docs/decisiones-modelo-tres-roles-2026-08-20.md",
  "docs/handoff-frontend.md",
  "diseno/direccion-final-traducida/CONTRATO-VISUAL.md",
].map(read);
const currentState = read("docs/estado.md");
const supabaseRunbook = read("supabase/README.md");
const releaseRunbook = read("docs/runbook-preview-produccion.md");
const frontendValidation = read("docs/validacion-frontend.md");
const stagingEvidence = read("docs/evidencia-staging-2026-09-02.md");
const localSupabaseHarness = read(
  "frontend/scripts/verify-local-supabase.mjs",
);
const governanceSources = [
  currentState,
  read("docs/decisiones.md"),
  read("docs/decisiones-operativas-2026-08-20.md"),
  read("docs/decisiones-pendientes.md"),
  read("docs/decision-backend-supabase-2026-08-22.md"),
  frontendValidation,
  supabaseRunbook,
  releaseRunbook,
];
const contract = normativeSources.join("\n");
const governance = governanceSources.join("\n");
const behavioralGates = [
  "frontend/__tests__/model-2026.test.ts",
  "frontend/e2e/roles.spec.ts",
].map(read).join("\n");
const navigation = read("frontend/components/nav-bar.tsx");
const demoAccessAction = read("frontend/app/acceso/actions.ts");
const frontendReadme = read("frontend/README.md");

describe("contrato de producto vigente", () => {
  it("fija tres roles, tres estados y la separación planificación/ejecución", () => {
    expect(contract).toContain("Operario, Admin y Burson");
    expect(contract).toContain("Programada");
    expect(contract).toContain("En proceso");
    expect(contract).toContain("Entregada");
    expect(contract).toContain("Admin crea, planifica, asigna");
    expect(contract).toContain(
      "El Operario responsable controla únicamente la ejecución",
    );
  });

  it("documenta el permiso individual con default false y responsable forzado", () => {
    expect(contract).toContain("can_create_own_activities");
    expect(contract).toContain("Valor predeterminado: `false`");
    expect(contract).toContain("responsible_id = auth.uid()");
    expect(contract).toMatch(
      /can_create_own_activities[\s\S]*is_burson_operator[\s\S]*capacidades\s+independientes/,
    );
  });

  it("no conserva en las fuentes activas el contrato de creación retirado", () => {
    for (const retired of [
      "las registra el operario",
      "El Operario registra las actividades",
      "Admin ve todas las actividades, enlaces e histórico; administra cuentas e inicia conversaciones privadas con el operario responsable. No crea",
      "Operario:** actividades propias, creación, avance",
    ]) {
      expect(contract).not.toContain(retired);
    }
    expect(contract.toLocaleLowerCase("es")).not.toMatch(/\bavance\b/);
    expect(contract).toContain("cambia estado, enlace HTTPS y opinión");
  });

  it("fija la clave temporal, el aislamiento Burson y el Histórico desde 2026", () => {
    expect(contract).toContain("must_change_password");
    expect(contract).toContain(
      "Burson crea y consulta exclusivamente sus propios encargos",
    );
    expect(contract).toContain("2026-01-01");
  });

  it("fija la baja privada de mensajes sin filtrar su cuerpo", () => {
    expect(contract).toMatch(/identificador\s+del\s+mensaje/);
    expect(contract).toContain("nunca copia el cuerpo a auditoría");
    expect(contract).toContain("fila dada de baja");
  });

  it("entrega el PDF independiente del chat IA", () => {
    const path = resolve(root, "docs", "plan-chat-ia-reutilizable.pdf");
    expect(existsSync(path)).toBe(true);
    const pdf = readFileSync(path);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    const pageObjects =
      pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)\b/g)?.length ?? 0;
    expect(pageObjects).toBeGreaterThan(0);
    expect(pageObjects).toBeLessThanOrEqual(3);
  });

  it("distingue fuentes normativas, simulaciones y evidencia histórica", () => {
    expect(contract).toMatch(
      /esta fuente\s+manda sobre el comportamiento que debe implementarse/,
    );
    expect(currentState).toContain("evidencia operacional actual es");
    const evidencePath = currentState.match(
      /evidencia operacional actual es\s+\[`[^`]+`\]\(([^)]+)\)/,
    )?.[1];
    expect(evidencePath).toBeTruthy();
    expect(
      existsSync(resolve(root, "docs", evidencePath ?? "__missing__")),
    ).toBe(true);
    expect(currentState).toMatch(
      /no demuestran por sí\s+solas los permisos RLS/,
    );
    expect(supabaseRunbook).toContain(
      "Cada punto se registra solo con evidencia",
    );
    expect(releaseRunbook).toContain(
      "No marcar este bloque como aprobado a partir de pruebas simuladas",
    );
    expect(localSupabaseHarness.match(/^  await check\(/gm) ?? []).toHaveLength(
      51,
    );
    for (const source of [
      currentState,
      supabaseRunbook,
      releaseRunbook,
      frontendValidation,
    ]) {
      expect(source).toMatch(/51\s+controles/);
      expect(source).toMatch(/20\s+pruebas/i);
    }
    // Un snapshot conserva su identidad, no las cifras de ejecuciones futuras.
    expect(stagingEvidence).toContain("**Fecha:** 2026-09-02");
    expect(stagingEvidence).toContain("`equipo` · `6d52d8f`");
    expect(supabaseRunbook).toContain(
      "su cantidad no equivale a puntos aprobados",
    );
    const officialGateStart = supabaseRunbook.indexOf("### Gate objetivo");
    const officialGateEnd = supabaseRunbook.indexOf("**Estado actualizado");
    expect(officialGateStart).toBeGreaterThanOrEqual(0);
    expect(officialGateEnd).toBeGreaterThan(officialGateStart);
    const officialGate = supabaseRunbook.slice(
      officialGateStart,
      officialGateEnd,
    );
    expect(officialGate.match(/^\d+\.\s/gm)).toHaveLength(31);
    expect(governance.toLocaleLowerCase("es")).toMatch(
      /evidencia histórica(?: anterior)?\s+(?:fue\s+)?sustituida/,
    );
  });

  it("marca como sustituidas las fuentes anteriores modificadas", () => {
    expect(governance).toContain("autoridad de implementación");
    expect(governance).toContain("Documento histórico del modelo anterior");
    expect(governance).toContain("Sustituido para implementación");
    expect(governance).toContain("Addendum 2026-08-28");
  });

  it("los gates conductuales y la navegación ya expresan el contrato vigente", () => {
    expect(behavioralGates).not.toContain("BASELINE HISTÓRICO");
    expect(behavioralGates).toContain("canCreateOwnActivities");
    expect(behavioralGates).toContain("Admin concede y revoca");
    expect(navigation).not.toContain('href="/actividades/nueva"');
    expect(navigation).not.toContain('label: "Nueva"');
  });

  it("acota la simulacion demo y protege sus cookies de sesion", () => {
    expect(demoAccessAction).toContain("httpOnly: true");
    expect(demoAccessAction).toContain("demoSessionCookieOptions");
    expect(frontendReadme).toContain(
      "no constituye una frontera de autenticacion",
    );
    expect(frontendReadme).toContain("preflight rechaza `demo` en Vercel");
  });
});
