import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const all = vi.fn((): Array<{ score: number }> => []);
  const where = vi.fn(() => ({ all }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return { select };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mocks.select,
  },
}));

import { getAverageForStudent } from "@/lib/actions/server.actions";

describe("getAverageForStudent", () => {
  it("returns no average when the student has no progress records", async () => {
    const average = await getAverageForStudent(1);

    expect(average).toBeNull();
    expect(average).not.toBe(Number.NaN);
  });
});
