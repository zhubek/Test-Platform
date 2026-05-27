"use client";

import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Variable, VariableKind } from "../../../_components/mock-data";

// Variable kinds shown as groups, mirroring the Calculation tab order.
const KIND_GROUPS: { kind: VariableKind; key: string }[] = [
  { kind: "characteristic", key: "cm.calculation.kindCharacteristic" },
  { kind: "custom", key: "cm.calculation.kindCustom" },
  { kind: "singlechoice", key: "cm.calculation.kindSinglechoice" },
  { kind: "multiplechoice", key: "cm.calculation.kindMultiplechoice" },
];

interface BaseProps {
  variables: Variable[];
  numericOnly?: boolean; // exclude nothing for now; reserved (all current vars are numeric)
  placeholder?: string;
  className?: string;
}

// ── Single-select ───────────────────────────────────────────────
export function VariableSelect({
  variables,
  value,
  onChange,
  placeholder,
  className,
}: BaseProps & { value?: string; onChange: (name: string | undefined) => void }) {
  const { t, locale } = useLocale();
  const byName = new Map(variables.map((v) => [v.name, v]));
  const groups = KIND_GROUPS.map((g) => ({ ...g, vars: variables.filter((v) => v.kind === g.kind) })).filter(
    (g) => g.vars.length > 0,
  );

  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || undefined)}>
      <SelectTrigger size="sm" className={cn("w-52", className)}>
        <SelectValue>
          {() => {
            const v = value ? byName.get(value) : undefined;
            return v ? localize(v.label, locale) || v.name : placeholder ?? t("cm.resultView.pickVariable");
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {groups.length === 0 ? (
          <SelectItem value="" disabled>{t("cm.resultView.noVars")}</SelectItem>
        ) : (
          groups.map((g) => (
            <SelectGroup key={g.kind}>
              <SelectLabel>{t(g.key)}</SelectLabel>
              {g.vars.map((v) => (
                <SelectItem key={v.name} value={v.name}>
                  {localize(v.label, locale) || v.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

// ── Multi-select (grouped checklist popover-less: a compact dropdown of toggles) ──
export function VariableMultiSelect({
  variables,
  value,
  onChange,
}: BaseProps & { value: string[]; onChange: (names: string[]) => void }) {
  const { t, locale } = useLocale();
  const groups = KIND_GROUPS.map((g) => ({ ...g, vars: variables.filter((v) => v.kind === g.kind) })).filter(
    (g) => g.vars.length > 0,
  );
  // value [] means "all"
  const isSelected = (name: string) => value.length === 0 || value.includes(name);
  const allNames = variables.map((v) => v.name);
  const toggle = (name: string) => {
    const cur = value.length ? value : allNames;
    const next = cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name];
    onChange(next.length === allNames.length ? [] : next);
  };

  return (
    <div className="space-y-1.5">
      {groups.length === 0 && (
        <span className="text-[0.72rem] text-muted-foreground">{t("cm.resultView.noVars")}</span>
      )}
      {groups.map((g) => (
        <div key={g.kind}>
          <p className="mb-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {t(g.key)}
          </p>
          <div className="flex flex-wrap gap-1">
            {g.vars.map((v) => (
              <button
                key={v.name}
                onClick={() => toggle(v.name)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[0.7rem] transition-colors",
                  isSelected(v.name)
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {localize(v.label, locale) || v.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
