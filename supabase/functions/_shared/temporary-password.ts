export const temporaryPasswordFingerprintKey =
  "sistema_r_temporary_password_fingerprint_v1";
export const temporaryPasswordSaltKey = "sistema_r_temporary_password_salt_v1";
export const sistemaRUsernameKey = "sistema_r_username";
const fingerprintIterations = 600_000;

function bytesToHex(value: ArrayBuffer) {
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToBase64Url(value: Uint8Array) {
  return btoa(String.fromCharCode(...value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  if (!/^[A-Za-z0-9_-]{22}$/.test(value)) {
    throw new Error("invalid temporary password salt");
  }
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/") + "==";
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export function createTemporaryPasswordSalt() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export async function temporaryPasswordFingerprint(
  email: string,
  password: string,
  salt: string,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(
      `sistema-r:temporary-password:v1\u0000${email.trim().toLowerCase()}\u0000${password}`,
    ),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const fingerprint = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: fingerprintIterations,
      salt: base64UrlToBytes(salt),
    },
    key,
    256,
  );
  return bytesToHex(fingerprint);
}

export function fingerprintsEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export function withoutTemporaryPasswordFingerprint(value: unknown) {
  const metadata = metadataRecord(value);
  delete metadata[temporaryPasswordFingerprintKey];
  delete metadata[temporaryPasswordSaltKey];
  return metadata;
}
