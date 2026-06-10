import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const all = vi.fn(() => [{ id: 1 }]);
  const returning = vi.fn(() => ({ all }));
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));

  return { all, insert, returning, values };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: mocks.insert,
  },
}));

import { recordProgress } from "@/lib/actions/server.actions";

describe("recordProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["an empty score", ""],
    ["a negative score", -1],
    ["a decimal score", 50.5],
    ["NaN", Number.NaN],
    ["a score just above the maximum", 101],
    ["a score far above the maximum", 999],
    ["an extremely high score", 10000],
  ])("rejects %s without saving it", async (_label, score) => {
    const result = await recordProgress({
      studentId: 1,
      topicId: 1,
      score,
      notes: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Score must be a whole number between 0 and 100.",
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it.each([0, 100])("saves the valid boundary score %i", async (score) => {
    await expect(
      recordProgress({
        studentId: 1,
        topicId: 1,
        score,
        notes: null,
      }),
    ).resolves.toEqual({ success: true, record: { id: 1 } });

    expect(mocks.values).toHaveBeenCalledWith({
      studentId: 1,
      topicId: 1,
      score,
      notes: null,
    });
  });
});
