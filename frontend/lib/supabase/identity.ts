const usernamePattern = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
export const usernameDomainPatternSource =
  "^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$";
const usernameDomainPattern = new RegExp(usernameDomainPatternSource);

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return usernamePattern.test(normalizeUsername(value));
}

export function isValidUsernameDomain(value: string) {
  return usernameDomainPattern.test(value.trim().toLowerCase());
}

export function usernameToAuthEmail(username: string, domain: string) {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized) || !isValidUsernameDomain(domain)) {
    throw new Error("El usuario no tiene un formato válido.");
  }
  return `${normalized}@${domain.trim().toLowerCase()}`;
}
