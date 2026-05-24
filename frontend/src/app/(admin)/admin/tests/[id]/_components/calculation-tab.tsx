"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, BookOpen, Compass } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { VariableCard } from "./variable-card";
import { CATALOGS, DISTANCE_METHODS, findGroup } from "@/lib/catalog-characteristics";
import type {
  CatalogMapping,
  CharacteristicSection,
  Variable,
} from "../../../_components/mock-data";

interface Props {
  mappings: CatalogMapping[];
  sections: CharacteristicSection[];
  variables: Variable[];
  onMappingsChange: (mappings: CatalogMapping[]) => void;
  onSectionsChange: (sections: CharacteristicSection[]) => void;
  onVariablesChange: (variables: Variable[]) => void;
}

export function CalculationTab({
  mappings,
  variables,
  onMappingsChange,
  onVariablesChange,
}: Props) {
  const { t, locale } = useLocale();
  const [refOpen, setRefOpen] = useState(false);

  // ── Mapping handlers ────────────────────────────────────────────
  const addMapping = () => {
    const cat = CATALOGS[0];
    onMappingsChange([
      ...mappings,
      {
        id: `map_${Date.now()}`,
        catalogId: cat.id,
        groupId: cat.groups[0].id,
        method: "euclidean",
        topN: 5,
      },
    ]);
  };
  const updateMapping = (id: string, partial: Partial<CatalogMapping>) =>
    onMappingsChange(mappings.map((m) => (m.id === id ? { ...m, ...partial } : m)));
  const deleteMapping = (id: string) => onMappingsChange(mappings.filter((m) => m.id !== id));

  // ── Variable handlers (characteristic + custom only; profession is derived) ──
  const ownVars = variables.filter((v) => v.kind !== "profession");
  const updateVar = (id: string, partial: Partial<Variable>) =>
    onVariablesChange(variables.map((v) => (v.id === id ? { ...v, ...partial } : v)));
  const deleteVar = (id: string) => onVariablesChange(variables.filter((v) => v.id !== id));
  const addCustomVar = () =>
    onVariablesChange([
      ...variables,
      {
        id: `var_${Date.now()}`,
        name: "",
        label: { en: "", ru: "", kz: "" },
        kind: "custom",
        formula: "",
        scope: "both",
      },
    ]);

  // Import a mapping group's characteristic keys as characteristic variables.
  const importCharacteristics = (m: CatalogMapping) => {
    const group = findGroup(m.catalogId, m.groupId);
    if (!group) return;
    const existing = new Set(variables.map((v) => v.name));
    const additions: Variable[] = group.keys
      .filter((k) => !existing.has(k.key))
      .map((k, i) => ({
        id: `var_${Date.now()}_${i}`,
        name: k.key,
        label: k.label,
        kind: "characteristic" as const,
        formula: "",
        scope: "both" as const,
        source: { catalogId: m.catalogId, groupId: m.groupId },
      }));
    if (additions.length) onVariablesChange([...variables, ...additions]);
  };

  // Derived profession variables: topN per mapping, value→label = catalog items.
  const professionVars: Variable[] = mappings.flatMap((m) => {
    const group = findGroup(m.catalogId, m.groupId);
    const valueTranslations = (group?.items ?? []).map((it) => ({ value: it.code, label: it.name }));
    return Array.from({ length: m.topN }, (_, i) => ({
      id: `${m.id}_prof_${i + 1}`,
      name: `${m.groupId}_match_${i + 1}`,
      label: { en: `Match #${i + 1}`, ru: `Совпадение №${i + 1}`, kz: `Сәйкестік №${i + 1}` },
      kind: "profession" as const,
      scope: "both" as const,
      mappingId: m.id,
      rank: i + 1,
      valueTranslations,
    }));
  });

  return (
    <div className="space-y-8">
      {/* ── Catalog mappings ─────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[0.88rem] font-semibold text-foreground">
              {t("cm.calculation.mappingsHeading")}
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              {t("cm.calculation.mappingsSub")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={addMapping} className="text-primary hover:text-teal-700">
            <Plus className="h-3.5 w-3.5" />
            {t("cm.calculation.addMapping")}
          </Button>
        </div>

        {mappings.length > 0 ? (
          <div className="space-y-2">
            {mappings.map((m) => {
              const catalog = CATALOGS.find((c) => c.id === m.catalogId);
              const groups = catalog?.groups ?? [];
              return (
                <div key={m.id} className="rounded-xl border bg-card p-3 shadow-sm">
                  <div className="flex flex-wrap items-end gap-3">
                    {/* Catalog */}
                    <Field label={t("cm.calculation.catalog")}>
                      <Select
                        value={m.catalogId}
                        onValueChange={(v) => {
                          const c = CATALOGS.find((x) => x.id === v);
                          updateMapping(m.id, { catalogId: v ?? m.catalogId, groupId: c?.groups[0].id ?? m.groupId });
                        }}
                      >
                        <SelectTrigger size="sm" className="w-44">
                          <SelectValue>{() => localize(catalog?.name ?? { en: "", ru: "", kz: "" }, locale)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {CATALOGS.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{localize(c.name, locale)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Characteristic group (match-by) */}
                    <Field label={t("cm.calculation.matchBy")}>
                      <Select value={m.groupId} onValueChange={(v) => updateMapping(m.id, { groupId: v ?? m.groupId })}>
                        <SelectTrigger size="sm" className="w-48">
                          <SelectValue>
                            {() => localize(groups.find((g) => g.id === m.groupId)?.name ?? { en: "", ru: "", kz: "" }, locale)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{localize(g.name, locale)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Distance method */}
                    <Field label={t("cm.calculation.method")}>
                      <Select value={m.method} onValueChange={(v) => updateMapping(m.id, { method: (v as CatalogMapping["method"]) ?? m.method })}>
                        <SelectTrigger size="sm" className="w-40">
                          <SelectValue>
                            {() => localize(DISTANCE_METHODS.find((d) => d.id === m.method)?.label ?? { en: "", ru: "", kz: "" }, locale)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {DISTANCE_METHODS.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{localize(d.label, locale)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Top N */}
                    <Field label={t("cm.calculation.topN")}>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={m.topN}
                        onChange={(e) => updateMapping(m.id, { topN: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })}
                        className="h-8 w-20"
                      />
                    </Field>

                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => importCharacteristics(m)}
                        className="text-[0.72rem] text-primary hover:text-teal-700"
                      >
                        {t("cm.calculation.importChars")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteMapping(m.id)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-6 text-center text-[0.78rem] text-muted-foreground">
            {t("cm.calculation.noMappings")}
          </div>
        )}
      </section>

      {/* ── Variables ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[0.88rem] font-semibold text-foreground">
              {t("cm.calculation.variables")}
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              {t("cm.calculation.variablesSub")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={addCustomVar} className="text-primary hover:text-teal-700">
            <Plus className="h-3.5 w-3.5" />
            {t("cm.calculation.addVariable")}
          </Button>
        </div>

        {ownVars.length > 0 || professionVars.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {ownVars.map((v) => (
              <VariableCard
                key={v.id}
                variable={v}
                onChange={(partial) => updateVar(v.id, partial)}
                onDelete={() => deleteVar(v.id)}
              />
            ))}
            {/* Derived profession variables (read-only; produced by a mapping) */}
            {professionVars.map((v) => (
              <VariableCard key={v.id} variable={v} onChange={() => {}} readOnlyValue />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-6 text-center text-[0.78rem] text-muted-foreground">
            {t("cm.calculation.noVariables")}
          </div>
        )}

        {professionVars.length > 0 && (
          <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            <Compass className="h-3.5 w-3.5" />
            {t("cm.calculation.professionNote")}
          </p>
        )}

        <FormulaReference open={refOpen} onToggle={() => setRefOpen(!refOpen)} />
      </section>
    </div>
  );
}

// ── Small labeled field wrapper ─────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Formula Reference (collapsible) ─────────────────────────────
const refSections: { heading: string; rows: { syntax: string; desc: string; example: string }[] }[] = [
  {
    heading: "Arithmetic",
    rows: [
      { syntax: "+ - * / ^", desc: "Basic math", example: "realistic * 0.6 + artistic * 0.4" },
      { syntax: "( )", desc: "Grouping", example: "(a + b) / 2" },
    ],
  },
  {
    heading: "Functions",
    rows: [
      { syntax: "round/floor/ceil", desc: "Rounding", example: "round(score / 3)" },
      { syntax: "min/max/avg", desc: "Aggregate", example: "max(realistic, social)" },
      { syntax: "if(cond, a, b)", desc: "Conditional", example: "if(social > 50, 1, 0)" },
    ],
  },
];

function FormulaReference({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-xl border">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-[0.78rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {t("cm.calculation.formulaRef")}
        <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t bg-muted/50 px-4 py-3">
          {refSections.map((section) => (
            <div key={section.heading}>
              <h4 className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.heading}
              </h4>
              <div className="space-y-1">
                {section.rows.map((row) => (
                  <div key={row.syntax} className="grid grid-cols-[8rem_1fr_1fr] items-baseline gap-2 text-[0.75rem]">
                    <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[0.7rem] font-medium text-primary">
                      {row.syntax}
                    </code>
                    <span className="text-muted-foreground">{row.desc}</span>
                    <code className="font-mono text-[0.68rem] text-muted-foreground">{row.example}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
