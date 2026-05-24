"use client";

import { useState } from "react";
import { ArrowLeft, X, Plus, HelpCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
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
import { hasChoiceList, defaultChoicesForType } from "../../../_components/mock-data";

interface Props {
  question: Question;
  globalIndex: number; // position across all questions in the test (for fallback name)
  pageTitle: string;
  onBack: () => void;
  onQuestionUpdate: (partial: Partial<Question>) => void;
  onChoiceAdd: () => void;
  onChoiceUpdate: (cIdx: number, partial: Partial<AnswerChoice>) => void;
  onChoiceDelete: (cIdx: number) => void;
}

const QUESTION_TYPES: { value: QuestionType; key: string }[] = [
  { value: "single", key: "cm.question.type.single" },
  { value: "multiple", key: "cm.question.type.multiple" },
  { value: "dropdown", key: "cm.question.type.dropdown" },
  { value: "likert", key: "cm.question.type.likert" },
  { value: "rating", key: "cm.question.type.rating" },
  { value: "boolean", key: "cm.question.type.boolean" },
  { value: "imagepicker", key: "cm.question.type.imagepicker" },
];

export function QuestionEditor({
  question,
  globalIndex,
  pageTitle,
  onBack,
  onQuestionUpdate,
  onChoiceAdd,
  onChoiceUpdate,
  onChoiceDelete,
}: Props) {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<"content" | "advanced">("content");
  // Choice-based types (incl. likert/rating) show an editable options list.
  const hasChoices = hasChoiceList(question.type);
  const isImagePicker = question.type === "imagepicker";
  const isRating = question.type === "rating";

  // Switching type: seed default choices for likert/rating when none exist
  // (they are single-choice over a fixed numeric scale).
  const handleTypeChange = (next: QuestionType) => {
    const patch: Partial<Question> = { type: next };
    if ((next === "likert" || next === "rating") && question.choices.length === 0) {
      patch.choices = defaultChoicesForType(next, question.rateMax ?? 5);
    }
    onQuestionUpdate(patch);
  };
  // What the question is actually referenced as (auto-numbered if blank).
  const effectiveName = question.name?.trim() || `q${globalIndex + 1}`;

  return (
    <div className="flex h-full flex-col">
      {/* Header: back + breadcrumb + type */}
      <div className="border-b px-3 py-2.5">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {pageTitle || "Questions"}
        </button>
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate text-sm font-semibold">
            {localize(question.text, locale) || (
              <span className="italic text-muted-foreground">Untitled question</span>
            )}
          </span>
          <Select
            value={question.type}
            onValueChange={(v) => handleTypeChange((v as QuestionType) ?? "single")}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((qt) => (
                <SelectItem key={qt.value} value={qt.value}>
                  {t(qt.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content | Advanced tabs */}
      <div className="flex items-center gap-1 border-b px-3 py-1.5">
        {(["content", "advanced"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setTab(m)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors",
              tab === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {tab === "content" ? (
          <>
            {/* Question text */}
            <LocalizedInput
              label="Question text"
              value={question.text}
              onChange={(v) => onQuestionUpdate({ text: v })}
              placeholder={t("cm.question.textPlaceholder")}
              className="w-full"
            />

            {/* Rating scale size — reseeds the choice list to match N. */}
            {isRating && (
              <div>
                <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Scale (1 to N)
                </label>
                <Input
                  type="number"
                  min={2}
                  max={10}
                  value={question.rateMax ?? 5}
                  onChange={(e) => {
                    const n = Math.max(2, Math.min(10, parseInt(e.target.value) || 5));
                    onQuestionUpdate({ rateMax: n, choices: defaultChoicesForType("rating", n) });
                  }}
                  className="w-20"
                />
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  Changing N regenerates the options below.
                </p>
              </div>
            )}

            {/* Choices — text (+ image url for imagepicker) */}
            {hasChoices ? (
              <div>
                <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isImagePicker ? "Options (image)" : "Choices"}
                </label>
                <div className="space-y-2">
                  {question.choices.map((choice, ci) => (
                    <div key={choice.id} className="group">
                      <div className="flex items-start gap-2">
                        <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-semibold text-muted-foreground">
                          {ci + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <LocalizedInput
                            value={choice.text}
                            onChange={(v) => onChoiceUpdate(ci, { text: v })}
                            placeholder={t("cm.question.answerPlaceholder")}
                            className="w-full"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onChoiceDelete(ci)}
                          className="mt-1 text-muted-foreground opacity-0 hover:text-red-500 group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {isImagePicker && (
                        <div className="mt-1.5 flex items-center gap-2 pl-7">
                          <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                            image url
                          </span>
                          <Input
                            value={choice.imageUrl ?? ""}
                            onChange={(e) =>
                              onChoiceUpdate(ci, { imageUrl: e.target.value || undefined })
                            }
                            placeholder="https://…"
                            className="h-7 flex-1 text-[0.72rem]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onChoiceAdd}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("cm.question.addChoice")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-[0.78rem] text-muted-foreground">
                {question.type === "boolean"
                  ? "Yes / No question — no options to configure."
                  : `Scale 1–${question.type === "likert" ? 5 : question.rateMax ?? 5}.`}
              </p>
            )}
          </>
        ) : (
          <AdvancedEditor
            question={question}
            effectiveName={effectiveName}
            hasChoices={hasChoices}
            t={t}
            onQuestionUpdate={onQuestionUpdate}
            onChoiceAdd={onChoiceAdd}
            onChoiceUpdate={onChoiceUpdate}
            onChoiceDelete={onChoiceDelete}
          />
        )}
      </div>
    </div>
  );
}

function AdvancedEditor({
  question,
  effectiveName,
  hasChoices,
  t,
  onQuestionUpdate,
  onChoiceAdd,
  onChoiceUpdate,
  onChoiceDelete,
}: {
  question: Question;
  effectiveName: string;
  hasChoices: boolean;
  t: (key: string) => string;
  onQuestionUpdate: (partial: Partial<Question>) => void;
  onChoiceAdd: () => void;
  onChoiceUpdate: (cIdx: number, partial: Partial<AnswerChoice>) => void;
  onChoiceDelete: (cIdx: number) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Question text (editable here too) */}
      <LocalizedInput
        label="Question text"
        value={question.text}
        onChange={(v) => onQuestionUpdate({ text: v })}
        placeholder={t("cm.question.textPlaceholder")}
        className="w-full"
      />

      {/* Question name */}
      <div>
        <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Name (for formulas / logic)
        </label>
        <div className="flex items-center gap-2">
          <Input
            value={question.name ?? ""}
            onChange={(e) => onQuestionUpdate({ name: e.target.value })}
            placeholder={effectiveName}
            className="w-48 font-mono"
          />
          <span className="text-[0.7rem] text-muted-foreground">
            reference as <code className="font-mono">{`{${effectiveName}}`}</code>
            {!question.name?.trim() && " (auto)"}
          </span>
        </div>
      </div>

      {/* Question visibility/enable/required */}
      <div>
        <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Question logic
        </label>
        <LogicEditor
          logic={question.logic}
          onChange={(next) => onQuestionUpdate({ logic: next })}
        />
      </div>

      {/* Options — editable text + value + visibleIf */}
      {hasChoices ? (
        <div>
          <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Options
          </label>
          <div className="space-y-2">
            {question.choices.map((choice, ci) => (
              <div key={choice.id} className="group rounded-lg border bg-background p-2.5">
                {/* text + delete */}
                <div className="flex items-start gap-2">
                  <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-semibold text-muted-foreground">
                    {ci + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <LocalizedInput
                      value={choice.text}
                      onChange={(v) => onChoiceUpdate(ci, { text: v })}
                      placeholder={t("cm.question.answerPlaceholder")}
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onChoiceDelete(ci)}
                    className="mt-1 text-muted-foreground opacity-0 hover:text-red-500 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* value + visibleIf */}
                <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5 pl-7">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    value
                  </span>
                  <Input
                    type="number"
                    value={choice.value ?? ""}
                    onChange={(e) =>
                      onChoiceUpdate(ci, {
                        value: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder={`${ci + 1}`}
                    className="h-7 w-40 font-mono text-[0.72rem]"
                  />
                  <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    visible if
                  </span>
                  <Input
                    value={choice.visibleIf ?? ""}
                    onChange={(e) =>
                      onChoiceUpdate(ci, { visibleIf: e.target.value || undefined })
                    }
                    placeholder="{q1} = 'yes'"
                    className="h-7 font-mono text-[0.72rem]"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={onChoiceAdd}
              className="text-muted-foreground hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> {t("cm.question.addChoice")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-[0.78rem] text-muted-foreground">
          No options for this type. Reference its value as{" "}
          <code className="font-mono">{`{${effectiveName}}`}</code>.
        </p>
      )}
    </div>
  );
}

function LogicEditor({
  logic,
  onChange,
}: {
  logic?: QuestionLogic;
  onChange: (next: QuestionLogic | undefined) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  const handleField = (field: keyof QuestionLogic, value: string) => {
    const next: QuestionLogic = { ...(logic ?? {}) };
    if (value.trim() === "") delete next[field];
    else next[field] = value;
    const hasAny = next.visibleIf || next.enableIf || next.requiredIf;
    onChange(hasAny ? next : undefined);
  };

  const FIELDS: { key: keyof QuestionLogic; label: string; ph: string }[] = [
    { key: "visibleIf", label: "Visible if", ph: "{q1} = 'yes'" },
    { key: "enableIf", label: "Enable if", ph: "{q1} notempty" },
    { key: "requiredIf", label: "Required if", ph: "{q1} = 'yes'" },
  ];

  return (
    <div className="space-y-3">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {f.label}
          </label>
          <Input
            value={logic?.[f.key] ?? ""}
            onChange={(e) => handleField(f.key, e.target.value)}
            placeholder={f.ph}
            className="w-full font-mono"
          />
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setHelpOpen(!helpOpen)}
        className="text-muted-foreground hover:text-primary"
      >
        <HelpCircle className="h-3 w-3" /> Syntax help
      </Button>
      {helpOpen && (
        <div className="space-y-1 rounded-md border bg-muted px-3 py-2 text-[0.7rem] text-muted-foreground">
          <div><code className="rounded bg-card px-1 font-mono">{"{q1} = 'yes'"}</code> — equals a choice value</div>
          <div><code className="rounded bg-card px-1 font-mono">{"{age} >= 18"}</code> — numeric comparison</div>
          <div><code className="rounded bg-card px-1 font-mono">{"{q1} = 'a' and {q2} > 5"}</code> — combine and/or</div>
          <div><code className="rounded bg-card px-1 font-mono">{"{colors} contains 'red'"}</code> — multi-choice includes</div>
          <div><code className="rounded bg-card px-1 font-mono">{"{q1} notempty"}</code> — answered</div>
        </div>
      )}
    </div>
  );
}
