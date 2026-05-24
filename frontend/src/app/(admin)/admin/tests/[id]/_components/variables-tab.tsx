"use client";

import { useState } from "react";
import { Plus, Download } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { VariableCard } from "./variable-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATALOGS } from "@/lib/catalog-characteristics";
import type { Variable } from "../../../_components/mock-data";

interface Props {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
}

export function VariablesTab({ variables, onVariablesChange }: Props) {
  const { t } = useLocale();
  const [seq, setSeq] = useState(0);

  const handleVarUpdate = (idx: number, partial: Partial<Variable>) =>
    onVariablesChange(variables.map((v, i) => (i === idx ? { ...v, ...partial } : v)));

  const handleVarDelete = (idx: number) =>
    onVariablesChange(variables.filter((_, i) => i !== idx));

  const handleVarAdd = () =>
    onVariablesChange([
      ...variables,
      { id: `var_${Date.now()}_${seq}`, name: "", description: "" },
    ]);

  // Import a catalog group's keys as variables, skipping ones already present.
  const importGroup = (catalogId: string, groupId: string) => {
    const catalog = CATALOGS.find((c) => c.id === catalogId);
    const group = catalog?.groups.find((g) => g.id === groupId);
    if (!group) return;

    const existingNames = new Set(variables.map((v) => v.name));
    let n = seq;
    const additions: Variable[] = group.keys
      .filter((k) => !existingNames.has(k.key))
      .map((k) => ({
        id: `var_${Date.now()}_${++n}`,
        name: k.key,
        description: k.label,
        source: { catalogId, groupId },
      }));
    setSeq(n);
    if (additions.length) onVariablesChange([...variables, ...additions]);
  };

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
        <div className="flex items-center gap-2">
          {/* Import from catalog */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Download className="mr-1 h-3.5 w-3.5" />
              Import from catalog
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {CATALOGS.map((catalog) => (
                <div key={catalog.id}>
                  <div className="px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {catalog.name}
                  </div>
                  {catalog.groups.map((group) => (
                    <DropdownMenuItem
                      key={group.id}
                      onClick={() => importGroup(catalog.id, group.id)}
                    >
                      <span className="flex flex-col">
                        <span className="text-sm">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.keys.length} characteristics
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={handleVarAdd} className="text-primary hover:text-teal-700">
            <Plus className="h-3.5 w-3.5" />
            {t("cm.calculation.addVariable")}
          </Button>
        </div>
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
