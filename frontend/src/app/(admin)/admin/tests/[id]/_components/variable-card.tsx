import { useState } from "react";
import { Trash2, Languages, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { LocalizedInput } from "@/components/localized-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Variable, VariableScope } from "../../../_components/mock-data";

interface Props {
  variable: Variable;
  onChange: (partial: Partial<Variable>) => void;
  onDelete?: () => void; // omitted for derived (profession) vars
  readOnlyValue?: boolean; // profession vars: formula is computed, not authored
}

const SCOPES: { id: VariableScope; key: string }[] = [
  { id: "result", key: "cm.calculation.scopeResult" },
  { id: "dashboard", key: "cm.calculation.scopeDashboard" },
  { id: "both", key: "cm.calculation.scopeBoth" },
];

const KIND_BADGE: Record<Variable["kind"], string> = {
  characteristic: "cm.calculation.kindCharacteristic",
  custom: "cm.calculation.kindCustom",
  profession: "cm.calculation.kindProfession",
};

export function VariableCard({ variable, onChange, onDelete, readOnlyValue }: Props) {
  const { t, locale } = useLocale();
  const [trOpen, setTrOpen] = useState(false);
  const translations = variable.valueTranslations ?? [];

  const updateTranslation = (i: number, partial: Partial<{ value: number; label: typeof variable.label }>) =>
    onChange({
      valueTranslations: translations.map((tr, idx) => (idx === i ? { ...tr, ...partial } : tr)),
    });

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={variable.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="variable_name"
          disabled={readOnlyValue}
          className="flex-1 font-mono"
        />
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
          {t(KIND_BADGE[variable.kind])}
        </span>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Multilingual display label */}
      <LocalizedInput
        value={variable.label}
        onChange={(v) => onChange({ label: v })}
        placeholder={t("cm.calculation.labelPlaceholder")}
        className="w-full"
      />

      {/* Formula — author-set for characteristic/custom; computed for profession */}
      {readOnlyValue ? (
        <p className="text-[0.7rem] italic text-muted-foreground">
          {t("cm.calculation.computedByMapping")}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-muted-foreground">=</span>
          <Input
            type="text"
            value={variable.formula ?? ""}
            onChange={(e) => onChange({ formula: e.target.value })}
            placeholder={t("cm.calculation.formulaPlaceholder")}
            className="flex-1 font-mono"
          />
        </div>
      )}

      {/* Scope + catalog badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              onClick={() => onChange({ scope: s.id })}
              className={cn(
                "rounded-md px-2.5 py-1 text-[0.7rem] font-medium transition-colors",
                variable.scope === s.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(s.key)}
            </button>
          ))}
        </div>
        {variable.source && (
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-primary">
            {t("cm.calculation.fromCatalog")}
          </span>
        )}
      </div>

      {/* Value → label translation table (for coded outputs) */}
      {translations.length > 0 && (
        <div className="rounded-lg border">
          <button
            onClick={() => setTrOpen(!trOpen)}
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[0.7rem] font-medium text-muted-foreground hover:text-foreground"
          >
            <Languages className="h-3.5 w-3.5" />
            {t("cm.calculation.valueTranslations")} ({translations.length})
            <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform", trOpen && "rotate-180")} />
          </button>
          {trOpen && (
            <div className="space-y-1.5 border-t px-2.5 py-2">
              {translations.map((tr, i) => (
                <div key={tr.value} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                    {tr.value}
                  </span>
                  <LocalizedInput
                    value={tr.label}
                    onChange={(v) => updateTranslation(i, { label: v })}
                    placeholder={localize(tr.label, locale)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
