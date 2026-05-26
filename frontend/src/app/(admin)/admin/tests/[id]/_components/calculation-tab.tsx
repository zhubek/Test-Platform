"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, ChevronDown, BookOpen, Compass, Braces, Copy, Check, Code2, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VariableCard } from "./variable-card";
import { CATALOGS, DISTANCE_METHODS, findGroup } from "@/lib/catalog-characteristics";
import { effectiveChoiceValue, effectiveQuestionName } from "@/lib/surveyjs";
import { buildCalculationJson } from "@/lib/calculation-json";
import type {
  CatalogMapping,
  CharacteristicSection,
  Section,
  SurveyLogic,
  Variable,
} from "../../../_components/mock-data";

interface Props {
  mappings: CatalogMapping[];
  sections: CharacteristicSection[];
  questionSections: Section[];
  surveyLogic?: SurveyLogic;
  variables: Variable[];
  onMappingsChange: (mappings: CatalogMapping[]) => void;
  onSectionsChange: (sections: CharacteristicSection[]) => void;
  onVariablesChange: (variables: Variable[]) => void;
}

export function CalculationTab({
  mappings,
  questionSections,
  surveyLogic = {},
  variables,
  onMappingsChange,
  onVariablesChange,
}: Props) {
  const { t, locale } = useLocale();
  const [refOpen, setRefOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Read-only JSON snapshot of the calculation config (excludes derived
  // data-catalog/profession variables — they're produced by the mappings).
  const calcJson = useMemo(
    () => JSON.stringify(buildCalculationJson(mappings, variables), null, 2),
    [mappings, variables],
  );

  // ── Survey variable reference (copyable) ────────────────────────
  // Question names (q1, q2, … via effectiveQuestionName) plus survey-level
  // calculated values defined in the survey JSON.
  const questionVars: string[] = (() => {
    let gi = 0;
    return questionSections.flatMap((s) => s.questions.map((q) => effectiveQuestionName(q, gi++)));
  })();
  const calcValueVars: string[] = (surveyLogic.calculatedValues ?? [])
    .map((cv) => (cv as { name?: string }).name)
    .filter((n): n is string => !!n);

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

  // ── Variable handlers ───────────────────────────────────────────
  // Five displayed groups, each its own kind: custom, characteristic (auto
  // from mappings), single-choice, multiple-choice, and derived catalog vars.
  const customVars = variables.filter((v) => v.kind === "custom");
  const charVars = variables.filter((v) => v.kind === "characteristic");
  const scVars = variables.filter((v) => v.kind === "singlechoice");
  const mcVars = variables.filter((v) => v.kind === "multiplechoice");
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

  // Each question's effective SurveyJS variable name (q1, q2, … by global index),
  // so a bound choice variable can share its question's name and reference.
  const nameByQuestionId = (() => {
    const map = new Map<string, string>();
    let gi = 0;
    questionSections.forEach((s) => s.questions.forEach((q) => map.set(q.id, effectiveQuestionName(q, gi++))));
    return map;
  })();

  // The test's multiple-choice (checkbox) questions, available to add as MC vars.
  const mcQuestions = questionSections
    .flatMap((s) => s.questions)
    .filter((q) => q.type === "multiple");
  const addedQuestionIds = new Set(mcVars.map((v) => v.questionId));

  // Add a MC variable bound to a checkbox question; seed option translations
  // from the question's choices (value = numeric choice value, label = choice text).
  const addMcVar = (questionId: string) => {
    const q = mcQuestions.find((x) => x.id === questionId);
    if (!q) return;
    const qName = nameByQuestionId.get(questionId) ?? questionId;
    onVariablesChange([
      ...variables,
      {
        id: `mc_${Date.now()}`,
        name: qName,
        label: q.text,
        kind: "multiplechoice",
        formula: `{${qName}}`,
        scope: "both",
        questionId,
        valueTranslations: q.choices.map((c, i) => ({
          value: effectiveChoiceValue(c, i),
          label: c.text,
        })),
      },
    ]);
  };

  // The test's single-choice questions, available to add as single-choice vars.
  const scQuestions = questionSections
    .flatMap((s) => s.questions)
    .filter((q) => q.type === "single");
  const addedScQuestionIds = new Set(scVars.map((v) => v.questionId));

  const addScVar = (questionId: string) => {
    const q = scQuestions.find((x) => x.id === questionId);
    if (!q) return;
    const qName = nameByQuestionId.get(questionId) ?? questionId;
    onVariablesChange([
      ...variables,
      {
        id: `sc_${Date.now()}`,
        name: qName,
        label: q.text,
        kind: "singlechoice",
        formula: `{${qName}}`,
        scope: "both",
        questionId,
        valueTranslations: q.choices.map((c, i) => ({
          value: effectiveChoiceValue(c, i),
          label: c.text,
        })),
      },
    ]);
  };

  // Characteristic variables appear AUTOMATICALLY for every mapped group's keys
  // (no import step). Their formulas are author-editable and persist; we only
  // add missing ones and drop those whose source group is no longer mapped.
  useEffect(() => {
    const wanted = new Map<string, { key: string; label: typeof variables[number]["label"]; src: { catalogId: string; groupId: string } }>();
    for (const m of mappings) {
      const group = findGroup(m.catalogId, m.groupId);
      if (!group) continue;
      for (const k of group.keys) {
        // key per (group, characteristic) so two mappings on the same group share one var
        if (!wanted.has(k.key)) wanted.set(k.key, { key: k.key, label: k.label, src: { catalogId: m.catalogId, groupId: m.groupId } });
      }
    }

    // Characteristics are ENTIRELY driven by mappings — no standalone ones.
    // No mapping → no characteristics. Other kinds are left untouched.
    const managed = variables.filter((v) => v.kind === "characteristic");
    const untouched = variables.filter((v) => v.kind !== "characteristic");
    const haveByName = new Map(managed.map((v) => [v.name, v]));

    // Keep existing managed vars still wanted (preserve their formula);
    // add new ones for newly-mapped keys; drop ones no longer wanted.
    const nextChar: Variable[] = [];
    for (const [name, w] of wanted) {
      const existing = haveByName.get(name);
      if (existing) nextChar.push(existing);
      else
        nextChar.push({
          id: `char_${w.src.groupId}_${name}`,
          name,
          label: w.label,
          kind: "characteristic",
          formula: "",
          scope: "both",
          source: w.src,
        });
    }

    // Only push an update if the managed set actually changed.
    const sameSet =
      nextChar.length === managed.length &&
      nextChar.every((v, i) => managed[i] && managed[i].id === v.id);
    if (!sameSet) onVariablesChange([...untouched, ...nextChar]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings]);

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

  if (showJson) {
    return <CalculationJsonView json={calcJson} onClose={() => setShowJson(false)} />;
  }

  return (
    <div className="space-y-8">
      {/* Top toolbar: formula reference (left) + view JSON (right). */}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <FormulaReference open={refOpen} onToggle={() => setRefOpen(!refOpen)} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowJson(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Code2 className="h-3.5 w-3.5" />
          {t("cm.calculation.viewJson")}
        </Button>
      </div>

      {/* ── Variables (formula) ──────────────────────────────────── */}
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
          <div className="flex items-center gap-1">
            <SurveyVarsButton questionVars={questionVars} calcValueVars={calcValueVars} />
            <Button variant="ghost" size="sm" onClick={addCustomVar} className="text-primary hover:text-teal-700">
              <Plus className="h-3.5 w-3.5" />
              {t("cm.calculation.addVariable")}
            </Button>
          </div>
        </div>

        {customVars.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {customVars.map((v) => (
              <VariableCard
                key={v.id}
                variable={v}
                onChange={(partial) => updateVar(v.id, partial)}
                onDelete={() => deleteVar(v.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-6 text-center text-[0.78rem] text-muted-foreground">
            {t("cm.calculation.noVariables")}
          </div>
        )}
      </section>

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

      {/* ── Characteristics (auto from mappings) ─────────────────── */}
      {charVars.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-[0.88rem] font-semibold text-foreground">
              {t("cm.calculation.charHeading")}
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              {t("cm.calculation.charSub")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {charVars.map((v) => (
              <VariableCard
                key={v.id}
                variable={v}
                onChange={(partial) => updateVar(v.id, partial)}
                lockName={!!v.source}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Single Choice Variables ──────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[0.88rem] font-semibold text-foreground">
              {t("cm.calculation.scHeading")}
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              {t("cm.calculation.scSub")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="text-primary hover:text-teal-700" />}
              disabled={scQuestions.every((q) => addedScQuestionIds.has(q.id))}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("cm.calculation.addScVar")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {scQuestions.filter((q) => !addedScQuestionIds.has(q.id)).length === 0 ? (
                <DropdownMenuItem disabled>{t("cm.calculation.noScQuestions")}</DropdownMenuItem>
              ) : (
                scQuestions
                  .filter((q) => !addedScQuestionIds.has(q.id))
                  .map((q) => (
                    <DropdownMenuItem key={q.id} onClick={() => addScVar(q.id)}>
                      {scQuestions.indexOf(q) + 1}. {localize(q.text, locale) || q.name || q.id}
                    </DropdownMenuItem>
                  ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {scVars.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {scVars.map((v) => (
              <VariableCard
                key={v.id}
                variable={v}
                onChange={(partial) => updateVar(v.id, partial)}
                onDelete={() => deleteVar(v.id)}
                lockName
                readOnlyFormula
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-6 text-center text-[0.78rem] text-muted-foreground">
            {t("cm.calculation.noScVars")}
          </div>
        )}
      </section>

      {/* ── Multiple Choice Variables ────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[0.88rem] font-semibold text-foreground">
              {t("cm.calculation.mcHeading")}
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              {t("cm.calculation.mcSub")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="text-primary hover:text-teal-700" />}
              disabled={mcQuestions.every((q) => addedQuestionIds.has(q.id))}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("cm.calculation.addMcVar")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {mcQuestions.filter((q) => !addedQuestionIds.has(q.id)).length === 0 ? (
                <DropdownMenuItem disabled>{t("cm.calculation.noMcQuestions")}</DropdownMenuItem>
              ) : (
                mcQuestions
                  .filter((q) => !addedQuestionIds.has(q.id))
                  .map((q) => (
                    <DropdownMenuItem key={q.id} onClick={() => addMcVar(q.id)}>
                      {mcQuestions.indexOf(q) + 1}. {localize(q.text, locale) || q.name || q.id}
                    </DropdownMenuItem>
                  ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {mcVars.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {mcVars.map((v) => (
              <VariableCard
                key={v.id}
                variable={v}
                onChange={(partial) => updateVar(v.id, partial)}
                onDelete={() => deleteVar(v.id)}
                lockName
                readOnlyFormula
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-6 text-center text-[0.78rem] text-muted-foreground">
            {t("cm.calculation.noMcVars")}
          </div>
        )}
      </section>

      {/* ── Data Catalog Variables (derived, hidden by default) ──── */}
      {professionVars.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[0.88rem] font-semibold text-foreground">
                {t("cm.calculation.catalogVarsHeading")}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
                <Compass className="h-3.5 w-3.5" />
                {t("cm.calculation.professionNote")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCatalogOpen(!catalogOpen)}
              className="text-primary hover:text-teal-700"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", catalogOpen && "rotate-180")} />
              {catalogOpen
                ? t("cm.calculation.hide")
                : `${t("cm.calculation.showAll")} (${professionVars.length})`}
            </Button>
          </div>

          {catalogOpen && (
            <div className="grid gap-3 sm:grid-cols-2">
              {professionVars.map((v) => (
                <VariableCard key={v.id} variable={v} onChange={() => {}} readOnlyValue />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ── Calculation JSON view (read-only) ───────────────────────────
function CalculationJsonView({ json, onClose }: { json: string; onClose: () => void }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
        <span className="text-xs text-muted-foreground">{t("cm.calculation.jsonHeading")}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="mr-1 h-3.5 w-3.5" />
            {t("cm.calculation.closeJson")}
          </Button>
        </div>
      </div>
      <pre className="max-h-[70vh] overflow-auto bg-muted/20 p-4 font-mono text-[0.72rem] leading-relaxed text-foreground">
        {json}
      </pre>
    </div>
  );
}

// ── Survey variables reference (copyable) ───────────────────────
function SurveyVarsButton({
  questionVars,
  calcValueVars,
}: {
  questionVars: string[];
  calcValueVars: string[];
}) {
  const { t } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" />}>
        <Braces className="h-3.5 w-3.5" />
        {t("cm.calculation.surveyVars")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <p className="px-1 pb-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("cm.calculation.questionVars")}
        </p>
        {questionVars.length > 0 ? (
          <div className="flex flex-wrap gap-1 px-1">
            {questionVars.map((v) => (
              <CopyChip key={v} text={v} />
            ))}
          </div>
        ) : (
          <p className="px-1 text-[0.72rem] text-muted-foreground">{t("cm.calculation.noQuestionVars")}</p>
        )}
        <p className="px-1 pt-3 pb-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("cm.calculation.calcValueVars")}
        </p>
        {calcValueVars.length > 0 ? (
          <div className="flex flex-wrap gap-1 px-1">
            {calcValueVars.map((v) => (
              <CopyChip key={v} text={v} />
            ))}
          </div>
        ) : (
          <p className="px-1 text-[0.72rem] text-muted-foreground">{t("cm.calculation.noCalcValueVars")}</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`{${text}}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[0.7rem] transition-colors cursor-pointer",
        copied
          ? "bg-teal-100 text-teal-700"
          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
      )}
    >
      {text}
      {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5 opacity-40" />}
    </button>
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
