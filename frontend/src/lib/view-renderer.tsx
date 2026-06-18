"use client";

// Generic template renderer for blocks. Renders author HTML+Tailwind, resolving
// {{ expression }} bindings (arithmetic / comparisons / helper calls via
// view-expr), plus a small set of safe directives:
//   data-each="list"      repeat children per item ({{item}} / {{index}})
//     · data-sort="k dir"   sort the list by item field k (asc | desc)
//     · data-shuffle        seeded random order (data-seed to vary)
//     · data-pick / -limit  keep only the first N
//   data-if="expr"        render the element only when expr is truthy
//   <widget name="...">   mount a registered React widget (charts, …)
//   <block name="...">    embed another block from the library; data-* attrs
//                         become the child's props (evaluated, so lists/objects
//                         pass through), its own defaults fill the rest
// Author HTML is walked into React elements (no dangerouslySetInnerHTML) with a
// tag/attr allowlist; no JavaScript from the template is ever executed.

import { createElement, Fragment, useEffect, useMemo, useState } from "react";
import { evaluate, interpolate, resolvePath, truthy } from "./view-expr";
import { WIDGETS } from "./view-widgets";

type Scope = Record<string, unknown>;

/** Resolves an embedded <block name="…"> to its template + default props. */
export type BlockResolver = (
  name: string,
) => { html: string; props: Record<string, unknown> } | null | undefined;

/** Build a resolver from a loaded block library (name → template + samples). */
export function blocksToResolver(
  blocks: {
    name: string;
    html: string;
    props: { name: string; value: unknown }[];
    sampleProps?: Record<string, unknown> | null;
  }[],
): BlockResolver {
  const byName = new Map(blocks.map((b) => [b.name, b]));
  return (name) => {
    const b = byName.get(name);
    if (!b) return null;
    // Saved sample values win; declared prop defaults cover older rows.
    if (b.sampleProps && Object.keys(b.sampleProps).length > 0) {
      return { html: b.html, props: b.sampleProps };
    }
    const props: Record<string, unknown> = {};
    for (const p of b.props) if (p.name) props[p.name] = p.value;
    return { html: b.html, props };
  };
}

interface RenderCtx {
  resolve?: BlockResolver;
  depth: number;
}

// Embeds may nest (a view composed of views), but cycles must stay harmless.
const MAX_EMBED_DEPTH = 5;

// Parsed-template cache — embeds re-parse the same library HTML on every render.
const bodyCache = new Map<string, HTMLElement | null>();
function parseBody(html: string): HTMLElement | null {
  if (typeof window === "undefined") return null;
  let body = bodyCache.get(html);
  if (body === undefined) {
    body = new DOMParser().parseFromString(html, "text/html").body;
    bodyCache.set(html, body);
  }
  return body;
}

const ALLOWED_TAGS = new Set([
  "div", "span", "p", "section", "article", "header", "footer", "main", "aside",
  "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "b", "i", "small", "mark", "blockquote",
  "ul", "ol", "li", "dl", "dt", "dd", "table", "thead", "tbody", "tr", "td", "th",
  "img", "a", "button", "br", "hr", "label", "details", "summary",
]);

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// Elements where React forbids whitespace-only text-node children (the newline +
// indent between <table>/<thead>/<tr> etc. in authored HTML). JSX strips these;
// we must too, or React logs a hydration error.
const WS_SENSITIVE = new Set(["table", "thead", "tbody", "tfoot", "tr", "colgroup"]);

function childrenOf(el: Element, tag: string): ChildNode[] {
  const nodes = Array.from(el.childNodes);
  if (!WS_SENSITIVE.has(tag)) return nodes;
  return nodes.filter((n) => !(n.nodeType === 3 && !(n.textContent ?? "").trim()));
}

function styleToObject(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const i = decl.indexOf(":");
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (prop) out[prop] = decl.slice(i + 1).trim();
  }
  return out as React.CSSProperties;
}

// ── data-each list transforms ───────────────────────────────────────────────
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed || 1);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortBy<T>(arr: T[], spec: string): T[] {
  const [key, dir] = spec.trim().split(/\s+/);
  const desc = (dir ?? "").toLowerCase() === "desc";
  const get = (it: T) => {
    if (!key || key === ".") return it;
    const s: Scope = typeof it === "object" && it ? { item: it, ...(it as object) } : { item: it };
    return resolvePath(key, s);
  };
  return [...arr].sort((a, b) => {
    const x = get(a), y = get(b);
    const r = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
    return desc ? -r : r;
  });
}

function renderEl(el: Element, scope: Scope, key: string, ctx: RenderCtx): React.ReactNode {
  // data-if gates the whole element (works for widgets and normal tags).
  const ifExpr = el.getAttribute("data-if");
  if (ifExpr != null && !truthy(ifExpr, scope)) return null;

  const tag = el.tagName.toLowerCase();

  // <block name="University list" data-specs="specs"/> — embed a library block.
  // Each data-* attr is evaluated against the current scope (falling back to
  // string interpolation), so the parent can hand lists/objects to the child.
  if (tag === "block") {
    const name = el.getAttribute("name") ?? "";
    const def = ctx.resolve?.(name);
    if (!def) {
      return createElement(
        "div",
        {
          key,
          className:
            "rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-2 text-xs text-amber-600",
        },
        `Block “${name}” not found`,
      );
    }
    if (ctx.depth >= MAX_EMBED_DEPTH) return null;
    const childScope: Scope = { ...def.props };
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith("data-")) continue;
      const k = camel(attr.name.slice(5));
      const v = evaluate(attr.value.trim(), scope);
      childScope[k] = v !== undefined ? v : interpolate(attr.value, scope);
    }
    const body = parseBody(def.html);
    if (!body) return null;
    return createElement(
      Fragment,
      { key },
      Array.from(body.childNodes).map((n, i) =>
        renderNode(n, childScope, `${key}-b${i}`, { ...ctx, depth: ctx.depth + 1 }),
      ),
    );
  }

  // <widget name="bar-chart" data-source="scores" data-x="name" .../>
  if (tag === "widget") {
    const W = WIDGETS[el.getAttribute("name") ?? ""];
    if (!W) return null;
    const wp: Record<string, unknown> = { key };
    const cls = el.getAttribute("class");
    if (cls) wp.className = interpolate(cls, scope);
    const st = el.getAttribute("style");
    if (st) wp.style = styleToObject(interpolate(st, scope));
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith("data-")) continue;
      const k = camel(attr.name.slice(5));
      if (k === "source") wp.data = evaluate(attr.value.trim(), scope);
      else wp[k] = interpolate(attr.value, scope);
    }
    return createElement(W, wp);
  }

  if (!ALLOWED_TAGS.has(tag)) return null;

  const props: Record<string, unknown> = { key };
  const rawClass = el.getAttribute("class");
  if (rawClass) props.className = interpolate(rawClass, scope);
  const rawStyle = el.getAttribute("style");
  if (rawStyle) props.style = styleToObject(interpolate(rawStyle, scope));
  if (tag === "img") {
    const src = interpolate(el.getAttribute("src") ?? "", scope);
    if (/^(https?:|data:image\/|\/)/i.test(src)) props.src = src;
    props.alt = interpolate(el.getAttribute("alt") ?? "", scope);
  }
  if (tag === "a") {
    const href = interpolate(el.getAttribute("href") ?? "", scope);
    if (/^(https?:|\/|#|mailto:)/i.test(href)) props.href = href;
  }
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("aria-") || attr.name === "role") props[attr.name] = interpolate(attr.value, scope);
  }
  // Native accordions: <details open> starts expanded.
  if (tag === "details" && el.hasAttribute("open")) props.open = true;

  if (tag === "img" || tag === "br" || tag === "hr") return createElement(tag, props);

  const each = el.getAttribute("data-each");
  let children: React.ReactNode;
  if (each != null) {
    const list = evaluate(each, scope);
    let arr = Array.isArray(list) ? list : [];
    const sort = el.getAttribute("data-sort");
    if (sort != null) arr = sortBy(arr, sort);
    if (el.hasAttribute("data-shuffle")) arr = shuffle(arr, parseInt(el.getAttribute("data-seed") ?? "7", 10));
    const pick = el.getAttribute("data-pick") ?? el.getAttribute("data-limit");
    if (pick != null) arr = arr.slice(0, Math.max(0, parseInt(pick, 10) || 0));
    const kids = childrenOf(el, tag);
    children = arr.map((item, i) =>
      kids.map((n, j) => renderNode(n, { ...scope, item, index: i }, `${key}-it${i}-${j}`, ctx)),
    );
  } else {
    children = childrenOf(el, tag).map((n, i) => renderNode(n, scope, `${key}-${i}`, ctx));
  }
  return createElement(tag, props, children);
}

function renderNode(node: ChildNode, scope: Scope, key: string, ctx: RenderCtx): React.ReactNode {
  if (node.nodeType === 3) return interpolate(node.textContent ?? "", scope); // text
  if (node.nodeType === 1) return renderEl(node as Element, scope, key, ctx); // element
  return null;
}

export function ViewRenderer({
  template,
  props,
  resolveBlock,
}: {
  template: string;
  props: Record<string, unknown>;
  resolveBlock?: BlockResolver;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const body = useMemo(() => parseBody(template), [template]);

  if (!mounted || !body) return null;
  const ctx: RenderCtx = { resolve: resolveBlock, depth: 0 };
  return <>{Array.from(body.childNodes).map((n, i) => renderNode(n, props, `n${i}`, ctx))}</>;
}
