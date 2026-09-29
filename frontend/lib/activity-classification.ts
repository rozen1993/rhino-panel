export type ActivityClassification = "standard" | "special";
export function validClassification(value: unknown): value is ActivityClassification | null {
  return value === null || value === "standard" || value === "special";
}
export function classificationLabel(value?: ActivityClassification | null) {
  return value === "special" ? "Especial" : value === "standard" ? "Estándar" : "Sin clasificar";
}
