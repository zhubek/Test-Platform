"use client";

import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
import type { Localized } from "@/lib/localized";
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 text-gray-400 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <div className="flex-1 space-y-1">
          <LocalizedInput
            value={section.title}
            onChange={(v) => handleSectionPartial({ title: v })}
            placeholder={t("cm.section.titlePlaceholder")}
            className="w-full text-[0.85rem] font-semibold text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
          />
          <LocalizedInput
            value={section.description}
            onChange={(v) => handleSectionPartial({ description: v })}
            placeholder={t("cm.section.descriptionPlaceholder")}
            className="w-full text-[0.75rem] text-gray-500 placeholder:text-gray-300 bg-transparent outline-none"
          />
        </div>
        <span className="text-[0.68rem] font-medium text-gray-400 mr-1">
          {section.questions.length} Q
        </span>
        <button
          onClick={handleSectionDel}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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

          <button
            onClick={handleQuestionAddLegacy}
            className="flex items-center gap-1.5 w-full justify-center rounded-lg border-2 border-dashed border-gray-200 py-2.5 text-[0.78rem] font-medium text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("cm.section.addQuestion")}
          </button>
        </div>
      )}
    </div>
  );
}
