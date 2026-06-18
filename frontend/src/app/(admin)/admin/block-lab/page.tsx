"use client";

// ── Block Lab (prototype) ───────────────────────────────────────────────────
// Vertical slice for the HTML+Tailwind question-block idea. Author edits a
// single-choice template on the left; the right shows it live & interactive,
// driven entirely by our own Question model (no SurveyJS).

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { BlockRenderer } from "@/lib/block-renderer";
import type { Question } from "../_components/mock-data";

// Sample single-choice question (localized) used to preview a block.
const SAMPLE: Question = {
  id: "q_demo",
  text: {
    en: "How do you prefer to spend a free weekend?",
    ru: "Как вы предпочитаете проводить выходной?",
    kk: "Бос демалысты қалай өткізгенді ұнатасыз?",
  },
  type: "single",
  choices: [
    { id: "c1", text: { en: "Outdoors and active", ru: "Активно на улице", kk: "Далада белсенді" }, variables: [] },
    { id: "c2", text: { en: "Reading or studying", ru: "Чтение или учёба", kk: "Оқу немесе білім алу" }, variables: [] },
    { id: "c3", text: { en: "Building or fixing things", ru: "Что-то мастерить", kk: "Бірдеңе жасау" }, variables: [] },
    { id: "c4", text: { en: "Meeting people", ru: "Общение с людьми", kk: "Адамдармен араласу" }, variables: [] },
  ],
};

// Starter library blocks — the "prepared blocks" you pick then edit.
const PRESETS: { name: string; html: string }[] = [
  {
    name: "Radio — Card",
    html: `<div class="space-y-2">
  <label data-choice data-part="option" data-selected="border-foreground bg-muted shadow-sm">
    <span data-part="indicator" class="border-muted-foreground/40" data-selected="border-foreground">
      <span data-show-when="selected" class="h-2 w-2 rounded-full bg-foreground"></span>
    </span>
    <span data-part="label">{{choice.text}}</span>
  </label>
</div>`,
  },
  {
    name: "Radio — Numbered list",
    html: `<div class="divide-y rounded-xl border">
  <label data-choice
         class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40"
         data-selected="bg-muted">
    <span class="flex h-6 w-6 items-center justify-center rounded-full border text-[0.7rem] font-semibold text-muted-foreground"
          data-selected="border-foreground bg-foreground text-background">{{choice.index}}</span>
    <span class="text-sm text-foreground">{{choice.text}}</span>
  </label>
</div>`,
  },
  {
    name: "Pills",
    html: `<div class="flex flex-wrap gap-2">
  <button data-choice
          class="rounded-full border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted"
          data-selected="border-foreground bg-foreground text-background shadow">
    {{choice.text}}
  </button>
</div>`,
  },
  {
    name: "Cards with big number",
    html: `<div class="grid grid-cols-2 gap-3">
  <button data-choice
          class="flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all hover:border-muted-foreground/40"
          data-selected="border-foreground bg-muted shadow-md">
    <span class="text-2xl font-black text-muted-foreground" data-selected="text-foreground">0{{choice.index}}</span>
    <span class="text-[0.82rem] font-medium text-foreground">{{choice.text}}</span>
  </button>
</div>`,
  },
];

export default function BlockLabPage() {
  const { locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const [html, setHtml] = useState(PRESETS[0].html);
  const [value, setValue] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Block Lab</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Prototype — author a single-choice control as HTML + Tailwind on the left, see it live on the
          right. Driven by our own question model; SurveyJS not involved.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Starter blocks
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setHtml(p.html)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              html === p.html
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: template editor */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-3 py-2 text-sm font-semibold">Template (HTML + Tailwind)</div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            className="h-[60vh] w-full resize-none bg-gray-950 p-4 font-mono text-[0.78rem] leading-relaxed text-gray-100 outline-none"
          />
          <div className="border-t px-3 py-2 text-[0.68rem] text-muted-foreground">
            Bindings: <code className="font-mono">{"{{choice.text}}"}</code>,{" "}
            <code className="font-mono">{"{{choice.index}}"}</code> · repeat:{" "}
            <code className="font-mono">data-choice</code> · selected style:{" "}
            <code className="font-mono">data-selected=&quot;…&quot;</code> · only-when:{" "}
            <code className="font-mono">data-show-when=&quot;selected&quot;</code>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Live preview</span>
            <span className="text-[0.7rem] text-muted-foreground">
              selected: <code className="font-mono">{value ?? "—"}</code>
            </span>
          </div>
          <div className="p-6">
            <h4 className="mb-4 text-[0.95rem] font-semibold text-foreground">
              {localize(SAMPLE.text, loc)}
            </h4>
            <BlockRenderer html={html} question={SAMPLE} value={value} onChange={setValue} locale={loc} />
          </div>
        </div>
      </div>
    </div>
  );
}
