"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuestionPreview } from "./question-preview";
import type { Section, Question } from "../../../../_components/mock-data";

interface Props {
  sections: Section[];
  activeSectionIndex: number;
  onActiveSectionChange: (i: number) => void;
}

function isAnswered(q: Question, v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function SurveyPreview({ sections, activeSectionIndex, onActiveSectionChange }: Props) {
  const { locale } = useLocale();
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

  if (sections.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No sections yet. Add one on the left to see a preview.
      </div>
    );
  }

  const idx = Math.min(activeSectionIndex, sections.length - 1);
  const section = sections[idx];

  // Answered counts per section + total (for the progress bar / stepper).
  const answeredCounts = sections.map(
    (s) => s.questions.filter((q) => isAnswered(q, answers[q.id])).length,
  );
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);
  const totalAnswered = answeredCounts.reduce((a, b) => a + b, 0);
  const pct = totalQuestions ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  return (
    <div>
      {/* Progress header */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">Progress</span>
        <span className="text-xs font-bold">
          {totalAnswered}/{totalQuestions}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-5">
        {/* Vertical stepper (profwise2-style) */}
        <nav className="w-[150px] shrink-0">
          <div className="sticky top-2 space-y-1">
            {sections.map((s, i) => {
              const total = s.questions.length;
              const answered = answeredCounts[i];
              const complete = total > 0 && answered === total;
              const active = i === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => onActiveSectionChange(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all",
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold",
                      active
                        ? "bg-background/20 text-background"
                        : complete
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[0.74rem] font-medium">
                      {localize(s.title, locale) || `Page ${i + 1}`}
                    </span>
                    <span
                      className={cn(
                        "text-[0.6rem]",
                        active ? "text-background/60" : "text-muted-foreground",
                      )}
                    >
                      {answered}/{total} answered
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Questions column */}
        <div className="min-w-0 flex-1">
          {/* Section header */}
          <div className="mb-5">
            <h3 className="text-lg font-bold tracking-tight">
              {localize(section.title, locale) || `Page ${idx + 1}`}
            </h3>
            {localize(section.description, locale) && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {localize(section.description, locale)}
              </p>
            )}
          </div>

          {/* Questions as cards */}
          <div className="space-y-4">
            {section.questions.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                No questions in this section.
              </div>
            ) : (
              section.questions.map((q) => (
                <div key={q.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <QuestionPreview
                    question={q}
                    value={answers[q.id] ?? null}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  />
                </div>
              ))
            )}
          </div>

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={idx === 0}
              onClick={() => onActiveSectionChange(idx - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {idx + 1} / {sections.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={idx === sections.length - 1}
              onClick={() => onActiveSectionChange(idx + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
