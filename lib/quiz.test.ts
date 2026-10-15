import { describe, expect, it } from "vitest";
import { buildOptions, buildPool, grade, pickQuestion, type Country } from "./quiz";

const mk = (code: string, region: string, capital: string | null = code + "-city", independent = true): Country => ({
  code, name: code + "-land", capital, region, independent,
});
const all = [mk("A", "Europe"), mk("B", "Europe"), mk("C", "Europe"), mk("D", "Asia"), mk("E", "Asia", null, false)];
const s = { mode: "capital" as const, regions: ["Europe", "Asia"], territories: true };

describe("quiz", () => {
  it("skips countries without capital in capital modes and territories when off", () => {
    expect(buildPool(all, s).map((c) => c.code)).toEqual(["A", "B", "C", "D"]);
    expect(buildPool(all, { ...s, mode: "flag", territories: false }).map((c) => c.code)).toEqual(["A", "B", "C", "D"]);
  });

  it("offers the answer plus 3 unique distractors", () => {
    const o = buildOptions(buildPool(all, s), all[0], "capital");
    expect(o).toHaveLength(4);
    expect(new Set(o.map((c) => c.code)).size).toBe(4);
    expect(o).toContain(all[0]);
  });

  it("grades up on correct, resets on wrong", () => {
    expect(grade({}, "k", true).k).toBe(1);
    expect(grade({ k: 3 }, "k", false).k).toBe(0);
    expect(grade({ k: 4 }, "k", true).k).toBe(4);
  });

  it("prefers low boxes and avoids the last question", () => {
    const pool = buildPool(all, s);
    const progress = { "capital:A": 4, "capital:B": 4, "capital:C": 4 };
    expect(pickQuestion(pool, progress, "capital", undefined, () => 0.5).code).toBe("D");
    expect(pickQuestion(pool, progress, "capital", "D", () => 0.99).code).not.toBe("D");
  });
});
