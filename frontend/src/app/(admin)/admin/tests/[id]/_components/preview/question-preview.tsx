"use client";

import { Check } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import type { Question } from "../../../../_components/mock-data";

// Live, interactive preview of a single question. Styled after profwise2.
// Value/onChange are local to the preview (not persisted).

interface PreviewProps {
  question: Question;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number) => void;
}

function SingleChoicePreview({ question, value, onChange }: PreviewProps) {
  const { locale } = useLocale();
  return (
    <fieldset className="space-y-2">
      {question.choices.map((opt) => {
        const active = value === opt.id;
        return (
          <label
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all",
              active
                ? "border-foreground bg-muted shadow-sm"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                active ? "border-foreground" : "border-muted-foreground/40",
              )}
            >
              {active && <span className="h-2 w-2 rounded-full bg-foreground" />}
            </span>
            <span className="text-[0.84rem] text-foreground">
              {localize(opt.text, locale) || "—"}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function MultiChoicePreview({ question, value, onChange }: PreviewProps) {
  const { locale } = useLocale();
  const arr = Array.isArray(value) ? value : [];
  const toggle = (id: string) =>
    onChange(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  return (
    <fieldset className="space-y-2">
      {question.choices.map((opt) => {
        const active = arr.includes(opt.id);
        return (
          <label
            key={opt.id}
            onClick={() => toggle(opt.id)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all",
              active
                ? "border-foreground bg-muted shadow-sm"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all",
                active ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40",
              )}
            >
              {active && <Check className="h-3 w-3" />}
            </span>
            <span className="text-[0.84rem] text-foreground">
              {localize(opt.text, locale) || "—"}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

const LIKERT_SIZE: Record<number, string> = {
  1: "min-w-[56px] py-4 px-3 sm:px-5",
  2: "min-w-[52px] py-3.5 px-2.5 sm:px-4",
  3: "min-w-[48px] py-3 px-2 sm:px-3.5",
  4: "min-w-[52px] py-3.5 px-2.5 sm:px-4",
  5: "min-w-[56px] py-4 px-3 sm:px-5",
};
const LIKERT_LABELS = ["Strongly\nDisagree", "Disagree", "Neutral", "Agree", "Strongly\nAgree"];

function LikertPreview({ value, onChange }: PreviewProps) {
  return (
    <div className="flex items-end justify-center gap-1.5 pt-2 sm:gap-2.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 transition-all",
              LIKERT_SIZE[n],
              active
                ? "border-foreground bg-foreground text-background shadow-md"
                : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted",
            )}
          >
            <span className="text-base font-bold">{n}</span>
            <span className="whitespace-pre-line text-center text-[0.6rem] leading-tight">
              {LIKERT_LABELS[n - 1]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const REGISTRY: Record<Question["type"], (p: PreviewProps) => React.ReactNode> = {
  single: SingleChoicePreview,
  multiple: MultiChoicePreview,
  likert: LikertPreview,
};

export function QuestionPreview(props: PreviewProps) {
  const { locale } = useLocale();
  const Renderer = REGISTRY[props.question.type] ?? SingleChoicePreview;
  return (
    <div className="space-y-3">
      <h4 className="text-[0.92rem] font-semibold text-foreground">
        {localize(props.question.text, locale) || (
          <span className="italic text-muted-foreground">Untitled question</span>
        )}
      </h4>
      <Renderer {...props} />
    </div>
  );
}
