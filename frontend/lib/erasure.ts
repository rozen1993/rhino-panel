export type ErasureKind = "trash" | "account";
export type ErasurePreview = {
  fingerprint: string;
  total: number;
  activities: { id: string; title: string; responsible: string; trashed: boolean }[];
  counts: Record<string, number>;
};
export const erasureConfirmation = "ELIMINAR DEFINITIVAMENTE";
