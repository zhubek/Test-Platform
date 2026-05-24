import { Trash2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Variable, VariableScope } from "../../../_components/mock-data";

interface Props {
  variable: Variable;
  onChange: (partial: Partial<Variable>) => void;
  onDelete: () => void;
}

const SCOPES: { id: VariableScope; key: string }[] = [
  { id: "result", key: "cm.calculation.scopeResult" },
  { id: "dashboard", key: "cm.calculation.scopeDashboard" },
  { id: "both", key: "cm.calculation.scopeBoth" },
];

export function VariableCard({ variable, onChange, onDelete }: Props) {
  const { t } = useLocale();

  return (
    <div className="bg-card rounded-lg border shadow-sm p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={variable.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="variable_name"
          className="flex-1 font-mono"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Input
        type="text"
        value={variable.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder={t("cm.calculation.descPlaceholder")}
        className="w-full"
      />

      {/* Formula — the expression that produces this variable's value. */}
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

      {/* Scope — where this variable is consumed. */}
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
    </div>
  );
}
