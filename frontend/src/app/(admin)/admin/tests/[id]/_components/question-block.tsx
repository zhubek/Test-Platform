"use client";

import { Trash2, Plus, X, ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
import type { Localized } from "@/lib/localized";
import type {
  Question,
  QuestionType,
  AnswerChoice,
  VariableAssignment,
  Variable,
  QuestionLogic,
} from "../../../_components/mock-data";

interface Props {
  question: Question;
  questionIndex?: number;
  variables: Variable[];
  // New granular callbacks
  onQuestionUpdate?: (partial: Partial<Question>) => void;
  onQuestionDelete?: () => void;
  onChoiceAdd?: () => void;
  onChoiceUpdate?: (cIdx: number, partial: Partial<AnswerChoice>) => void;
  onChoiceDelete?: (cIdx: number) => void;
  // Legacy callbacks
  onChange?: (partial: Partial<Question>) => void;
  onDelete?: () => void;
}

export function QuestionBlock({
  question,
  questionIndex,
  variables,
  onQuestionUpdate,
  onQuestionDelete,
  onChoiceAdd,
  onChoiceUpdate,
  onChoiceDelete,
  onChange,
  onDelete,
}: Props) {
  const { t } = useLocale();

  const handleQUpdate = onQuestionUpdate ?? onChange ?? (() => {});
  const handleQDelete = onQuestionDelete ?? onDelete ?? (() => {});

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: "single", label: t("cm.question.type.single") },
    { value: "multiple", label: t("cm.question.type.multiple") },
    { value: "likert", label: t("cm.question.type.likert") },
  ];

  const handleChoiceUpdateInternal = (choiceIdx: number, partial: Partial<AnswerChoice>) => {
    if (onChoiceUpdate) {
      onChoiceUpdate(choiceIdx, partial);
    } else if (onChange) {
      const next = question.choices.map((c, i) =>
        i === choiceIdx ? { ...c, ...partial } : c
      );
      onChange({ choices: next });
    }
  };

  const handleChoiceDeleteInternal = (choiceIdx: number) => {
    if (onChoiceDelete) {
      onChoiceDelete(choiceIdx);
    } else if (onChange) {
      onChange({ choices: question.choices.filter((_, i) => i !== choiceIdx) });
    }
  };

  const handleChoiceAddInternal = () => {
    if (onChoiceAdd) {
      onChoiceAdd();
    } else if (onChange) {
      const newChoice: AnswerChoice = {
        id: `ch${Date.now()}`,
        text: { en: "", ru: "", kz: "" },
        variables: [],
      };
      onChange({ choices: [...question.choices, newChoice] });
    }
  };

  const handleVarAdd = (choiceIdx: number, variableId: string) => {
    const choice = question.choices[choiceIdx]!;
    if (choice.variables.some((v) => v.variableId === variableId)) return;
    const newAssignment: VariableAssignment = { variableId, value: 1 };
    handleChoiceUpdateInternal(choiceIdx, {
      variables: [...choice.variables, newAssignment],
    });
  };

  const handleVarUpdate = (
    choiceIdx: number,
    varIdx: number,
    value: number
  ) => {
    const choice = question.choices[choiceIdx]!;
    const next = choice.variables.map((v, i) =>
      i === varIdx ? { ...v, value } : v
    );
    handleChoiceUpdateInternal(choiceIdx, { variables: next });
  };

  const handleVarRemove = (choiceIdx: number, varIdx: number) => {
    const choice = question.choices[choiceIdx]!;
    handleChoiceUpdateInternal(choiceIdx, {
      variables: choice.variables.filter((_, i) => i !== varIdx),
    });
  };

  const getVarName = (id: string) =>
    variables.find((v) => v.id === id)?.name ?? id;

  return (
    <div className="border border-gray-100 rounded-lg bg-gray-50/50">
      {/* Question header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <LocalizedInput
          value={question.text}
          onChange={(v) => handleQUpdate({ text: v })}
          placeholder={t("cm.question.textPlaceholder")}
          className="flex-1 text-[0.82rem] font-medium text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
        />
        <select
          value={question.type}
          onChange={(e) => handleQUpdate({ type: e.target.value as QuestionType })}
          className="text-[0.75rem] font-medium text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-teal-400"
        >
          {questionTypes.map((qt) => (
            <option key={qt.value} value={qt.value}>
              {qt.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleQDelete}
          className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Choices */}
      <div className="px-3 py-2.5 space-y-2">
        {question.choices.map((choice, ci) => (
          <div
            key={choice.id}
            className="flex items-start gap-2 group"
          >
            {/* Radio / checkbox indicator */}
            <span className="mt-1.5 w-3.5 h-3.5 shrink-0 rounded-full border-2 border-gray-300" />

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <LocalizedInput
                  value={choice.text}
                  onChange={(v) =>
                    handleChoiceUpdateInternal(ci, { text: v })
                  }
                  placeholder={t("cm.question.answerPlaceholder")}
                  className="flex-1 text-[0.78rem] text-gray-700 placeholder:text-gray-400 bg-transparent outline-none"
                />
                <button
                  onClick={() => handleChoiceDeleteInternal(ci)}
                  className="p-0.5 rounded text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Variable badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {choice.variables.map((va, vi) => (
                  <span
                    key={va.variableId}
                    className="inline-flex items-center gap-1 text-[0.68rem] font-medium bg-teal-50 text-teal-700 rounded-md pl-1.5 pr-0.5 py-0.5"
                  >
                    {getVarName(va.variableId)}
                    <input
                      type="number"
                      value={va.value}
                      onChange={(e) =>
                        handleVarUpdate(ci, vi, Number(e.target.value))
                      }
                      className="w-8 text-center text-[0.68rem] bg-white/60 rounded border border-teal-200 outline-none"
                    />
                    <button
                      onClick={() => handleVarRemove(ci, vi)}
                      className="p-0.5 rounded hover:bg-teal-100"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {variables.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleVarAdd(ci, e.target.value);
                    }}
                    className="text-[0.68rem] text-gray-400 bg-transparent border border-dashed border-gray-200 rounded-md px-1.5 py-0.5 outline-none hover:border-teal-300 hover:text-teal-600"
                  >
                    <option value="">{t("cm.question.addVar")}</option>
                    {variables.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleChoiceAddInternal}
          className="text-[0.75rem] font-medium text-gray-400 hover:text-teal-600 transition-colors pl-5.5"
        >
          {t("cm.question.addChoice")}
        </button>
      </div>

      {/* Logic panel */}
      <LogicPanel
        logic={question.logic}
        onChange={(next) => handleQUpdate({ logic: next })}
      />
    </div>
  );
}

function LogicPanel({
  logic,
  onChange,
}: {
  logic?: QuestionLogic;
  onChange: (next: QuestionLogic | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const hasRule = !!(logic?.visibleIf || logic?.enableIf || logic?.requiredIf);

  const handleField = (field: keyof QuestionLogic, value: string) => {
    const next: QuestionLogic = { ...(logic ?? {}) };
    if (value.trim() === "") {
      delete next[field];
    } else {
      next[field] = value;
    }
    const hasAny = next.visibleIf || next.enableIf || next.requiredIf;
    onChange(hasAny ? next : undefined);
  };

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[0.72rem] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ChevronDown
          className={"w-3 h-3 transition-transform " + (open ? "" : "-rotate-90")}
        />
        <span>Logic</span>
        {hasRule && (
          <span className="text-[0.6rem] font-semibold uppercase bg-teal-50 text-teal-700 rounded px-1.5 py-0.5">
            active
          </span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-medium text-gray-600 shrink-0 w-20">
              Visible if
            </span>
            <input
              type="text"
              value={logic?.visibleIf ?? ""}
              onChange={(e) => handleField("visibleIf", e.target.value)}
              placeholder="{q1} = 'yes'"
              className="flex-1 text-[0.72rem] font-mono text-gray-900 placeholder:text-gray-300 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-teal-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-medium text-gray-600 shrink-0 w-20">
              Enable if
            </span>
            <input
              type="text"
              value={logic?.enableIf ?? ""}
              onChange={(e) => handleField("enableIf", e.target.value)}
              placeholder="{q1} notempty"
              className="flex-1 text-[0.72rem] font-mono text-gray-900 placeholder:text-gray-300 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-teal-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-medium text-gray-600 shrink-0 w-20">
              Required if
            </span>
            <input
              type="text"
              value={logic?.requiredIf ?? ""}
              onChange={(e) => handleField("requiredIf", e.target.value)}
              placeholder="{q1} = 'yes'"
              className="flex-1 text-[0.72rem] font-mono text-gray-900 placeholder:text-gray-300 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-teal-400"
            />
          </div>

          <button
            onClick={() => setHelpOpen(!helpOpen)}
            className="inline-flex items-center gap-1 text-[0.7rem] text-gray-500 hover:text-teal-600 transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
            Syntax help
          </button>
          {helpOpen && (
            <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 space-y-1 text-[0.7rem] text-gray-600">
              <div className="font-semibold text-gray-700">Examples</div>
              <div><code className="font-mono bg-white px-1 rounded">{"{q1} = 'yes'"}</code> — equals a choice value</div>
              <div><code className="font-mono bg-white px-1 rounded">{"{age} >= 18"}</code> — numeric comparison</div>
              <div><code className="font-mono bg-white px-1 rounded">{"{q1} = 'a' and {q2} > 5"}</code> — combine with and/or</div>
              <div><code className="font-mono bg-white px-1 rounded">{"{colors} contains 'red'"}</code> — multi-choice includes value</div>
              <div><code className="font-mono bg-white px-1 rounded">{"{q1} empty"}</code> / <code className="font-mono bg-white px-1 rounded">{"{q1} notempty"}</code> — answered or not</div>
              <a
                href="https://surveyjs.io/form-library/documentation/design-survey/conditional-logic"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-1 text-teal-600 hover:text-teal-700 underline"
              >
                Full reference →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
