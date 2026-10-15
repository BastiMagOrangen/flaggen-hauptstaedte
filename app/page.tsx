"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import data from "@/data/countries.json";
import {
  REGIONS, answerOf, buildOptions, buildPool, grade, key, learned, parseProgress, pickQuestion,
  type Country, type Mode, type Progress, type Settings,
} from "@/lib/quiz";

const COUNTRIES = data as Country[];
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const STORAGE = "flag-learn-v1";
const MODES: [Mode, string][] = [
  ["flag", "Flagge → Land"],
  ["capital", "Land → Hauptstadt"],
  ["reverse", "Hauptstadt → Land"],
];
const DEFAULTS: Settings = { mode: "flag", regions: Object.keys(REGIONS), territories: false };

type Question = { country: Country; options: Country[] };

function load(): { settings: Settings; progress: Progress } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    return { settings: { ...DEFAULTS, ...saved?.settings }, progress: saved?.progress ?? {} };
  } catch {
    return { settings: DEFAULTS, progress: {} };
  }
}

// shortcut: renders nothing until mounted (state comes from localStorage), upgrade if a prerendered shell matters.
export default function Page() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  return mounted ? <Game /> : null;
}

function Game() {
  const [settings, setSettings] = useState<Settings>(() => load().settings);
  const [progress, setProgress] = useState<Progress>(() => load().progress);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ settings, progress }));
  }, [settings, progress]);

  // Ask the browser not to evict the saved progress.
  useEffect(() => {
    navigator.storage?.persist?.();
  }, []);

  const pool = buildPool(COUNTRIES, settings);
  const { mode } = settings;

  function next(p: Progress, last?: string) {
    const country = pickQuestion(pool, p, mode, last);
    setQuestion({ country, options: buildOptions(pool, country, mode) });
    setPicked(null);
  }

  function answer(c: Country) {
    if (!question || picked) return;
    const ok = c.code === question.country.code;
    const p = grade(progress, key(mode, question.country), ok);
    setProgress(p);
    if (ok) return next(p, question.country.code);
    // Show the right answer briefly after a miss, then move on.
    setPicked(c.code);
    timer.current = setTimeout(() => next(p, question.country.code), 1500);
  }

  function back() {
    clearTimeout(timer.current);
    setPicked(null);
    setQuestion(null);
  }

  async function exportProgress() {
    await navigator.clipboard.writeText(JSON.stringify(progress));
    alert("Fortschritt kopiert.");
  }

  function importProgress() {
    const text = prompt("Kopierten Fortschritt hier einfügen:");
    if (text === null) return;
    const p = parseProgress(text);
    if (p) setProgress(p);
    else alert("Das sieht nicht nach gültigem Fortschritt aus.");
  }

  const toggleRegion = (r: string) =>
    setSettings((s) => ({
      ...s,
      regions: s.regions.includes(r) ? s.regions.filter((x) => x !== r) : [...s.regions, r],
    }));

  if (question) {
    const q = question.country;
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={back}>← Zurück</Button>
          <span>gelernt {learned(pool, progress, mode)} / {pool.length}</span>
        </div>
        <Card>
          <CardContent className="flex min-h-40 items-center justify-center">
            {mode === "flag" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${BASE}/flags/${q.code.toLowerCase()}.png`} alt="Flagge" className="max-h-40 rounded border" />
            ) : (
              <p className="text-center text-2xl font-semibold">{mode === "capital" ? q.name : q.capital}</p>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          {question.options.map((o) => {
            const state = !picked ? "" : o.code === q.code ? "bg-green-600 text-white hover:bg-green-600" : o.code === picked ? "bg-red-600 text-white hover:bg-red-600" : "opacity-50";
            return (
              <Button key={o.code} variant="outline" size="lg" className={`h-auto min-h-12 whitespace-normal py-3 text-base ${state}`} onClick={() => answer(o)}>
                {answerOf(mode, o)}
              </Button>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Flaggen &amp; Hauptstädte</h1>
      <Card>
        <CardHeader><CardTitle>Modus</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {MODES.map(([m, label]) => {
            const p = buildPool(COUNTRIES, { ...settings, mode: m });
            return (
              <Button key={m} variant={m === mode ? "default" : "outline"} onClick={() => setSettings({ ...settings, mode: m })}>
                {label} <span className="ml-auto text-xs opacity-70">{learned(p, progress, m)} / {p.length}</span>
              </Button>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Auswahl</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(REGIONS).map(([r, label]) => (
            <Button key={r} size="sm" variant={settings.regions.includes(r) ? "default" : "outline"} onClick={() => toggleRegion(r)}>{label}</Button>
          ))}
          <Button size="sm" variant={settings.territories ? "default" : "outline"} onClick={() => setSettings({ ...settings, territories: !settings.territories })}>
            Gebiete einbeziehen
          </Button>
        </CardContent>
      </Card>
      <Button size="lg" disabled={pool.length < 4} onClick={() => next(progress)}>
        Start ({pool.length} Karten)
      </Button>
      {pool.length < 4 && <p className="text-sm text-muted-foreground">Wähle mindestens 4 Länder aus.</p>}
      <div className="mt-auto flex gap-2">
        <Button variant="ghost" size="sm" onClick={exportProgress}>Fortschritt kopieren</Button>
        <Button variant="ghost" size="sm" onClick={importProgress}>Fortschritt einfügen</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Daten: mledoze/countries (ODbL), Wikidata, flagcdn.com
      </p>
    </main>
  );
}
