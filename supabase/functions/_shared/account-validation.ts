export const accountRoles = ["operario", "admin", "aunor"] as const;
export type AccountRole = (typeof accountRoles)[number];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const username = value.trim().toLowerCase();
  return /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(username)
    ? username
    : null;
}

export function validDisplayName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 2 &&
    value.trim().length <= 120
  );
}

export function validRole(value: unknown): value is AccountRole {
  return accountRoles.includes(value as AccountRole);
}

export function validUsernameDomain(value: string) {
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
    .test(
      value.trim().toLowerCase(),
    );
}

export function passwordPolicyError(value: unknown) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) {
    return "La clave debe tener entre 12 y 128 caracteres.";
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return "La clave debe combinar mayúsculas, minúsculas y números.";
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return "La clave debe incluir al menos un símbolo.";
  }
  return null;
}

export function response(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
