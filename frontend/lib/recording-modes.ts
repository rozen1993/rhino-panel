export const recordingModes = ["Fotografía", "Video", "Vuelo con dron"] as const;
export type RecordingMode = (typeof recordingModes)[number];

export function validRecordingModes(value: unknown): value is RecordingMode[] {
  return Array.isArray(value) && value.every(mode => recordingModes.includes(mode)) && new Set(value).size === value.length;
}

export function recordingModesError(type: string, value: unknown): string | null {
  if (!validRecordingModes(value ?? [])) return "Selecciona opciones de grabación válidas.";
  if (type === "Grabación" && (!value || !(value as RecordingMode[]).length))
    return "Selecciona al menos una opción: Fotografía, Video o Vuelo con dron.";
  if (type !== "Grabación" && (value as RecordingMode[] | undefined)?.length)
    return "Las modalidades solo corresponden a Grabación.";
  return null;
}

export function normalizeRecordingModes(value: readonly string[] = []): RecordingMode[] {
  return recordingModes.filter(mode => value.includes(mode));
}
