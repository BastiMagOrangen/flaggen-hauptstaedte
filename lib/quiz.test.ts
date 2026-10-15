import { describe, expect, it } from "vitest";
import { buildOptions, buildPool, grade, mastery, parseProgress, pickQuestion, type Country } from "./quiz";

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
    expect(grade({ k: 3 }, "k", true).k).toBe(3);
  });

  it("prefers low boxes and avoids the last question", () => {
    const pool = buildPool(all, s);
    const progress = { "capital:A": 3, "capital:B": 3, "capital:C": 3 };
    expect(pickQuestion(pool, progress, "capital", undefined, () => 0.5).code).toBe("D");
    expect(pickQuestion(pool, progress, "capital", "D", () => 0.99).code).not.toBe("D");
  });

  it("rarely repeats a card just answered right while unseen cards remain", () => {
    const pool = buildPool(all, s);
    const progress = { "capital:A": 1 };
    const picks = Array.from({ length: 100 }, (_, i) => pickQuestion(pool, progress, "capital", undefined, () => i / 100).code);
    expect(picks.filter((c) => c === "A").length).toBeLessThanOrEqual(10); // weight 1 of 13
  });

  it("brings a missed card back first", () => {
    const pool = buildPool(all, s);
    const progress = { "capital:A": 0, "capital:B": 1, "capital:C": 1, "capital:D": 1 };
    expect(pickQuestion(pool, progress, "capital", undefined, () => 0.5).code).toBe("A");
  });

  it("grows mastery with every hit", () => {
    const pool = buildPool(all, s);
    expect(mastery(pool, {}, "capital")).toBe(0);
    expect(mastery(pool, { "capital:A": 1 }, "capital")).toBeCloseTo(1 / 12);
    expect(mastery(pool, { "capital:A": 3, "capital:B": 3, "capital:C": 3, "capital:D": 3 }, "capital")).toBe(1);
  });

  it("imports only valid progress", () => {
    expect(parseProgress('{"flag:AT":2,"flag:DE":9,"x":"a"}')).toEqual({ "flag:AT": 2, "flag:DE": 3 });
    expect(parseProgress("nope")).toBeNull();
    expect(parseProgress("[1]")).toBeNull();
  });
});
