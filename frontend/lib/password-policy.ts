export function passwordPolicyError(value: string) {
  if (value.length < 12 || value.length > 128)
    return "La clave debe tener entre 12 y 128 caracteres.";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value))
    return "La clave debe combinar mayúsculas, minúsculas y números.";
  if (!/[^A-Za-z0-9]/.test(value))
    return "La clave debe incluir al menos un símbolo.";
  return null;
}

function secureRandomIndex(length: number) {
  const ceiling = 256 - (256 % length);
  const sample = new Uint8Array(1);
  do globalThis.crypto.getRandomValues(sample);
  while (sample[0] >= ceiling);
  return sample[0] % length;
}

function secureRandomCharacter(alphabet: string) {
  return alphabet[secureRandomIndex(alphabet.length)];
}

export function generateTemporaryPassword() {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!#$%&*+-=?@_",
  ];
  const alphabet = groups.join("");
  const characters = groups.map(secureRandomCharacter);
  while (characters.length < 16)
    characters.push(secureRandomCharacter(alphabet));

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }
  return characters.join("");
}
