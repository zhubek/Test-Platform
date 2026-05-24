"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuestionPreview } from "../_components/preview/question-preview";
import type { Section, Question } from "../../../_components/mock-data";

function isAnswered(q: Question, v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Full-width respondent preview using the custom (profwise2-style) layout:
// vertical stepper sidebar + question cards + progress bar.
export function FullSurveyPreview({ sections }: { sections: Section[] }) {
  const { locale } = useLocale();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border bg-card py-20 text-center text-sm text-muted-foreground">
        This test has no questions yet.
      </div>
    );
  }

  const active = Math.min(idx, sections.length - 1);
  const section = sections[active];

  const answeredCounts = sections.map(
    (s) => s.questions.filter((q) => isAnswered(q, answers[q.id])).length,
  );
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);
  const totalAnswered = answeredCounts.reduce((a, b) => a + b, 0);
  const pct = totalQuestions ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress header */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Progress</span>
        <span className="text-sm font-bold">
          {totalAnswered}/{totalQuestions}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Vertical stepper sidebar */}
        <nav className="hidden w-[220px] shrink-0 md:block">
          <div className="sticky top-6 space-y-1">
            <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
              Sections
            </p>
            {sections.map((s, i) => {
              const total = s.questions.length;
              const answered = answeredCounts[i];
              const complete = total > 0 && answered === total;
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold",
                      isActive
                        ? "bg-background/20 text-background"
                        : complete
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[0.8rem] font-medium">
                      {localize(s.title, locale) || `Page ${i + 1}`}
                    </span>
                    <span
                      className={cn(
                        "text-[0.62rem]",
                        isActive ? "text-background/60" : "text-muted-foreground",
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
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              {localize(section.title, locale) || `Page ${active + 1}`}
            </h2>
            {localize(section.description, locale) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {localize(section.description, locale)}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {section.questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                No questions in this section.
              </div>
            ) : (
              section.questions.map((q) => (
                <div key={q.id} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <QuestionPreview
                    question={q}
                    value={answers[q.id] ?? null}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  />
                </div>
              ))
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t pt-5">
            <Button variant="outline" disabled={active === 0} onClick={() => setIdx(active - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {active + 1} / {sections.length}
            </span>
            <Button
              variant="outline"
              disabled={active === sections.length - 1}
              onClick={() => setIdx(active + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
