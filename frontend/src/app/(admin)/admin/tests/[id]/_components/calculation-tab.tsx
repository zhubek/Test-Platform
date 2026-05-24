"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronDown, BookOpen, X, Copy, Check } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  CharacteristicSection,
  CharacteristicMapping,
  Variable,
} from "../../../_components/mock-data";
import { characteristicGroups } from "../../../_components/mock-data";

interface Props {
  sections: CharacteristicSection[];
  variables: Variable[];
  onSectionsChange: (sections: CharacteristicSection[]) => void;
}

export function CalculationTab({ sections, variables, onSectionsChange }: Props) {
  const { t, locale } = useLocale();
  const [refOpen, setRefOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const usedGroupIds = new Set(sections.map((s) => s.groupId));

  const availableGroups = characteristicGroups.filter(
    (g) => !usedGroupIds.has(g.id)
  );

  const handleAddGroup = (groupId: string) => {
    const group = characteristicGroups.find((g) => g.id === groupId);
    if (!group) return;
    const newSection: CharacteristicSection = {
      groupId: group.id,
      mappings: group.characteristics.map((c) => ({
        characteristicId: c.id,
        formula: "",
      })),
    };
    onSectionsChange([...sections, newSection]);
    setAddOpen(false);
  };

  const handleDeleteSection = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
    setDeleteTarget(null);
  };

  const handleMappingUpdate = (
    sectionIdx: number,
    mappingIdx: number,
    formula: string
  ) => {
    onSectionsChange(
      sections.map((sec, si) =>
        si === sectionIdx
          ? {
              ...sec,
              mappings: sec.mappings.map((m, mi) =>
                mi === mappingIdx ? { ...m, formula } : m
              ),
            }
          : sec
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.88rem] font-semibold text-foreground">
            {t("cm.calculation.logicHeading")}
          </h3>
          <p className="text-[0.75rem] text-muted-foreground mt-0.5">
            {t("cm.calculation.logicSub")}
          </p>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddOpen(!addOpen)}
            disabled={availableGroups.length === 0}
            className="text-primary hover:text-teal-700"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("cm.calculation.addGroup")}
          </Button>
          {addOpen && availableGroups.length > 0 && (
            <div className="absolute z-10 top-full right-0 mt-1 w-64 bg-popover border rounded-lg shadow-lg py-1">
              {availableGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleAddGroup(g.id)}
                  className="w-full text-left px-3 py-2 text-[0.78rem] text-foreground hover:bg-muted transition-colors"
                >
                  <span className="font-medium">
                    {localize(g.name, locale)}
                  </span>
                  <span className="text-muted-foreground ml-1.5">
                    ({g.characteristics.length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available variables — click to copy */}
      {variables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[0.72rem] text-muted-foreground">
          <span>{t("cm.calculation.availableVars")}</span>
          {variables.map((v) => (
            <CopyChip key={v.id} text={v.name} />
          ))}
        </div>
      )}

      {/* Formula reference */}
      <FormulaReference open={refOpen} onToggle={() => setRefOpen(!refOpen)} />

      {/* Sections */}
      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section, si) => {
            const group = characteristicGroups.find(
              (g) => g.id === section.groupId
            );
            if (!group) return null;

            return (
              <div
                key={section.groupId}
                className="bg-card rounded-xl border shadow-sm overflow-hidden"
              >
                {/* Section header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/80 border-b">
                  <h4 className="text-[0.82rem] font-semibold text-foreground">
                    {localize(group.name, locale)}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(si)}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Mapping rows */}
                <div className="divide-y divide-border">
                  {section.mappings.map((mapping, mi) => {
                    const chr = group.characteristics.find(
                      (c) => c.id === mapping.characteristicId
                    );
                    return (
                      <div
                        key={mapping.characteristicId}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="shrink-0 w-40 text-[0.78rem] font-medium text-foreground truncate">
                          {chr
                            ? localize(chr.name, locale)
                            : mapping.characteristicId}
                        </span>
                        <span className="text-[0.75rem] text-muted-foreground">=</span>
                        <div className="flex-1 relative">
                          <Input
                            type="text"
                            value={mapping.formula}
                            onChange={(e) =>
                              handleMappingUpdate(si, mi, e.target.value)
                            }
                            placeholder={t("cm.calculation.formulaPlaceholder")}
                            className="w-full font-mono"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-[0.78rem] text-muted-foreground border border-dashed rounded-xl">
          {t("cm.calculation.noSections")}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget !== null && (
        <ConfirmDeleteModal
          groupName={
            localize(
              characteristicGroups.find(
                (g) => g.id === sections[deleteTarget]?.groupId
              )?.name ?? { en: "", ru: "", kz: "" },
              locale
            )
          }
          onConfirm={() => handleDeleteSection(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── Copy Chip ───────────────────────────────────────────────────

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[0.7rem] transition-colors cursor-pointer",
        copied
          ? "bg-teal-100 text-teal-700"
          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
      )}
    >
      {text}
      {copied ? (
        <Check className="w-2.5 h-2.5" />
      ) : (
        <Copy className="w-2.5 h-2.5 opacity-40" />
      )}
    </button>
  );
}

// ── Confirm Delete Modal ────────────────────────────────────────

function ConfirmDeleteModal({
  groupName,
  onConfirm,
  onCancel,
}: {
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />
      <div className="relative bg-card rounded-xl shadow-xl max-w-sm w-full mx-4 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[0.88rem] font-semibold text-foreground">
            {t("cm.calculation.deleteTitle")}
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[0.82rem] text-muted-foreground">
          {t("cm.calculation.deleteMessage")} <span className="font-semibold">{groupName}</span>?
          {" "}{t("cm.calculation.deleteWarning")}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {t("common.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Formula Reference ────────────────────────────────────────────

const refSections: { heading: string; rows: { syntax: string; desc: string; example: string }[] }[] = [
  {
    heading: "Arithmetic",
    rows: [
      { syntax: "+", desc: "Addition", example: "realistic + investigative" },
      { syntax: "-", desc: "Subtraction", example: "openness - neuroticism" },
      { syntax: "*", desc: "Multiplication", example: "social * 0.6" },
      { syntax: "/", desc: "Division", example: "(realistic + artistic) / 2" },
      { syntax: "%", desc: "Remainder", example: "score % 10" },
      { syntax: "^", desc: "Power", example: "x ^ 2" },
      { syntax: "( )", desc: "Grouping", example: "(a + b) * (c + d)" },
    ],
  },
  {
    heading: "Rounding",
    rows: [
      { syntax: "round(x)", desc: "Round to nearest integer", example: "round(realistic / 3)" },
      { syntax: "floor(x)", desc: "Round down", example: "floor(score / 10)" },
      { syntax: "ceil(x)", desc: "Round up", example: "ceil(total / 4)" },
    ],
  },
  {
    heading: "Math Functions",
    rows: [
      { syntax: "abs(x)", desc: "Absolute value", example: "abs(a - b)" },
      { syntax: "sqrt(x)", desc: "Square root", example: "sqrt(x ^ 2 + y ^ 2)" },
      { syntax: "min(a, b, …)", desc: "Smallest value", example: "min(realistic, social, artistic)" },
      { syntax: "max(a, b, …)", desc: "Largest value", example: "max(openness, extraversion)" },
      { syntax: "avg(a, b, …)", desc: "Average of values", example: "avg(a, b, c)" },
    ],
  },
  {
    heading: "Conditional",
    rows: [
      { syntax: "if(cond, then, else)", desc: "If condition is true, return then; otherwise else", example: "if(realistic > 50, 1, 0)" },
    ],
  },
];

function FormulaReference({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useLocale();

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[0.78rem] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        {t("cm.calculation.formulaRef")}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 ml-auto text-muted-foreground transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open && (
        <div className="border-t px-4 py-3 space-y-4 bg-muted/50">
          {refSections.map((section) => (
            <div key={section.heading}>
              <h4 className="text-[0.72rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.heading}
              </h4>
              <div className="space-y-1">
                {section.rows.map((row) => (
                  <div
                    key={row.syntax}
                    className="grid grid-cols-[7rem_1fr_1fr] gap-2 items-baseline text-[0.75rem]"
                  >
                    <code className="font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[0.7rem]">
                      {row.syntax}
                    </code>
                    <span className="text-muted-foreground">{row.desc}</span>
                    <code className="font-mono text-muted-foreground text-[0.68rem]">
                      {row.example}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t">
            <h4 className="text-[0.72rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("cm.calculation.refExamples")}
            </h4>
            <div className="space-y-1.5 text-[0.75rem]">
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground shrink-0">{t("cm.calculation.refDirectMap")}</span>
                <code className="font-mono text-foreground bg-card border px-2 py-0.5 rounded text-[0.7rem]">
                  realistic
                </code>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground shrink-0">{t("cm.calculation.refWeighted")}</span>
                <code className="font-mono text-foreground bg-card border px-2 py-0.5 rounded text-[0.7rem]">
                  realistic * 0.6 + artistic * 0.4
                </code>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground shrink-0">{t("cm.calculation.refAverage")}</span>
                <code className="font-mono text-foreground bg-card border px-2 py-0.5 rounded text-[0.7rem]">
                  avg(realistic, investigative, artistic)
                </code>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground shrink-0">{t("cm.calculation.refNormalized")}</span>
                <code className="font-mono text-foreground bg-card border px-2 py-0.5 rounded text-[0.7rem]">
                  round(realistic / max(realistic, investigative, artistic) * 100)
                </code>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground shrink-0">{t("cm.calculation.refThreshold")}</span>
                <code className="font-mono text-foreground bg-card border px-2 py-0.5 rounded text-[0.7rem]">
                  if(social &gt; 20, social * 1.5, social)
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
