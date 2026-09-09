import { describe, expect, it } from "vitest";
import { validSpans } from "@/lib/activity-validation";
import {
  activityDraftStorageKey,
  createIdempotencyKey,
  parseActivityDraft,
} from "@/lib/activity-draft";
import { resolveDataSource } from "@/lib/data-source";
import { safeMaterialUrl } from "@/lib/external-link";
import { profileToRole } from "@/lib/profile-role";
import {
  appSessionCookieOptions,
  isSupabaseAuthCookieName,
} from "@/lib/supabase/cookie-options";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import { secureRedirect } from "@/lib/supabase/proxy";
import {
  isValidUsername,
  isValidUsernameDomain,
  usernameToAuthEmail,
} from "@/lib/supabase/identity";
import { isUuid } from "@/lib/uuid";

describe("cimiento del backend", () => {
  it("usa demo por defecto y nunca acepta un modo desconocido", () => {
    expect(resolveDataSource(undefined, "")).toBe("demo");
    expect(resolveDataSource("supabase")).toBe("supabase");
    expect(resolveDataSource(" supabase ")).toBe("supabase");
    expect(() => resolveDataSource("automatico")).toThrow(
      /SISTEMA_R_DATA_SOURCE/,
    );
    try {
      resolveDataSource("valor-no-documentado");
    } catch (error) {
      expect((error as Error).message).not.toContain("valor-no-documentado");
    }
    expect(() => resolveDataSource(undefined, "preview")).toThrow(
      /obligatorio/,
    );
    expect(() => resolveDataSource("demo", "preview")).toThrow(/prohibido/);
    expect(() => resolveDataSource("demo", "production")).toThrow(
      /prohibido/,
    );
  });

  it("acepta cualquier HTTPS y rechaza HTTP o credenciales incrustadas", () => {
    expect(safeMaterialUrl("https://archivos.ejemplo.pe/entrega/42")).toBe(
      "https://archivos.ejemplo.pe/entrega/42",
    );
    expect(safeMaterialUrl("http://archivos.ejemplo.pe/entrega/42")).toBeNull();
    expect(
      safeMaterialUrl("https://usuario:secreto@archivos.ejemplo.pe/42"),
    ).toBeNull();
  });

  it("conserva jornadas discontinuas y rechaza fechas imposibles", () => {
    expect(
      validSpans([
        { start: "2026-01-04", end: "2026-01-04" },
        { start: "2026-02-11", end: "2026-02-13" },
      ]),
    ).toBe(true);
    expect(validSpans([{ start: "2026-02-30", end: "2026-03-01" }])).toBe(
      false,
    );
    expect(validSpans([{ start: "2025-12-31", end: "2026-01-01" }])).toBe(
      false,
    );
    expect(validSpans(null)).toBe(false);
    expect(validSpans([null])).toBe(false);
  });

  it("genera claves UUID válidas para idempotencia persistente", () => {
    expect(isUuid(createIdempotencyKey())).toBe(true);
    expect(isUuid("actividad-invalida")).toBe(false);
  });

  it("aísla borradores demo/Supabase y descarta claves heredadas", () => {
    expect(
      activityDraftStorageKey(
        "operario",
        "account-ana",
        undefined,
        "supabase",
      ),
    ).toBe(
      "rhino:borrador-actividad:v5:supabase:operario:account-ana:nueva",
    );
    expect(
      parseActivityDraft(
        JSON.stringify({
          version: 2,
          idempotencyKey: "rhino-antigua",
          savedAt: "2026-08-22T00:00:00.000Z",
          fields: { spans: [] },
        }),
      ),
    ).toBeNull();
    expect(
      parseActivityDraft(
        JSON.stringify({
          version: 5,
          idempotencyKey: "00000000-0000-4000-8000-000000000001",
          savedAt: "2026-08-30T00:00:00.000Z",
          fields: {
            type: "Grabación",
            title: "Parcial",
            description: "",
            placeName: "",
            responsibleAccountId: "",
            spans: [{ start: "", end: "" }],
            materialLink: "",
            notes: "",
          },
        }),
      ),
    ).toBeNull();
    expect(
      parseActivityDraft(
        JSON.stringify({
          version: 5,
          idempotencyKey: "00000000-0000-4000-8000-000000000002",
          savedAt: "2026-08-30T00:00:00.000Z",
          fields: {
            type: "Grabación",
            title: "Parcial",
            description: "",
            placeName: "",
            responsibleAccountId: "",
            spans: [{ start: "", end: "" }],
            materialLink: "",
            notes: "",
            referenceLink: "https://burson.example/referencia",
          },
        }),
      )?.fields.referenceLink,
    ).toBe("https://burson.example/referencia");
  });

  it("traduce username a un alias interno sin publicar correos reales", () => {
    expect(isValidUsername("ana.torres")).toBe(true);
    expect(isValidUsernameDomain("auth.sistema-r.invalid")).toBe(true);
    expect(isValidUsernameDomain("sistema-r.1")).toBe(false);
    expect(usernameToAuthEmail(" Ana.Torres ", "auth.sistema-r.invalid")).toBe(
      "ana.torres@auth.sistema-r.invalid",
    );
    expect(() =>
      usernameToAuthEmail("ana+externa", "auth.sistema-r.invalid"),
    ).toThrow();
  });

  it("mapea un perfil activo al contrato visual sin confiar en cookies demo", () => {
    expect(
      profileToRole({
        id: "5bd31872-a2d5-456f-8eb7-4d45924219ef",
        display_name: "Ana Torres",
        role: "operario",
        is_active: true,
        is_burson_operator: true,
        can_create_own_activities: true,
        must_change_password: false,
      }),
    ).toMatchObject({
      id: "operario",
      accountName: "Ana Torres",
      bursonLinked: false,
      canCreateOwnActivities: true,
    });
    expect(
      profileToRole({
        id: "5bd31872-a2d5-456f-8eb7-4d45924219ef",
        display_name: "Ana Torres",
        role: "operario",
        is_active: false,
        is_burson_operator: false,
        can_create_own_activities: false,
        must_change_password: false,
      }),
    ).toBeNull();
  });

  it("convierte la sesión persistente de Supabase en cookie HttpOnly de navegador", () => {
    expect(
      appSessionCookieOptions(
        { path: "/", maxAge: 34_560_000, sameSite: "lax" },
        true,
      ),
    ).toEqual({ path: "/", sameSite: "lax", httpOnly: true, secure: true });
    expect(appSessionCookieOptions({ path: "/", maxAge: 0 }, false)).toEqual({
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: false,
    });
    expect(isSupabaseAuthCookieName("sb-abc123-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookieName("rhino_rol_prueba_v2")).toBe(false);
  });

  it("conserva las cabeceras defensivas en redirecciones del proxy", () => {
    const response = secureRedirect(
      new URL("https://sistema-r.example.com/acceso"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://sistema-r.example.com/acceso",
    );
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("strict-transport-security")).toBe(
      "max-age=63072000",
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("falla cerrado si el modo real no tiene configuración", () => {
    const previousUrl = process.env.SUPABASE_URL;
    const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    const previousDomain = process.env.SISTEMA_R_USERNAME_DOMAIN;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SISTEMA_R_USERNAME_DOMAIN;
    try {
      expect(() => getSupabaseEnvironment()).toThrow(/SUPABASE_URL/);
      process.env.SUPABASE_URL = "https://staging.supabase.co";
      expect(() => getSupabaseEnvironment()).toThrow(
        /SUPABASE_PUBLISHABLE_KEY/,
      );
      process.env.SUPABASE_PUBLISHABLE_KEY = "local-test-key";
      expect(() => getSupabaseEnvironment()).toThrow(
        /SISTEMA_R_USERNAME_DOMAIN/,
      );
    } finally {
      if (previousUrl === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = previousUrl;
      if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
      else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
      if (previousDomain === undefined)
        delete process.env.SISTEMA_R_USERNAME_DOMAIN;
      else process.env.SISTEMA_R_USERNAME_DOMAIN = previousDomain;
    }
  });

  it("rechaza claves legacy también en el runtime de Vercel", () => {
    const previous = {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_PUBLISHABLE_KEY,
      domain: process.env.SISTEMA_R_USERNAME_DOMAIN,
      vercelEnvironment: process.env.VERCEL_ENV,
    };
    process.env.SUPABASE_URL = "https://stagingref123.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "eyJlegacy.anon.signature";
    process.env.SISTEMA_R_USERNAME_DOMAIN = "auth.sistema-r.invalid";
    process.env.VERCEL_ENV = "preview";
    try {
      expect(() => getSupabaseEnvironment()).toThrow(/publicable/);
      process.env.SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_runtime_test_key";
      expect(getSupabaseEnvironment().publishableKey).toBe(
        "sb_publishable_runtime_test_key",
      );
      delete process.env.VERCEL_ENV;
      process.env.SUPABASE_PUBLISHABLE_KEY = "legacy-local-development-key";
      expect(getSupabaseEnvironment().publishableKey).toBe(
        "legacy-local-development-key",
      );
    } finally {
      if (previous.url === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = previous.url;
      if (previous.key === undefined)
        delete process.env.SUPABASE_PUBLISHABLE_KEY;
      else process.env.SUPABASE_PUBLISHABLE_KEY = previous.key;
      if (previous.domain === undefined)
        delete process.env.SISTEMA_R_USERNAME_DOMAIN;
      else process.env.SISTEMA_R_USERNAME_DOMAIN = previous.domain;
      if (previous.vercelEnvironment === undefined)
        delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = previous.vercelEnvironment;
    }
  });
});
