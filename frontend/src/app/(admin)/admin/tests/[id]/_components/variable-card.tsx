import { useState } from "react";
import { Trash2, Languages, ChevronDown, Plus, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { LocalizedInput } from "@/components/localized-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Variable, ValueTranslation } from "../../../_components/mock-data";

interface Props {
  variable: Variable;
  onChange: (partial: Partial<Variable>) => void;
  onDelete?: () => void; // omitted for derived (profession) vars
  readOnlyValue?: boolean; // profession vars: formula is computed, not authored
  noFormula?: boolean; // multiple-choice vars: name + option translations only
  lockName?: boolean; // characteristic vars: name tied to catalog key, formula editable
}

const KIND_BADGE: Record<Variable["kind"], string> = {
  characteristic: "cm.calculation.kindCharacteristic",
  custom: "cm.calculation.kindCustom",
  singlechoice: "cm.calculation.kindSinglechoice",
  multiplechoice: "cm.calculation.kindMultiplechoice",
  profession: "cm.calculation.kindProfession",
};

export function VariableCard({ variable, onChange, onDelete, readOnlyValue, noFormula, lockName }: Props) {
  const { t, locale } = useLocale();
  const translations = variable.valueTranslations ?? [];
  // Characteristic vars are pure numeric dimensions — no value→label table.
  const showTranslations = variable.kind !== "characteristic";
  // Editable for everything except catalog-derived (profession) vars.
  const editableTr = !readOnlyValue;
  const [trOpen, setTrOpen] = useState(translations.length === 0 ? false : !editableTr ? false : true);

  const updateTranslation = (i: number, partial: Partial<ValueTranslation>) =>
    onChange({
      valueTranslations: translations.map((tr, idx) => (idx === i ? { ...tr, ...partial } : tr)),
    });
  const addTranslation = () => {
    const nextValue = translations.reduce((m, tr) => Math.max(m, tr.value), 0) + 1;
    onChange({
      valueTranslations: [...translations, { value: nextValue, label: { en: "", ru: "", kz: "" } }],
    });
    setTrOpen(true);
  };
  const deleteTranslation = (i: number) =>
    onChange({ valueTranslations: translations.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={variable.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="variable_name"
          disabled={readOnlyValue || lockName}
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

      {/* Formula — author-set for characteristic/custom; computed for profession;
          omitted for multiple-choice (stored as selected option rows). */}
      {readOnlyValue ? (
        <p className="text-[0.7rem] italic text-muted-foreground">
          {t("cm.calculation.computedByMapping")}
        </p>
      ) : noFormula ? null : (
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

      {/* Catalog badge */}
      {variable.source && (
        <div className="flex justify-end">
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-primary">
            {t("cm.calculation.fromCatalog")}
          </span>
        </div>
      )}

      {/* Value → label translation table. Hidden entirely for characteristic
          vars (numeric dimensions). Editable for all but catalog-derived vars. */}
      {showTranslations && (editableTr || translations.length > 0) && (
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
                <div key={i} className="flex items-center gap-2">
                  {editableTr ? (
                    <Input
                      type="number"
                      value={tr.value}
                      onChange={(e) => updateTranslation(i, { value: Number(e.target.value) })}
                      className="h-7 w-14 shrink-0 font-mono text-[0.72rem]"
                    />
                  ) : (
                    <span className="w-10 shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                      {tr.value}
                    </span>
                  )}
                  <LocalizedInput
                    value={tr.label}
                    onChange={(v) => updateTranslation(i, { label: v })}
                    placeholder={localize(tr.label, locale)}
                    className="flex-1"
                  />
                  {editableTr && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteTranslation(i)}
                      className="shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {editableTr && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addTranslation}
                  className="text-primary hover:text-teal-700"
                >
                  <Plus className="h-3.5 w-3.5" /> {t("cm.calculation.addTranslation")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
