"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import data from "@/data/countries.json";
import {
  REGIONS, answerOf, buildOptions, buildPool, grade, key, mastery, parseProgress, pickQuestion,
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

const CAPTION: Record<Mode, string> = {
  flag: "Welches Land?",
  capital: "Hauptstadt von",
  reverse: "Land mit der Hauptstadt",
};
const LABEL = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

const Bar = ({ value }: { value: number }) => (
  <div className="h-1 w-full rounded-full bg-current/15">
    <div className="h-full rounded-full bg-current" style={{ width: `${value * 100}%` }} />
  </div>
);

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
    // Brief confirmation (short after a hit, longer after a miss so the right answer can be read), then move on.
    setPicked(c.code);
    timer.current = setTimeout(() => next(p, question.country.code), ok ? 400 : 1500);
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

  function resetProgress() {
    if (confirm("Gesamten Lernfortschritt löschen? Das lässt sich nicht rückgängig machen.")) setProgress({});
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
    const done = mastery(pool, progress, mode);
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={back}>← Zurück</Button>
            <span className="tabular-nums">{Math.round(done * 100)} % gelernt</span>
          </div>
          <Bar value={done} />
        </header>
        <section className="flex min-h-52 flex-col items-center justify-center gap-4 text-center">
          <p className={LABEL}>{CAPTION[mode]}</p>
          {mode === "flag" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${BASE}/flags/${q.code.toLowerCase()}.png`} alt="Flagge" className="max-h-44 rounded-sm shadow-lg" />
          ) : (
            <p className="font-heading text-4xl leading-tight">{mode === "capital" ? q.name : q.capital}</p>
          )}
        </section>
        <div className="flex flex-col gap-2.5">
          {question.options.map((o) => {
            const state = !picked
              ? "hover:bg-accent"
              : o.code === q.code
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600 hover:bg-emerald-50"
                : o.code === picked
                  ? "border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-600 hover:bg-rose-50"
                  : "opacity-40";
            return (
              <Button key={o.code} variant="outline" className={`h-auto min-h-14 whitespace-normal rounded-xl bg-card py-3 text-base font-medium shadow-sm ${state}`} onClick={() => answer(o)}>
                {answerOf(mode, o)}
              </Button>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 p-4 pt-10">
      <h1 className="font-heading text-4xl leading-tight">Flaggen &amp;<br />Hauptstädte</h1>
      <section className="flex flex-col gap-2">
        <h2 className={LABEL}>Modus</h2>
        {MODES.map(([m, label]) => {
          const p = buildPool(COUNTRIES, { ...settings, mode: m });
          const done = mastery(p, progress, m);
          return (
            <Button key={m} variant={m === mode ? "default" : "outline"} className={`h-auto flex-col items-stretch gap-2.5 rounded-xl py-3 text-base ${m === mode ? "" : "bg-card"}`} onClick={() => setSettings({ ...settings, mode: m })}>
              <span className="flex justify-between">
                {label}
                <span className="text-sm tabular-nums opacity-70">{Math.round(done * 100)} %</span>
              </span>
              <Bar value={done} />
            </Button>
          );
        })}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className={LABEL}>Auswahl</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(REGIONS).map(([r, label]) => (
            <Button key={r} size="sm" className={`rounded-full ${settings.regions.includes(r) ? "" : "bg-card"}`} variant={settings.regions.includes(r) ? "default" : "outline"} onClick={() => toggleRegion(r)}>{label}</Button>
          ))}
          <Button size="sm" className={`rounded-full ${settings.territories ? "" : "bg-card"}`} variant={settings.territories ? "default" : "outline"} onClick={() => setSettings({ ...settings, territories: !settings.territories })}>
            Gebiete einbeziehen
          </Button>
        </div>
      </section>
      <Button size="lg" className="h-12 rounded-full text-base" disabled={pool.length < 4} onClick={() => next(progress)}>
        Start · {pool.length} Karten
      </Button>
      {pool.length < 4 && <p className="-mt-4 text-sm text-muted-foreground">Wähle mindestens 4 Länder aus.</p>}
      <footer className="mt-auto flex flex-col gap-1 pt-4">
        <div className="-ml-2 flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportProgress}>Fortschritt kopieren</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={importProgress}>Fortschritt einfügen</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={resetProgress}>Fortschritt löschen</Button>
        </div>
        <p className="text-xs text-muted-foreground">Version {process.env.NEXT_PUBLIC_APP_VERSION} · Daten: mledoze/countries (ODbL), Wikidata, flagcdn.com</p>
      </footer>
    </main>
  );
}
