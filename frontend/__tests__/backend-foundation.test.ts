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
import {
  isValidUsername,
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
    expect(() => resolveDataSource(undefined, "preview")).toThrow(
      /obligatorio/,
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
    expect(validSpans(null)).toBe(false);
    expect(validSpans([null])).toBe(false);
  });

  it("genera claves UUID válidas para idempotencia persistente", () => {
    expect(isUuid(createIdempotencyKey())).toBe(true);
    expect(isUuid("actividad-invalida")).toBe(false);
  });

  it("aísla borradores demo/Supabase y descarta claves heredadas", () => {
    expect(activityDraftStorageKey("operario", undefined, "supabase")).toBe(
      "rhino:borrador-actividad:v3:supabase:operario:nueva",
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
  });

  it("traduce username a un alias interno sin publicar correos reales", () => {
    expect(isValidUsername("ana.torres")).toBe(true);
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
      }),
    ).toMatchObject({
      id: "operario",
      accountName: "Ana Torres",
      bursonLinked: true,
    });
    expect(
      profileToRole({
        id: "5bd31872-a2d5-456f-8eb7-4d45924219ef",
        display_name: "Ana Torres",
        role: "operario",
        is_active: false,
        is_burson_operator: false,
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

  it("falla cerrado si el modo real no tiene configuración", () => {
    const previousUrl = process.env.SUPABASE_URL;
    const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    try {
      expect(() => getSupabaseEnvironment()).toThrow(/SUPABASE_URL/);
      process.env.SUPABASE_URL = "https://staging.supabase.co";
      expect(() => getSupabaseEnvironment()).toThrow(
        /SUPABASE_PUBLISHABLE_KEY/,
      );
    } finally {
      if (previousUrl === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = previousUrl;
      if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
      else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
    }
  });
});
