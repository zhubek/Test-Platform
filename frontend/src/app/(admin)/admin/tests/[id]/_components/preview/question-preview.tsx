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
  // Engine-derived state (optional; undefined = no constraint).
  disabled?: boolean;
  required?: boolean;
  visibleChoiceIds?: Set<string>; // when set, only these choice ids render
}

// Choices the engine says are currently visible (or all, if no constraint).
function shownChoices(question: Question, visibleChoiceIds?: Set<string>) {
  if (!visibleChoiceIds) return question.choices;
  return question.choices.filter((c) => visibleChoiceIds.has(c.id));
}

function SingleChoicePreview({ question, value, onChange, disabled, visibleChoiceIds }: PreviewProps) {
  const { locale } = useLocale();
  return (
    <fieldset className={cn("space-y-2", disabled && "pointer-events-none opacity-50")}>
      {shownChoices(question, visibleChoiceIds).map((opt) => {
        const active = value === opt.id;
        return (
          <label
            key={opt.id}
            onClick={() => !disabled && onChange(opt.id)}
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

function MultiChoicePreview({ question, value, onChange, disabled, visibleChoiceIds }: PreviewProps) {
  const { locale } = useLocale();
  const arr = Array.isArray(value) ? value : [];
  const toggle = (id: string) =>
    onChange(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  return (
    <fieldset className={cn("space-y-2", disabled && "pointer-events-none opacity-50")}>
      {shownChoices(question, visibleChoiceIds).map((opt) => {
        const active = arr.includes(opt.id);
        return (
          <label
            key={opt.id}
            onClick={() => !disabled && toggle(opt.id)}
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

// Likert is single-choice over a fixed scale; render its editable choices as a
// graduated row (label under each point), selecting by choice id like single.
function LikertPreview({ question, value, onChange, disabled, visibleChoiceIds }: PreviewProps) {
  const { locale } = useLocale();
  return (
    <div className={cn("flex items-end justify-center gap-1.5 pt-2 sm:gap-2.5", disabled && "pointer-events-none opacity-50")}>
      {shownChoices(question, visibleChoiceIds).map((opt, i) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex min-w-[52px] flex-col items-center gap-1.5 rounded-xl border-2 px-2.5 py-3.5 transition-all sm:px-4",
              active
                ? "border-foreground bg-foreground text-background shadow-md"
                : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted",
            )}
          >
            <span className="text-base font-bold">{i + 1}</span>
            <span className="whitespace-pre-line text-center text-[0.6rem] leading-tight">
              {localize(opt.text, locale) || "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DropdownPreview({ question, value, onChange, disabled, visibleChoiceIds }: PreviewProps) {
  const { locale } = useLocale();
  return (
    <select
      value={(value as string) ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <option value="" disabled>
        Select…
      </option>
      {shownChoices(question, visibleChoiceIds).map((opt) => (
        <option key={opt.id} value={opt.id}>
          {localize(opt.text, locale) || "—"}
        </option>
      ))}
    </select>
  );
}

// Rating is single-choice over a numeric scale; render its editable choices as
// square buttons, selecting by choice id like single.
function RatingPreview({ question, value, onChange, disabled, visibleChoiceIds }: PreviewProps) {
  const { locale } = useLocale();
  return (
    <div className={cn("flex flex-wrap gap-1.5 pt-1", disabled && "pointer-events-none opacity-50")}>
      {shownChoices(question, visibleChoiceIds).map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex h-10 min-w-10 items-center justify-center rounded-lg border-2 px-2 text-sm font-semibold transition-all",
              active
                ? "border-foreground bg-foreground text-background shadow-md"
                : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted",
            )}
          >
            {localize(opt.text, locale) || "—"}
          </button>
        );
      })}
    </div>
  );
}

function BooleanPreview({ value, onChange, disabled }: PreviewProps) {
  return (
    <div className={cn("flex gap-2 pt-1", disabled && "pointer-events-none opacity-50")}>
      {[
        { v: "true", label: "Yes" },
        { v: "false", label: "No" },
      ].map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.v)}
            className={cn(
              "rounded-lg border px-6 py-2 text-sm font-medium transition-all",
              active
                ? "border-foreground bg-muted shadow-sm"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/50",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ImagePickerPreview({ question, value, onChange, disabled, visibleChoiceIds }: PreviewProps) {
  const { locale } = useLocale();
  return (
    <div className={cn("grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3", disabled && "pointer-events-none opacity-50")}>
      {shownChoices(question, visibleChoiceIds).map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all",
              active ? "border-foreground bg-muted shadow-sm" : "border-border hover:bg-muted/50",
            )}
          >
            {opt.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={opt.imageUrl}
                alt={localize(opt.text, locale)}
                className="h-20 w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex h-20 w-full items-center justify-center rounded-md bg-muted text-[0.65rem] text-muted-foreground">
                no image
              </div>
            )}
            <span className="text-[0.72rem] text-foreground">
              {localize(opt.text, locale) || "—"}
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
  dropdown: DropdownPreview,
  rating: RatingPreview,
  boolean: BooleanPreview,
  imagepicker: ImagePickerPreview,
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
        {props.required && <span className="ml-1 text-destructive">*</span>}
      </h4>
      <Renderer {...props} />
    </div>
  );
}
