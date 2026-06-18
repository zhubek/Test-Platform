"use client";

// Test question widgets — the interactive answer controls a Test block is built
// from. Each one binds to an answer VARIABLE (data-field) and, for choice-based
// types, a set of OPTIONS that each carry a scoring VALUE (data-source → an array
// of { text, value }). In the builder/preview they are live (you can click to
// select); the real test runtime will read the selected value(s) into the
// variable for scoring. Built on plain controls (Base UI primitives + state) so
// they stay predictable inside the renderer.

import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface P {
  data?: unknown;
  className?: string;
  style?: React.CSSProperties;
  [k: string]: unknown;
}

// Answer reporting: a runner wraps rendered questions in <AnswersProvider> and
// receives (field, value) whenever the respondent interacts. Without a
// provider (block editor previews) reporting is a no-op.
type AnswerFn = (field: string, value: unknown) => void;
const AnswersContext = createContext<AnswerFn | null>(null);

export function AnswersProvider({ onAnswer, children }: { onAnswer: AnswerFn; children: React.ReactNode }) {
  return <AnswersContext.Provider value={onAnswer}>{children}</AnswersContext.Provider>;
}

function useReport(field: unknown): (value: unknown) => void {
  const fn = useContext(AnswersContext);
  return (value) => {
    const f = field == null ? "" : String(field);
    if (fn && f) fn(f, value);
  };
}

type Opt = { text: string; value: number };

// Normalize an options array: accepts [{text,value}] or plain strings.
function opts(data: unknown): Opt[] {
  if (!Array.isArray(data)) return [];
  return data.map((o, i) => {
    if (o && typeof o === "object") {
      const r = o as Record<string, unknown>;
      const n = Number(r.value ?? i);
      return { text: String(r.text ?? r.label ?? ""), value: Number.isFinite(n) ? n : i };
    }
    // Bare numbers keep their own value (e.g. range(1, 10) scales); other
    // primitives fall back to their index.
    return { text: String(o), value: typeof o === "number" ? o : i };
  });
}

const numOr = (v: unknown, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const str = (v: unknown) => (v == null ? "" : String(v));

// A faint chip showing an option's scoring value — so "option values" are always
// visible in the builder.
function ValueChip({ v }: { v: number }) {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium text-gray-400">
      {v}
    </span>
  );
}

// A footer showing which variable this question feeds.
function FieldFooter({ field }: { field?: unknown }) {
  const f = str(field);
  if (!f) return null;
  return (
    <div className="mt-2.5 text-[0.7rem] text-gray-400">
      Variable: <code className="font-mono text-gray-500">{f}</code>
    </div>
  );
}

const ROW = "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors";
const SELECTED = "border-teal-500 bg-teal-50 text-teal-900";
const IDLE = "border-gray-200 text-gray-700 hover:border-teal-300";

function Check() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SingleChoice({ data, field, className, style }: P) {
  const items = opts(data);
  const [sel, setSel] = useState<number | null>(null);
  const report = useReport(field);
  return (
    <div className={className} style={style}>
      <div className="space-y-2">
        {items.map((o, i) => (
          <button key={i} type="button" onClick={() => { setSel(i); report(o.value); }} className={cn(ROW, sel === i ? SELECTED : IDLE)}>
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", sel === i ? "border-teal-500" : "border-gray-300")}>
              {sel === i && <span className="h-2 w-2 rounded-full bg-teal-500" />}
            </span>
            <span>{o.text}</span>
            <ValueChip v={o.value} />
          </button>
        ))}
      </div>
      <FieldFooter field={field} />
    </div>
  );
}

function MultiChoice({ data, field, className, style }: P) {
  const items = opts(data);
  const [sel, setSel] = useState<number[]>([]);
  const report = useReport(field);
  const toggle = (i: number) => {
    const next = sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i];
    setSel(next);
    report(next.map((j) => items[j]?.value ?? 0));
  };
  return (
    <div className={className} style={style}>
      <div className="space-y-2">
        {items.map((o, i) => (
          <button key={i} type="button" onClick={() => toggle(i)} className={cn(ROW, sel.includes(i) ? SELECTED : IDLE)}>
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border-2", sel.includes(i) ? "border-teal-500 bg-teal-500" : "border-gray-300")}>
              {sel.includes(i) && <Check />}
            </span>
            <span>{o.text}</span>
            <ValueChip v={o.value} />
          </button>
        ))}
      </div>
      <FieldFooter field={field} />
    </div>
  );
}

function Likert({ field, scale, minLabel, maxLabel, className, style }: P) {
  const n = Math.max(2, Math.min(10, numOr(scale, 5)));
  const [sel, setSel] = useState<number | null>(null);
  const report = useReport(field);
  return (
    <div className={className} style={style}>
      <div className="flex items-center justify-between gap-2">
        {Array.from({ length: n }, (_, i) => i + 1).map((p) => (
          <button key={p} type="button" onClick={() => { setSel(p); report(p); }} className="flex-1">
            <span className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors", sel === p ? "border-teal-500 bg-teal-500 text-white" : "border-gray-200 text-gray-500 hover:border-teal-300")}>
              {p}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.7rem] text-gray-400">
        <span>{str(minLabel) || "Strongly disagree"}</span>
        <span>{str(maxLabel) || "Strongly agree"}</span>
      </div>
      <FieldFooter field={field} />
    </div>
  );
}

function Rating({ field, max, className, style }: P) {
  const n = Math.max(2, Math.min(10, numOr(max, 5)));
  const [sel, setSel] = useState(0);
  const report = useReport(field);
  return (
    <div className={className} style={style}>
      <div className="flex gap-1">
        {Array.from({ length: n }, (_, i) => i + 1).map((s) => (
          <button key={s} type="button" onClick={() => { setSel(s); report(s); }} className="text-2xl leading-none">
            <span className={s <= sel ? "text-amber-400" : "text-gray-200"}>★</span>
          </button>
        ))}
      </div>
      <FieldFooter field={field} />
    </div>
  );
}

function Slider({ field, min, max, step, className, style }: P) {
  const lo = numOr(min, 0), hi = numOr(max, 100);
  const [v, setV] = useState(lo);
  const report = useReport(field);
  return (
    <div className={className} style={style}>
      <input type="range" min={lo} max={hi} step={numOr(step, 1)} value={v} onChange={(e) => { const n = Number(e.target.value); setV(n); report(n); }} className="w-full accent-teal-500" />
      <div className="mt-1 flex justify-between text-[0.7rem] text-gray-400">
        <span>{lo}</span>
        <span className="font-semibold text-teal-600">{v}</span>
        <span>{hi}</span>
      </div>
      <FieldFooter field={field} />
    </div>
  );
}

function Dropdown({ data, field, placeholder, className, style }: P) {
  const items = opts(data);
  const [v, setV] = useState("");
  const report = useReport(field);
  return (
    <div className={className} style={style}>
      <select
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          const n = Number(e.target.value);
          report(e.target.value === "" ? undefined : Number.isFinite(n) ? n : e.target.value);
        }}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-400"
      >
        <option value="">{str(placeholder) || "Select…"}</option>
        {items.map((o, i) => (
          <option key={i} value={String(o.value)}>{o.text}</option>
        ))}
      </select>
      <FieldFooter field={field} />
    </div>
  );
}

function ShortText({ field, placeholder, className, style }: P) {
  const report = useReport(field);
  return (
    <div className={className} style={style}>
      <input type="text" placeholder={str(placeholder) || "Your answer…"} onChange={(e) => report(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
      <FieldFooter field={field} />
    </div>
  );
}

function LongText({ field, placeholder, className, style }: P) {
  const report = useReport(field);
  return (
    <div className={className} style={style}>
      <textarea rows={4} placeholder={str(placeholder) || "Your answer…"} onChange={(e) => report(e.target.value)} className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
      <FieldFooter field={field} />
    </div>
  );
}

function YesNo({ field, yesLabel, noLabel, className, style }: P) {
  const [sel, setSel] = useState<string | null>(null);
  const report = useReport(field);
  const Opt = ({ k, label }: { k: string; label: string }) => (
    <button type="button" onClick={() => { setSel(k); report(k === "yes" ? 1 : 0); }} className={cn("flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors", sel === k ? SELECTED : IDLE)}>
      {label}
    </button>
  );
  return (
    <div className={className} style={style}>
      <div className="flex gap-2">
        <Opt k="yes" label={str(yesLabel) || "Yes"} />
        <Opt k="no" label={str(noLabel) || "No"} />
      </div>
      <FieldFooter field={field} />
    </div>
  );
}

function Rank({ data, field, className, style }: P) {
  const base = opts(data);
  const sig = base.map((o) => o.text).join("|");
  const [items, setItems] = useState<Opt[]>(base);
  const report = useReport(field);
  useEffect(() => setItems(base), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const move = (i: number, dir: number) =>
    setItems((arr) => {
      const a = [...arr];
      const j = i + dir;
      if (j < 0 || j >= a.length) return a;
      [a[i], a[j]] = [a[j], a[i]];
      report(a.map((o) => o.value)); // ranked order, top first
      return a;
    });
  return (
    <div className={className} style={style}>
      <div className="space-y-2">
        {items.map((o, i) => (
          // Index key: texts can be empty or duplicated mid-edit (and rows can
          // come from a DB binding), so they are not safe as keys.
          <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">{i + 1}</span>
            <span className="flex-1">{o.text}</span>
            <div className="flex flex-col leading-none">
              <button type="button" onClick={() => move(i, -1)} className="text-gray-400 hover:text-teal-600">▲</button>
              <button type="button" onClick={() => move(i, 1)} className="text-gray-400 hover:text-teal-600">▼</button>
            </div>
          </div>
        ))}
      </div>
      <FieldFooter field={field} />
    </div>
  );
}

export const TEST_WIDGETS: Record<string, React.ComponentType<P>> = {
  "single-choice": SingleChoice,
  "multi-choice": MultiChoice,
  likert: Likert,
  rating: Rating,
  slider: Slider,
  dropdown: Dropdown,
  "short-text": ShortText,
  "long-text": LongText,
  "yes-no": YesNo,
  rank: Rank,
};
