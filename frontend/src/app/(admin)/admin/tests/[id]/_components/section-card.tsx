"use client";

import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
import { Button } from "@/components/ui/button";
import { QuestionBlock } from "./question-block";
import type { Section, Question, AnswerChoice, Variable } from "../../../_components/mock-data";

interface Props {
  section: Section;
  sectionIndex?: number;
  variables: Variable[];
  // New granular callbacks (used by API-connected questions tab)
  onSectionUpdate?: (partial: Partial<Section>) => void;
  onSectionDelete?: () => void;
  onQuestionAdd?: () => void;
  onQuestionUpdate?: (qIdx: number, partial: Partial<Question>) => void;
  onQuestionDelete?: (qIdx: number) => void;
  onChoiceAdd?: (qIdx: number) => void;
  onChoiceUpdate?: (qIdx: number, cIdx: number, partial: Partial<AnswerChoice>) => void;
  onChoiceDelete?: (qIdx: number, cIdx: number) => void;
  // Legacy callbacks (used by survey tab and other mock-data consumers)
  onChange?: (partial: Partial<Section>) => void;
  onDelete?: () => void;
}

export function SectionCard({
  section,
  sectionIndex,
  variables,
  onSectionUpdate,
  onSectionDelete,
  onQuestionAdd,
  onQuestionUpdate,
  onQuestionDelete,
  onChoiceAdd,
  onChoiceUpdate,
  onChoiceDelete,
  onChange,
  onDelete,
}: Props) {
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  // Use granular callbacks if available, otherwise fall back to legacy onChange
  const handleSectionPartial = onSectionUpdate ?? onChange ?? (() => {});
  const handleSectionDel = onSectionDelete ?? onDelete ?? (() => {});

  // Legacy question handlers (for when granular callbacks aren't provided)
  const handleQuestionUpdateLegacy = (qIdx: number, partial: Partial<Question>) => {
    if (onQuestionUpdate) {
      onQuestionUpdate(qIdx, partial);
    } else if (onChange) {
      const next = section.questions.map((q, i) =>
        i === qIdx ? { ...q, ...partial } : q
      );
      onChange({ questions: next });
    }
  };

  const handleQuestionDeleteLegacy = (qIdx: number) => {
    if (onQuestionDelete) {
      onQuestionDelete(qIdx);
    } else if (onChange) {
      onChange({ questions: section.questions.filter((_, i) => i !== qIdx) });
    }
  };

  const handleQuestionAddLegacy = () => {
    if (onQuestionAdd) {
      onQuestionAdd();
    } else if (onChange) {
      const newQ: Question = {
        id: `q${Date.now()}`,
        text: { en: "", ru: "", kz: "" },
        type: "single",
        choices: [],
      };
      onChange({ questions: [...section.questions, newQ] });
    }
  };

  const handleChoiceAddLegacy = (qIdx: number) => {
    if (onChoiceAdd) {
      onChoiceAdd(qIdx);
    } else if (onChange) {
      const newChoice: AnswerChoice = {
        id: `ch${Date.now()}`,
        text: { en: "", ru: "", kz: "" },
        variables: [],
      };
      const next = section.questions.map((q, i) =>
        i === qIdx ? { ...q, choices: [...q.choices, newChoice] } : q
      );
      onChange({ questions: next });
    }
  };

  const handleChoiceUpdateLegacy = (qIdx: number, cIdx: number, partial: Partial<AnswerChoice>) => {
    if (onChoiceUpdate) {
      onChoiceUpdate(qIdx, cIdx, partial);
    } else if (onChange) {
      const next = section.questions.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              choices: q.choices.map((c, j) =>
                j === cIdx ? { ...c, ...partial } : c
              ),
            }
          : q
      );
      onChange({ questions: next });
    }
  };

  const handleChoiceDeleteLegacy = (qIdx: number, cIdx: number) => {
    if (onChoiceDelete) {
      onChoiceDelete(qIdx, cIdx);
    } else if (onChange) {
      const next = section.questions.map((q, i) =>
        i === qIdx
          ? { ...q, choices: q.choices.filter((_, j) => j !== cIdx) }
          : q
      );
      onChange({ questions: next });
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
        <div className="flex-1 space-y-1">
          <LocalizedInput
            value={section.title}
            onChange={(v) => handleSectionPartial({ title: v })}
            placeholder={t("cm.section.titlePlaceholder")}
            className="w-full font-semibold"
          />
          <LocalizedInput
            value={section.description}
            onChange={(v) => handleSectionPartial({ description: v })}
            placeholder={t("cm.section.descriptionPlaceholder")}
            className="w-full"
          />
        </div>
        <span className="text-[0.68rem] font-medium text-muted-foreground mr-1">
          {section.questions.length} Q
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSectionDel}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Questions list */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {section.questions.map((q, qi) => (
            <QuestionBlock
              key={q.id}
              question={q}
              questionIndex={qi}
              variables={variables}
              onQuestionUpdate={(partial) => handleQuestionUpdateLegacy(qi, partial)}
              onQuestionDelete={() => handleQuestionDeleteLegacy(qi)}
              onChoiceAdd={() => handleChoiceAddLegacy(qi)}
              onChoiceUpdate={(cIdx, partial) => handleChoiceUpdateLegacy(qi, cIdx, partial)}
              onChoiceDelete={(cIdx) => handleChoiceDeleteLegacy(qi, cIdx)}
            />
          ))}

          <Button
            variant="outline"
            onClick={handleQuestionAddLegacy}
            className="w-full border-2 border-dashed py-2.5 h-auto text-muted-foreground hover:border-teal-300 hover:text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("cm.section.addQuestion")}
          </Button>
        </div>
      )}
    </div>
  );
}
