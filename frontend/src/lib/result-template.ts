// Resolves a text-block template against variable values.
//   {var}        → the variable's translated label if one exists, else its number
//   {var.value}  → always the raw number
//   {var.label}  → always the label (falls back to the number if none)
//
// `vars` maps a variable name to its resolved value + optional localized label.

export interface ResolvedVar {
  value: number | string;
  label?: string; // value-translation in the current locale, if any
}

export function resolveTemplate(template: string, vars: Record<string, ResolvedVar>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)(?:\.(value|label))?\}/g, (_m, name: string, mode?: string) => {
    const v = vars[name];
    if (!v) return `{${name}}`; // unknown var — leave the token visible
    if (mode === "value") return String(v.value);
    if (mode === "label") return v.label ?? String(v.value);
    // default {var}: prefer label, else number
    return v.label ?? String(v.value);
  });
}
