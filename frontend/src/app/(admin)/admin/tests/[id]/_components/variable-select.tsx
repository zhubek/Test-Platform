"use client";

import { ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
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

// ── Multi-select dropdown: a Select-like trigger opening grouped checkboxes ──
export function VariableMultiSelect({
  variables,
  value,
  onChange,
  className,
}: BaseProps & { value: string[]; onChange: (names: string[]) => void }) {
  const { t, locale } = useLocale();
  const groups = KIND_GROUPS.map((g) => ({ ...g, vars: variables.filter((v) => v.kind === g.kind) })).filter(
    (g) => g.vars.length > 0,
  );
  const allNames = variables.map((v) => v.name);
  // value [] means "all"
  const isSelected = (name: string) => value.length === 0 || value.includes(name);
  const toggle = (name: string) => {
    const cur = value.length ? value : allNames;
    const next = cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name];
    onChange(next.length === allNames.length ? [] : next);
  };

  const selectedCount = value.length === 0 ? allNames.length : value.length;
  const triggerLabel =
    value.length === 0
      ? t("cm.resultView.allVariables")
      : `${selectedCount} ${t("cm.resultView.selected")}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={cn(
              "flex h-8 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none focus-visible:border-ring",
              className ?? "w-52",
            )}
          />
        }
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-auto">
        {groups.length === 0 ? (
          <DropdownMenuItem disabled>{t("cm.resultView.noVars")}</DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem closeOnClick={false} onClick={() => onChange([])}>
              <span className="text-[0.78rem] font-medium">{t("cm.resultView.selectAll")}</span>
            </DropdownMenuItem>
            {groups.map((g) => (
              <DropdownMenuGroup key={g.kind}>
                <DropdownMenuLabel className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                  {t(g.key)}
                </DropdownMenuLabel>
                {g.vars.map((v) => (
                  <DropdownMenuCheckboxItem
                    key={v.name}
                    checked={isSelected(v.name)}
                    closeOnClick={false}
                    onCheckedChange={() => toggle(v.name)}
                  >
                    {localize(v.label, locale) || v.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
