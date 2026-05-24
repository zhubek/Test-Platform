"use client";

import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { VariableCard } from "./variable-card";
import { Button } from "@/components/ui/button";
import type { Variable } from "../../../_components/mock-data";

interface Props {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
}

export function VariablesTab({ variables, onVariablesChange }: Props) {
  const { t } = useLocale();

  const handleVarUpdate = (idx: number, partial: Partial<Variable>) =>
    onVariablesChange(variables.map((v, i) => (i === idx ? { ...v, ...partial } : v)));

  const handleVarDelete = (idx: number) =>
    onVariablesChange(variables.filter((_, i) => i !== idx));

  const handleVarAdd = () =>
    onVariablesChange([
      ...variables,
      { id: `var_${Date.now()}`, name: "", description: { en: "", ru: "", kz: "" } },
    ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.88rem] font-semibold text-foreground">
            {t("cm.calculation.variables")}
          </h3>
          <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
            {t("cm.calculation.variablesSub")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleVarAdd} className="text-primary hover:text-teal-700">
          <Plus className="h-3.5 w-3.5" />
          {t("cm.calculation.addVariable")}
        </Button>
      </div>

      {variables.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {variables.map((v, i) => (
            <VariableCard
              key={v.id}
              variable={v}
              onChange={(partial) => handleVarUpdate(i, partial)}
              onDelete={() => handleVarDelete(i)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-6 text-center text-[0.78rem] text-muted-foreground">
          {t("cm.calculation.noVariables")}
        </div>
      )}
    </div>
  );
}
