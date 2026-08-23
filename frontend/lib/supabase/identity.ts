const usernamePattern = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return usernamePattern.test(normalizeUsername(value));
}

export function usernameToAuthEmail(username: string, domain: string) {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    throw new Error("El usuario no tiene un formato válido.");
  }
  return `${normalized}@${domain}`;
}
