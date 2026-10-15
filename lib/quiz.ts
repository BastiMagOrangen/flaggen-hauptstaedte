export type Country = {
  code: string;
  name: string;
  capital: string | null;
  region: string;
  independent: boolean;
};

// flag: flag -> country, capital: country -> capital, reverse: capital -> country
export type Mode = "flag" | "capital" | "reverse";
export type Progress = Record<string, number>;
export type Settings = { mode: Mode; regions: string[]; territories: boolean };

export const REGIONS: Record<string, string> = {
  Europe: "Europa",
  Asia: "Asien",
  Africa: "Afrika",
  Americas: "Amerika",
  Oceania: "Ozeanien",
  Antarctic: "Antarktis",
};

export const MAX_BOX = 4;
export const key = (mode: Mode, c: Country) => `${mode}:${c.code}`;

export const answerOf = (mode: Mode, c: Country) => (mode === "capital" ? c.capital! : c.name);

export function buildPool(all: Country[], s: Settings): Country[] {
  return all.filter(
    (c) =>
      s.regions.includes(c.region) &&
      (s.territories || c.independent) &&
      (s.mode === "flag" || c.capital),
  );
}

// Lower Leitner box = higher weight; never repeats `lastCode` when avoidable.
export function pickQuestion(
  pool: Country[],
  progress: Progress,
  mode: Mode,
  lastCode?: string,
  rnd: () => number = Math.random,
): Country {
  const cands = pool.length > 1 ? pool.filter((c) => c.code !== lastCode) : pool;
  const weights = cands.map((c) => 2 ** -(progress[key(mode, c)] ?? 0));
  let r = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) {
    r -= weights[i];
    if (r < 0) return cands[i];
  }
  return cands[cands.length - 1];
}

// Up to 3 distractors, same region first so they stay plausible; shuffled with the answer.
export function buildOptions(
  pool: Country[],
  answer: Country,
  mode: Mode,
  rnd: () => number = Math.random,
): Country[] {
  const shuffle = <T,>(a: T[]) => a.map((x) => [rnd(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
  const others = pool.filter((c) => answerOf(mode, c) !== answerOf(mode, answer));
  const near = shuffle(others.filter((c) => c.region === answer.region));
  const far = shuffle(others.filter((c) => c.region !== answer.region));
  return shuffle([answer, ...[...near, ...far].slice(0, 3)]);
}

export function grade(progress: Progress, k: string, correct: boolean): Progress {
  return { ...progress, [k]: correct ? Math.min((progress[k] ?? 0) + 1, MAX_BOX) : 0 };
}

export const learned = (pool: Country[], progress: Progress, mode: Mode) =>
  pool.filter((c) => (progress[key(mode, c)] ?? 0) >= MAX_BOX).length;

// Trust boundary: text pasted by the user. Keeps only valid box values.
export function parseProgress(text: string): Progress | null {
  try {
    const o = JSON.parse(text);
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const valid = Object.entries(o).filter(([, v]) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= MAX_BOX);
    return valid.length ? (Object.fromEntries(valid) as Progress) : null;
  } catch {
    return null;
  }
}
