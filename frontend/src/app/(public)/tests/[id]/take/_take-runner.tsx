"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { FlatLight } from "survey-core/themes";
import "survey-core/survey-core.css";
import { submitTestResult, type TestRow } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";

const localeMap: Record<Locale, string> = { en: "en", ru: "ru", kz: "kk" };

function toSurveyText(v: { en: string; ru: string; kz: string }) {
  return { default: v.en, ru: v.ru || undefined, kk: v.kz || undefined };
}

function buildModel(test: TestRow) {
  const pages = (test.sections ?? []).map((s) => ({
    name: `s${s.id}`,
    title: toSurveyText(s.title),
    elements: s.questions.map((q) => ({
      type: q.type === "multiple" ? "checkbox" : "radiogroup",
      name: String(q.id),
      title: toSurveyText(q.text),
      isRequired: true,
      choices: q.answers.map((a) => ({
        value: String(a.id),
        text: toSurveyText(a.text),
      })),
    })),
  }));
  return {
    showProgressBar: "off" as const,
    showNavigationButtons: true,
    pages,
  };
}

export function TakeRunner({ test, locale }: { test: TestRow; locale: Locale }) {
  const router = useRouter();
  const [tick, setTick] = useState(0);

  const survey = useMemo(() => {
    const model = new Model(buildModel(test));
    model.locale = localeMap[locale];
    model.applyTheme(FlatLight);
    model.onComplete.add(async (sender) => {
      const answers = sender.data as Record<string, number | string | string[]>;
      try {
        const result = await submitTestResult(test.id, answers);
        router.push(`/tests/${test.id}/result/${result.id}`);
      } catch (e) {
        console.error("Failed to submit result:", e);
      }
    });
    // Re-render the sidebar whenever the page or a value changes.
    model.onCurrentPageChanged.add(() => setTick((t) => t + 1));
    model.onValueChanged.add(() => setTick((t) => t + 1));
    return model;
  }, [test, locale, router]);

  survey.locale = localeMap[locale];

  const sections = test.sections ?? [];
  const activeIndex = survey.currentPageNo;

  // answered count per page
  const answeredCounts = sections.map((s) =>
    s.questions.filter((q) => {
      const v = survey.getValue(String(q.id));
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    }).length,
  );
  const totalAnswered = answeredCounts.reduce((a, b) => a + b, 0);
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);
  void tick; // referenced to keep counts reactive

  return (
    <div>
      {/* Progress header */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Progress</span>
        <span className="text-sm font-bold">
          {totalAnswered}/{totalQuestions}
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${totalQuestions ? (totalAnswered / totalQuestions) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Section sidebar */}
        {sections.length > 1 && (
          <nav className="hidden w-[220px] shrink-0 md:block">
            <div className="sticky top-20 space-y-1">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sections
              </p>
              {sections.map((section, i) => {
                const total = section.questions.length;
                const answered = answeredCounts[i];
                const isComplete = answered === total;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={section.id}
                    onClick={() => (survey.currentPageNo = i)}
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
                          : isComplete
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[0.78rem] font-medium">
                        {localize(section.title, locale)}
                      </span>
                      <span
                        className={cn(
                          "text-[0.62rem]",
                          isActive ? "text-background/60" : "text-muted-foreground",
                        )}
                      >
                        {answered}/{total} answered
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Survey */}
        <div className="min-w-0 flex-1">
          <Survey model={survey} />
        </div>
      </div>
    </div>
  );
}
