import { describe, expect, it } from "vitest";
import { activityDraftStorageKey, readActivityDraft } from "@/lib/activity-draft";

describe("contrato del borrador local", () => {
  it("aísla creación, edición y roles", () => {
    expect(activityDraftStorageKey("grabacion")).not.toBe(activityDraftStorageKey("locucion"));
    expect(activityDraftStorageKey("grabacion", "actividad-1")).not.toBe(activityDraftStorageKey("grabacion", "actividad-2"));
    expect(activityDraftStorageKey("grabacion")).not.toBe(activityDraftStorageKey("grabacion", "actividad-1"));
  });

  it("descarta datos locales corruptos", () => {
    const key = activityDraftStorageKey("grabacion");
    window.localStorage.setItem(key, "no-es-json");
    expect(readActivityDraft(window.localStorage, key)).toBeNull();
    expect(window.localStorage.getItem(key)).toBeNull();
  });
});
