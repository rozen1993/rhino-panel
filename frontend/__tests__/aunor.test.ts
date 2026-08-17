import { describe, expect, it } from "vitest";
import { aunorStatuses } from "@/components/aunor-status-pill";
import { aunorActivities } from "@/lib/aunor";

describe("vista pública de AUNOR", () => {
  it("representa los cinco grupos de cliente", () => {
    expect(new Set(aunorActivities.map((activity) => activity.status))).toEqual(new Set(aunorStatuses));
  });

  it("su modelo no contiene campos internos", () => {
    const serialized = JSON.stringify(aunorActivities);
    ["observation", "response", "internalNotes", "responsible"].forEach((field) => expect(serialized).not.toContain(`\"${field}\"`));
  });
});
