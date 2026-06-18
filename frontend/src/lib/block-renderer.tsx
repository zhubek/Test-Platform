"use client";

// ── Block renderer (prototype) ──────────────────────────────────────────────
// Turns an author-written HTML+Tailwind *template* into a live, interactive
// question control. Engine-agnostic: it reads ONLY our own Question model — it
// never imports survey-core, so it works whether or not SurveyJS stays.
//
// Supported template directives (kept deliberately small for the slice):
//   {{ question.title | choice.text | choice.value | choice.index }}  — bindings
//   data-choice            → element is the per-option template (repeats N times,
//                            click selects). Everything else renders once.
//   data-selected="<cls>"  → those Tailwind classes apply when the option is selected
//   data-show-when="selected|unselected" → render the element only in that state
//   data-part="<name>"     → merge the global default classes for that part, so
//                            anything the author leaves off inherits the global style
//
// Author classes always win over the part default (tailwind-merge via cn()).

import { createElement, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { localize } from "@/lib/localized";
import type { Question, AnswerChoice } from "@/app/(admin)/admin/_components/mock-data";

type Locale = string;

interface Ctx {
  question: Question;
  locale: Locale;
  isSelected: (c: AnswerChoice) => boolean;
  onSelect: (c: AnswerChoice) => void;
  choice?: AnswerChoice;
  index?: number;
}

// Only these tags are ever emitted — author markup can't smuggle scripts/iframes.
const ALLOWED_TAGS = new Set([
  "div", "span", "label", "p", "section", "article", "figure", "figcaption",
  "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "b", "i", "small",
  "ul", "ol", "li", "img", "br", "hr", "button", "a",
]);

// The "global style" fallback: default classes per named part. Leave a part's
// class off → it inherits these; set a class → yours merges over.
const PART_DEFAULTS: Record<string, string> = {
  option: "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all",
  indicator: "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
  label: "text-[0.84rem] text-foreground",
};

function resolve(path: string, ctx: Ctx): string {
  switch (path) {
    case "question.title": return localize(ctx.question.text, ctx.locale);
    case "choice.text": return ctx.choice ? localize(ctx.choice.text, ctx.locale) : "";
    case "choice.value": return ctx.choice ? String(ctx.choice.value ?? (ctx.index ?? 0) + 1) : "";
    case "choice.index": return String((ctx.index ?? 0) + 1);
    default: return "";
  }
}

function interpolate(text: string, ctx: Ctx): string {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => resolve(String(expr).trim(), ctx));
}

// Minimal inline-style escape hatch: "color:red; font-size:12px" → object.
function styleStringToObject(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const i = decl.indexOf(":");
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (prop) out[prop] = decl.slice(i + 1).trim();
  }
  return out as React.CSSProperties;
}

function renderEl(el: Element, ctx: Ctx, key: string): React.ReactNode {
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) return null;

  const isChoiceRoot = el.hasAttribute("data-choice");

  // Expand the per-option template once, one render per choice.
  if (isChoiceRoot && !ctx.choice) {
    return ctx.question.choices.map((choice, i) =>
      renderEl(el, { ...ctx, choice, index: i }, `${key}-${choice.id}`),
    );
  }

  // State gating.
  const showWhen = el.getAttribute("data-show-when");
  if (showWhen && ctx.choice) {
    const sel = ctx.isSelected(ctx.choice);
    if ((showWhen === "selected") !== sel) return null;
  }

  // class = part default  +  author classes  +  selected-state classes
  const part = el.getAttribute("data-part");
  const selected = !!ctx.choice && ctx.isSelected(ctx.choice);
  const className =
    cn(
      part ? PART_DEFAULTS[part] : undefined,
      el.getAttribute("class") ?? "",
      selected ? el.getAttribute("data-selected") ?? "" : "",
    ) || undefined;

  const props: Record<string, unknown> = { key, className };

  const styleAttr = el.getAttribute("style");
  if (styleAttr) props.style = styleStringToObject(styleAttr);

  if (tag === "img") {
    const src = el.getAttribute("src") ?? "";
    if (/^(https?:|data:image\/)/i.test(src)) props.src = src;
    props.alt = el.getAttribute("alt") ?? "";
  }
  if (tag === "a") {
    const href = el.getAttribute("href") ?? "";
    if (/^(https?:|\/|#|mailto:)/i.test(href)) props.href = href;
  }
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("aria-") || attr.name === "role") props[attr.name] = attr.value;
  }

  // Clicking the option root selects it.
  if (isChoiceRoot && ctx.choice) {
    const choice = ctx.choice;
    props.onClick = () => ctx.onSelect(choice);
    if (!props.role && tag !== "button") props.role = "button";
  }

  if (tag === "img" || tag === "br" || tag === "hr") return createElement(tag, props);

  const children = Array.from(el.childNodes).map((n, i) => renderNode(n, ctx, `${key}-${i}`));
  return createElement(tag, props, children);
}

function renderNode(node: ChildNode, ctx: Ctx, key: string): React.ReactNode {
  if (node.nodeType === 3) return interpolate(node.textContent ?? "", ctx); // text
  if (node.nodeType === 1) return renderEl(node as Element, ctx, key); // element
  return null;
}

export interface BlockRendererProps {
  html: string;
  question: Question;
  value: string | null;
  onChange: (choiceId: string) => void;
  locale?: Locale;
}

export function BlockRenderer({ html, question, value, onChange, locale = "en" }: BlockRendererProps) {
  // DOMParser is browser-only, and parsed markup can't match the server render.
  // Gate on mount so the first client render matches the server (both null),
  // then render the block after hydration — no hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const body = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new DOMParser().parseFromString(html, "text/html").body;
  }, [html]);

  if (!mounted || !body) return null;

  const ctx: Ctx = {
    question,
    locale,
    isSelected: (c) => value === c.id,
    onSelect: (c) => onChange(c.id),
  };

  return <>{Array.from(body.childNodes).map((n, i) => renderNode(n, ctx, `n${i}`))}</>;
}
