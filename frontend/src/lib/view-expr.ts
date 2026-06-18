// A tiny, SAFE expression evaluator for block templates. It powers {{ ... }}
// interpolation and data-if / data-sort directives without ever running
// author-supplied JavaScript (no eval / no Function). It supports:
//   • literals: numbers, 'strings', "strings", true / false / null
//   • paths:    name, a.b.c            (resolved against the scope)
//   • unary:    !x   -x
//   • binary:   + - * / %  < > <= >=  == != === !==  && ||  ?? (empty-fallback)
//   • ternary:  cond ? a : b
//   • calls:    round(x), if(c, a, b), plural(n, ...) — allowlisted helpers only
//   • member:   top(scales).name       (property access on a call result)
//
// Anything it can't parse evaluates to undefined (renders as ""), so a typo in a
// template degrades gracefully instead of throwing. Use validate() in editors
// to surface those typos to authors instead of silently rendering "".

type Scope = Record<string, unknown>;

// ── Allowlisted helper functions (the ONLY callables) ───────────────────────
const FUNCS: Record<string, (...a: any[]) => unknown> = {
  round: (x) => Math.round(Number(x)),
  floor: (x) => Math.floor(Number(x)),
  ceil: (x) => Math.ceil(Number(x)),
  abs: (x) => Math.abs(Number(x)),
  min: (...a) => Math.min(...a.map(Number)),
  max: (...a) => Math.max(...a.map(Number)),
  sqrt: (x) => Math.sqrt(Number(x)),
  pow: (x, y) => Math.pow(Number(x), Number(y)),
  sum: (list) => (Array.isArray(list) ? list.reduce((s, v) => s + Number(v) || s, 0) : Number(list) || 0),
  avg: (list) => (Array.isArray(list) && list.length ? list.reduce((s, v) => s + Number(v), 0) / list.length : 0),
  len: (v) =>
    Array.isArray(v) || typeof v === "string"
      ? v.length
      : v && typeof v === "object"
        ? Object.keys(v).length
        : 0,
  pct: (part, whole) => (Number(whole) ? Math.round((Number(part) / Number(whole)) * 100) : 0),
  round1: (x) => Math.round(Number(x) * 10) / 10,

  // ── Conditional / fallback ─────────────────────────────────────────────
  if: (c, a, b) => (c ? a : b ?? ""),
  default: (v, d) => (isEmpty(v) ? d : v),

  // ── Text ───────────────────────────────────────────────────────────────
  upper: (s) => String(s ?? "").toUpperCase(),
  lower: (s) => String(s ?? "").toLowerCase(),
  capitalize: (s) => {
    const t = String(s ?? "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  join: (list, sep) =>
    Array.isArray(list)
      ? list
          .map((v) =>
            v && typeof v === "object"
              ? String((v as Record<string, unknown>).name ?? (v as Record<string, unknown>).text ?? "")
              : String(v),
          )
          .join(String(sep ?? ", "))
      : String(list ?? ""),

  // Word form by count. 2 forms = English rule ("question", "questions");
  // 3 forms = Slavic rule for ru ("вопрос", "вопроса", "вопросов").
  plural: (n, ...forms) => {
    const x = Math.abs(Math.trunc(Number(n) || 0));
    if (forms.length <= 1) return String(forms[0] ?? "");
    if (forms.length === 2) return String(x === 1 ? forms[0] : forms[1]);
    const m10 = x % 10;
    const m100 = x % 100;
    if (m10 === 1 && m100 !== 11) return String(forms[0]);
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return String(forms[1]);
    return String(forms[2]);
  },

  // ── Formatting ─────────────────────────────────────────────────────────
  // format(650000) → "650 000" · format(3.14159, 2) → "3.14"
  format: (n, dec) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return "";
    const d = Number.isFinite(Number(dec)) ? Math.max(0, Math.min(6, Number(dec))) : 0;
    const [int, fr] = Math.abs(x).toFixed(d).split(".");
    const g = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (x < 0 ? "-" : "") + g + (fr ? `.${fr}` : "");
  },
  // date(iso, "DD.MM.YYYY") · tokens: YYYY MM MMM DD D · default "D MMM YYYY"
  date: (v, fmt) => {
    const d = new Date(String(v ?? ""));
    if (Number.isNaN(d.getTime())) return String(v ?? "");
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (x: number) => String(x).padStart(2, "0");
    return String(fmt ?? "D MMM YYYY")
      .replace("YYYY", String(d.getFullYear()))
      .replace("MMM", MONTHS[d.getMonth()])
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate()))
      .replace(/\bD\b/, String(d.getDate()));
  },

  // ── Collections (scales objects / row arrays) ──────────────────────────
  // top(scales) → the highest entry as {name, value}; top(scales, 3) → array.
  top: (data, n) => {
    const entries = toEntries(data).sort((a, b) => b.value - a.value);
    const count = Number(n);
    if (!Number.isFinite(count) || count <= 1) return entries[0];
    return entries.slice(0, count);
  },
  // range(1, 5) → [1, 2, 3, 4, 5] — number lists for scales / generated options.
  range: (from, to, step) => {
    const f = Number(from);
    const t = Number(to);
    const s = Math.abs(Number(step)) || 1;
    if (!Number.isFinite(f) || !Number.isFinite(t)) return [];
    const out: number[] = [];
    if (f <= t) for (let x = f; x <= t && out.length < 1000; x += s) out.push(x);
    else for (let x = f; x >= t && out.length < 1000; x -= s) out.push(x);
    return out;
  },
  // rank(scales, "R") → 1-based position of key when sorted by value desc.
  rank: (data, key) => {
    const entries = toEntries(data).sort((a, b) => b.value - a.value);
    const i = entries.findIndex((e) => e.name === String(key));
    return i < 0 ? 0 : i + 1;
  },
  // series("Realistic", realistic, "Social", social, …) → [{name, value}, …].
  // Builds a labelled row array from alternating label/value pairs — the bridge
  // from individual scalar variables to the array shape charts expect, since the
  // expression language has no array/object literals.
  series: (...args) => {
    const out: { name: string; value: number }[] = [];
    for (let i = 0; i + 1 < args.length; i += 2) {
      out.push({ name: String(args[i]), value: Number(args[i + 1]) || 0 });
    }
    return out;
  },
};

// "Missing" for fallback purposes: null/undefined, empty string, NaN.
const isEmpty = (v: unknown) =>
  v == null || v === "" || (typeof v === "number" && Number.isNaN(v));

// Normalize a scales object ({R: 72, ...}) or a row array into {name, value}[].
function toEntries(data: unknown): { name: string; value: number }[] {
  if (Array.isArray(data)) {
    return data.map((v, i) => {
      if (v && typeof v === "object") {
        const r = v as Record<string, unknown>;
        return { name: String(r.name ?? r.text ?? r.label ?? i), value: Number(r.value) || 0 };
      }
      return { name: String(i), value: Number(v) || 0 };
    });
  }
  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>).map(([name, v]) => ({
      name,
      value: Number(v) || 0,
    }));
  }
  return [];
}

// ── Tokenizer ───────────────────────────────────────────────────────────────
type Tok = { t: "num" | "str" | "id" | "op" | "punc"; v: string | number };
const OPS = ["===", "!==", "==", "!=", "<=", ">=", "&&", "||", "??", "<", ">", "+", "-", "*", "/", "%", "!", "?", ":"];

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      toks.push({ t: "num", v: parseFloat(src.slice(i, j)) });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1; let s = "";
      while (j < src.length && src[j] !== c) { s += src[j]; j++; }
      toks.push({ t: "str", v: s });
      i = j + 1; continue;
    }
    if (/[a-zA-Z_$]/.test(c)) {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z0-9_$.]/.test(src[j])) j++;
      toks.push({ t: "id", v: src.slice(i, j) });
      i = j; continue;
    }
    if (c === "(" || c === ")" || c === "," || c === ".") { toks.push({ t: "punc", v: c }); i++; continue; }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (op) { toks.push({ t: "op", v: op }); i += op.length; continue; }
    i++; // skip unknown char
  }
  return toks;
}

// ── Parser (recursive descent, precedence-climbing) ─────────────────────────
type Node =
  | { k: "lit"; v: unknown }
  | { k: "path"; v: string }
  | { k: "unary"; op: string; x: Node }
  | { k: "bin"; op: string; l: Node; r: Node }
  | { k: "cond"; c: Node; a: Node; b: Node }
  | { k: "call"; name: string; args: Node[] }
  | { k: "member"; o: Node; p: string };

function parseFull(toks: Tok[]): { node: Node | null; end: number } {
  let pos = 0;
  const peek = () => toks[pos];
  const eat = (v: string) => (peek() && peek().v === v ? (pos++, true) : false);

  const expr = (): Node => ternary();
  function ternary(): Node {
    const c = bin(0);
    if (peek() && peek().v === "?") { pos++; const a = expr(); eat(":"); const b = expr(); return { k: "cond", c, a, b }; }
    return c;
  }
  // Binary operators by precedence (low → high).
  const LEVELS = [["??"], ["||"], ["&&"], ["===", "!==", "==", "!="], ["<", ">", "<=", ">="], ["+", "-"], ["*", "/", "%"]];
  function bin(level: number): Node {
    if (level >= LEVELS.length) return unary();
    let left = bin(level + 1);
    while (peek() && peek().t === "op" && LEVELS[level].includes(peek().v as string)) {
      const op = String(toks[pos++].v);
      const right = bin(level + 1);
      left = { k: "bin", op, l: left, r: right };
    }
    return left;
  }
  function unary(): Node {
    if (peek() && (peek().v === "!" || peek().v === "-")) {
      const op = String(toks[pos++].v);
      return { k: "unary", op, x: unary() };
    }
    return primary();
  }
  // Postfix member access on a primary — `top(scales).name`, `(x).value`.
  function primary(): Node {
    let node = primaryBase();
    while (peek() && peek().t === "punc" && peek().v === ".") {
      pos++;
      const t = peek();
      if (!t || t.t !== "id") break;
      pos++;
      node = { k: "member", o: node, p: String(t.v) };
    }
    return node;
  }
  function primaryBase(): Node {
    const t = peek();
    if (!t) return { k: "lit", v: undefined };
    if (t.t === "num") { pos++; return { k: "lit", v: t.v }; }
    if (t.t === "str") { pos++; return { k: "lit", v: t.v }; }
    if (t.v === "(") { pos++; const e = expr(); eat(")"); return e; }
    if (t.t === "id") {
      pos++;
      const name = String(t.v);
      if (name === "true") return { k: "lit", v: true };
      if (name === "false") return { k: "lit", v: false };
      if (name === "null") return { k: "lit", v: null };
      if (peek() && peek().v === "(") {
        pos++;
        const args: Node[] = [];
        if (peek() && peek().v !== ")") {
          args.push(expr());
          while (eat(",")) args.push(expr());
        }
        eat(")");
        return { k: "call", name, args };
      }
      return { k: "path", v: name };
    }
    pos++;
    return { k: "lit", v: undefined };
  }

  try {
    const node = expr();
    return { node, end: pos };
  } catch {
    return { node: null, end: pos };
  }
}

function parse(toks: Tok[]): Node | null {
  return parseFull(toks).node;
}

// ── Evaluation ──────────────────────────────────────────────────────────────
export function resolvePath(path: string, scope: Scope): unknown {
  return path.split(".").reduce<unknown>(
    (o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]),
    scope,
  );
}

const num = (v: unknown) => (typeof v === "number" ? v : parseFloat(String(v)));

function evalNode(n: Node, scope: Scope): unknown {
  switch (n.k) {
    case "lit": return n.v;
    case "path": return resolvePath(n.v, scope);
    case "unary": {
      const x = evalNode(n.x, scope);
      return n.op === "!" ? !x : -num(x);
    }
    case "cond": return evalNode(n.c, scope) ? evalNode(n.a, scope) : evalNode(n.b, scope);
    case "member": {
      const o = evalNode(n.o, scope);
      return o == null ? undefined : resolvePath(n.p, o as Scope);
    }
    case "call": {
      const fn = FUNCS[n.name];
      if (!fn) return undefined;
      return fn(...n.args.map((a) => evalNode(a, scope)));
    }
    case "bin": {
      const op = n.op;
      if (op === "&&") return evalNode(n.l, scope) && evalNode(n.r, scope);
      if (op === "||") return evalNode(n.l, scope) || evalNode(n.r, scope);
      const l = evalNode(n.l, scope);
      if (op === "??") return isEmpty(l) ? evalNode(n.r, scope) : l;
      const r = evalNode(n.r, scope);
      switch (op) {
        case "+": return typeof l === "string" || typeof r === "string" ? String(l ?? "") + String(r ?? "") : num(l) + num(r);
        case "-": return num(l) - num(r);
        case "*": return num(l) * num(r);
        case "/": return num(l) / num(r);
        case "%": return num(l) % num(r);
        case "<": return num(l) < num(r);
        case ">": return num(l) > num(r);
        case "<=": return num(l) <= num(r);
        case ">=": return num(l) >= num(r);
        case "==": case "===": return l === r;
        case "!=": case "!==": return l !== r;
      }
    }
  }
  return undefined;
}

// Parsed-AST cache (templates re-render often; expressions are stable strings).
const cache = new Map<string, Node | null>();

export function evaluate(expr: string, scope: Scope): unknown {
  let ast = cache.get(expr);
  if (ast === undefined) {
    ast = parse(tokenize(expr));
    cache.set(expr, ast);
  }
  if (!ast) return undefined;
  try {
    return evalNode(ast, scope);
  } catch {
    return undefined;
  }
}

/** Interpolate {{ expression }} occurrences in a string. */
export function interpolate(text: string, scope: Scope): string {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, e) => {
    const v = evaluate(String(e).trim(), scope);
    return v == null ? "" : String(v);
  });
}

/** Truthiness of an expression, for data-if. */
export function truthy(expr: string, scope: Scope): boolean {
  return !!evaluate(expr, scope);
}

// ── Editor support ──────────────────────────────────────────────────────────

/** Validate one expression; returns a human-readable error or null if OK. */
export function validate(expr: string): string | null {
  const toks = tokenize(expr);
  if (!toks.length) return "Empty expression";
  // The parser recovers from a missing ")" silently — check balance up front.
  const opens = toks.filter((t) => t.t === "punc" && t.v === "(").length;
  const closes = toks.filter((t) => t.t === "punc" && t.v === ")").length;
  if (opens > closes) return "Missing “)”";
  if (closes > opens) return "Unexpected “)”";
  const { node, end } = parseFull(toks);
  if (!node) return "Cannot parse expression";
  if (end < toks.length) return `Unexpected “${toks[end].v}”`;
  let err: string | null = null;
  const walk = (n: Node) => {
    if (err) return;
    switch (n.k) {
      case "call":
        if (!FUNCS[n.name]) { err = `Unknown function ${n.name}()`; return; }
        n.args.forEach(walk);
        break;
      case "bin": walk(n.l); walk(n.r); break;
      case "cond": walk(n.c); walk(n.a); walk(n.b); break;
      case "unary": walk(n.x); break;
      case "member": walk(n.o); break;
    }
  };
  walk(node);
  return err;
}

/** Validate every {{ expression }} in a text; first error or null. */
export function validateTemplate(text: string): string | null {
  const opens = (text.match(/\{\{/g) ?? []).length;
  const closes = (text.match(/\}\}/g) ?? []).length;
  if (opens > closes) return "Unclosed {{ … }}";
  for (const m of text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
    const err = validate(m[1]);
    if (err) return `${err} in {{${m[1]}}}`;
  }
  return null;
}

/** Function reference shown in editor insert menus. */
export const FUNC_DOCS: { sig: string; doc: string; snippet: string }[] = [
  { sig: "if(cond, then, else)", doc: "Conditional text", snippet: "if(result.total >= 70, 'High', 'Low')" },
  { sig: "x ?? y", doc: "Fallback when empty", snippet: "user.nickname ?? user.name" },
  { sig: "plural(n, one, many)", doc: "Word form by count (3 forms for ru)", snippet: "plural(len(result.scales), 'scale', 'scales')" },
  { sig: "format(n, decimals?)", doc: "Thousands separators", snippet: "format(650000)" },
  { sig: "date(value, fmt?)", doc: "D MMM YYYY · DD.MM.YYYY", snippet: "date(result.completedAt, 'DD.MM.YYYY')" },
  { sig: "range(from, to, step?)", doc: "Number list — scales, generated options", snippet: "range(1, 10)" },
  { sig: "top(scales, n?)", doc: "Highest entry — use .name / .value", snippet: "top(result.scales).name" },
  { sig: "rank(scales, key)", doc: "Position by value, 1 = highest", snippet: "rank(result.scales, 'R')" },
  { sig: "pct(part, whole)", doc: "Percentage 0–100", snippet: "pct(result.total, 100)" },
  { sig: "round(x)", doc: "Also: round1, floor, ceil, abs", snippet: "round(result.total / 6)" },
  { sig: "capitalize(s)", doc: "Also: upper, lower", snippet: "capitalize(user.name)" },
  { sig: "join(list, sep)", doc: "List to text", snippet: "join(top(result.scales, 3), ', ')" },
  { sig: "len(x)", doc: "Count items / keys / characters", snippet: "len(result.scales)" },
];
