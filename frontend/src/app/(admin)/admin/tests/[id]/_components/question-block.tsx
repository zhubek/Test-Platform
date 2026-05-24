"use client";

import { Trash2, X, ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
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
import type {
  Question,
  QuestionType,
  AnswerChoice,
  QuestionLogic,
} from "../../../_components/mock-data";

interface Props {
  question: Question;
  questionIndex?: number;
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
        value: `opt${question.choices.length + 1}`,
        text: { en: "", ru: "", kz: "" },
        variables: [],
      };
      onChange({ choices: [...question.choices, newChoice] });
    }
  };

  const isLikert = question.type === "likert";

  return (
    <div className="border rounded-lg bg-muted/50">
      {/* Question header: text + type + name key */}
      <div className="space-y-2 px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <LocalizedInput
            value={question.text}
            onChange={(v) => handleQUpdate({ text: v })}
            placeholder={t("cm.question.textPlaceholder")}
            className="flex-1 font-medium"
          />
          <Select
            value={question.type}
            onValueChange={(v) => handleQUpdate({ type: (v ?? "single") as QuestionType })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((qt) => (
                <SelectItem key={qt.value} value={qt.value}>
                  {qt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleQDelete}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        {/* Name key — referenced in formulas/logic */}
        <div className="flex items-center gap-1.5">
          <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
            name
          </span>
          <Input
            type="text"
            value={question.name ?? ""}
            onChange={(e) => handleQUpdate({ name: e.target.value })}
            placeholder="q1"
            className="h-6 w-40 font-mono text-[0.72rem]"
          />
          <span className="text-[0.62rem] text-muted-foreground">
            reference as <code className="font-mono">{`{${question.name || "name"}}`}</code>
          </span>
        </div>
      </div>

      {/* Choices */}
      {!isLikert && (
        <div className="px-3 py-2.5 space-y-2">
          {question.choices.map((choice, ci) => (
            <div key={choice.id} className="flex items-center gap-2 group">
              <span className="w-3.5 h-3.5 shrink-0 rounded-full border-2 border-border" />
              <LocalizedInput
                value={choice.text}
                onChange={(v) => handleChoiceUpdateInternal(ci, { text: v })}
                placeholder={t("cm.question.answerPlaceholder")}
                className="flex-1"
              />
              {/* value key */}
              <Input
                type="text"
                value={choice.value ?? ""}
                onChange={(e) => handleChoiceUpdateInternal(ci, { value: e.target.value })}
                placeholder="value"
                className="h-7 w-24 font-mono text-[0.72rem]"
                title="Value key (referenced in formulas/logic)"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleChoiceDeleteInternal(ci)}
                className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleChoiceAddInternal}
            className="text-muted-foreground hover:text-primary ml-5.5"
          >
            {t("cm.question.addChoice")}
          </Button>
        </div>
      )}

      {isLikert && (
        <div className="px-3 py-2.5 text-[0.72rem] text-muted-foreground">
          Likert scale (1–5). Reference its value as{" "}
          <code className="font-mono">{`{${question.name || "name"}}`}</code>.
        </div>
      )}

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
    <div className="border-t">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[0.72rem] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <ChevronDown
          className={cn("w-3 h-3 transition-transform", open ? "" : "-rotate-90")}
        />
        <span>Logic</span>
        {hasRule && (
          <span className="text-[0.6rem] font-semibold uppercase bg-primary/10 text-primary rounded px-1.5 py-0.5">
            active
          </span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-medium text-foreground shrink-0 w-20">
              Visible if
            </span>
            <Input
              type="text"
              value={logic?.visibleIf ?? ""}
              onChange={(e) => handleField("visibleIf", e.target.value)}
              placeholder="{q1} = 'yes'"
              className="flex-1 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-medium text-foreground shrink-0 w-20">
              Enable if
            </span>
            <Input
              type="text"
              value={logic?.enableIf ?? ""}
              onChange={(e) => handleField("enableIf", e.target.value)}
              placeholder="{q1} notempty"
              className="flex-1 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-medium text-foreground shrink-0 w-20">
              Required if
            </span>
            <Input
              type="text"
              value={logic?.requiredIf ?? ""}
              onChange={(e) => handleField("requiredIf", e.target.value)}
              placeholder="{q1} = 'yes'"
              className="flex-1 font-mono"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpOpen(!helpOpen)}
            className="text-muted-foreground hover:text-primary"
          >
            <HelpCircle className="w-3 h-3" />
            Syntax help
          </Button>
          {helpOpen && (
            <div className="bg-muted border rounded-md px-3 py-2 space-y-1 text-[0.7rem] text-muted-foreground">
              <div className="font-semibold text-foreground">Examples</div>
              <div><code className="font-mono bg-card px-1 rounded">{"{q1} = 'yes'"}</code> — equals a choice value</div>
              <div><code className="font-mono bg-card px-1 rounded">{"{age} >= 18"}</code> — numeric comparison</div>
              <div><code className="font-mono bg-card px-1 rounded">{"{q1} = 'a' and {q2} > 5"}</code> — combine with and/or</div>
              <div><code className="font-mono bg-card px-1 rounded">{"{colors} contains 'red'"}</code> — multi-choice includes value</div>
              <div><code className="font-mono bg-card px-1 rounded">{"{q1} empty"}</code> / <code className="font-mono bg-card px-1 rounded">{"{q1} notempty"}</code> — answered or not</div>
              <a
                href="https://surveyjs.io/form-library/documentation/design-survey/conditional-logic"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-1 text-primary hover:text-teal-700 underline"
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
