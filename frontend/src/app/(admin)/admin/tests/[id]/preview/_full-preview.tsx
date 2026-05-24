"use client";

import { useEffect, useMemo, useState } from "react";
import { Model, settings } from "survey-core";

// In a designer preview we want `complete` triggers to fire as soon as the
// matching answer is given (not deferred to page navigation), so the preview
// reflects the rule immediately. Skip triggers already run on value change.
settings.triggers.executeCompleteOnValueChanged = true;
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { sectionsToSurveyJson } from "@/lib/surveyjs";
import { effectiveQuestionName, effectiveChoiceValue } from "@/lib/surveyjs";
import { QuestionPreview } from "../_components/preview/question-preview";
import type { Section, Question, SurveyLogic } from "../../../_components/mock-data";

function isAnswered(v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Full-width respondent preview. Renders with custom components, but uses a
// headless survey-core Model to evaluate logic (visibleIf, calculatedValues,
// triggers, completedHtmlOnCondition) exactly as the real engine would.
export function FullSurveyPreview({
  sections,
  surveyLogic = {},
}: {
  sections: Section[];
  surveyLogic?: SurveyLogic;
}) {
  const { locale } = useLocale();
  const [idx, setIdx] = useState(0);
  // UI answers keyed by question id, values are choice ids (what the custom
  // QuestionPreview components emit/compare).
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  // Whether a `complete` trigger / manual finish has ended the survey.
  const [completed, setCompleted] = useState(false);

  // Build the headless engine once from the schema, including survey-level
  // triggers / calculatedValues / completedHtmlOnCondition.
  const survey = useMemo(() => {
    const schema = sectionsToSurveyJson(sections, {
      triggers: surveyLogic.triggers,
      calculatedValues: surveyLogic.calculatedValues,
      completedHtmlOnCondition: surveyLogic.completedHtmlOnCondition,
    });
    const m = new Model(schema);
    m.showInvisibleElements = false;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, surveyLogic]);

  // Map each question's id -> its effective SurveyJS name (global index based).
  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    let gi = 0;
    sections.forEach((s) => s.questions.forEach((q) => map.set(q.id, effectiveQuestionName(q, gi++))));
    return map;
  }, [sections]);

  // Translate UI answers (by question id, choice id) → engine data
  // (by question name, effective choice value), so SurveyJS evaluates logic
  // against the same values its expressions reference.
  const engineData = useMemo(() => {
    const data: Record<string, unknown> = {};
    sections.forEach((s) =>
      s.questions.forEach((q) => {
        const name = nameById.get(q.id);
        const a = answers[q.id];
        if (!name || a == null) return;
        const choiceValue = (id: string) => {
          const ci = q.choices.findIndex((c) => c.id === id);
          return ci >= 0 ? effectiveChoiceValue(q.choices[ci], ci) : id;
        };
        if (Array.isArray(a)) data[name] = a.map((id) => choiceValue(String(id)));
        else if (q.choices.length) data[name] = choiceValue(String(a));
        else data[name] = a; // likert/rating/boolean — value is already final
      }),
    );
    return data;
  }, [answers, sections, nameById]);

  // Single source of truth: feed answers into the engine via setValue (which
  // runs the trigger pipeline — bulk `survey.data =` does not fire complete/
  // skip the same way), then read back everything we render from. Recomputed
  // only when answers change.
  const derived = useMemo(() => {
    // Clear keys no longer answered (skip engine-owned calculated values).
    const incoming = new Set(Object.keys(engineData));
    for (const k of Object.keys(survey.data)) {
      if (!incoming.has(k) && !survey.calculatedValues.some((cv) => cv.name === k)) {
        survey.clearValue(k);
      }
    }
    for (const [k, v] of Object.entries(engineData)) survey.setValue(k, v);

    const allQ = survey.getAllQuestions();
    const visibleChoiceValuesByName = new Map<string, Set<string>>();
    for (const q of allQ) {
      const choices = (q as unknown as { visibleChoices?: { value: unknown }[] }).visibleChoices;
      if (choices) visibleChoiceValuesByName.set(q.name, new Set(choices.map((c) => String(c.value))));
    }
    // Engine values written by setvalue/copyvalue triggers, translated back to UI ids.
    const engineWrites: Record<string, unknown> = {};
    for (const s of sections) {
      for (const q of s.questions) {
        const name = nameById.get(q.id);
        if (!name) continue;
        const ev = survey.getValue(name);
        if (ev == null) continue;
        const toId = (val: unknown) => {
          const ci = q.choices.findIndex((c, i) => effectiveChoiceValue(c, i) === Number(val));
          return ci >= 0 ? q.choices[ci].id : val;
        };
        engineWrites[q.id] = Array.isArray(ev) ? ev.map(toId) : q.choices.length ? toId(ev) : ev;
      }
    }
    return {
      completed: survey.state === "completed",
      calcValues: survey.calculatedValues.map((cv) => ({
        name: cv.name,
        value: survey.getVariable(cv.name) ?? cv.value,
      })),
      visibleNames: new Set(allQ.filter((q) => q.isVisible).map((q) => q.name)),
      disabledNames: new Set(allQ.filter((q) => q.isReadOnly).map((q) => q.name)),
      requiredNames: new Set(allQ.filter((q) => q.isRequired).map((q) => q.name)),
      visibleChoiceValuesByName,
      visiblePageIds: new Set(survey.pages.filter((p) => p.isVisible).map((p) => p.name)),
      engineWrites,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineData, survey, sections, nameById]);

  const {
    calcValues,
    visibleNames,
    disabledNames,
    requiredNames,
    visibleChoiceValuesByName,
    visiblePageIds,
  } = derived;

  // Map a question's visible choice VALUES back to UI choice IDS for rendering.
  const visibleChoiceIdsFor = (q: Question): Set<string> | undefined => {
    const name = nameById.get(q.id);
    const vals = name ? visibleChoiceValuesByName.get(name) : undefined;
    if (!vals) return undefined;
    const ids = new Set<string>();
    q.choices.forEach((c, ci) => {
      if (vals.has(String(effectiveChoiceValue(c, ci)))) ids.add(c.id);
    });
    return ids;
  };

  // Only sections whose page is visible.
  const visibleSections = sections.filter((s) => visiblePageIds.has(s.id) || visiblePageIds.size === 0);

  const visibleQs = (s: Section) =>
    s.questions.filter((q) => {
      const n = nameById.get(q.id);
      return n ? visibleNames.has(n) : true;
    });

  const setAnswer = (q: Question, v: unknown) => {
    setAnswers((prev) => ({ ...prev, [q.id]: v }));
  };

  // React to engine outcomes: completion + trigger write-backs (setvalue/copyvalue).
  useEffect(() => {
    if (derived.completed) {
      setCompleted(true);
      return;
    }
    setAnswers((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [id, val] of Object.entries(derived.engineWrites)) {
        if (JSON.stringify(prev[id]) !== JSON.stringify(val)) {
          next[id] = val;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [derived]);

  // If answers hid the page we're on (or shifted the visible count), snap the
  // stored index back into range so we never strand the user on a hidden page.
  useEffect(() => {
    if (idx > visibleSections.length - 1) {
      setIdx(Math.max(0, visibleSections.length - 1));
    }
  }, [idx, visibleSections.length]);

  // ── Completion screen (complete trigger / completedHtmlOnCondition) ──────
  if (completed) {
    const html = survey.renderedCompletedHtml;
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Survey completed</h2>
        {html ? (
          <div
            className="mt-3 text-sm text-muted-foreground [&_*]:!text-current"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            A completion trigger fired for the current answers.
          </p>
        )}
        {calcValues.length > 0 && (
          <div className="mt-5 inline-flex flex-wrap justify-center gap-2">
            {calcValues.map((cv) => (
              <span key={cv.name} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {cv.name}: {String(cv.value ?? "—")}
              </span>
            ))}
          </div>
        )}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              // Reset the engine out of its completed state, not just our flags.
              survey.clear(true, true);
              survey.start();
              setCompleted(false);
              setAnswers({});
              setIdx(0);
            }}
          >
            Restart preview
          </Button>
        </div>
      </div>
    );
  }

  if (visibleSections.length === 0) {
    return (
      <div className="rounded-2xl border bg-card py-20 text-center text-sm text-muted-foreground">
        No visible sections for the current answers.
      </div>
    );
  }

  const active = Math.min(idx, Math.max(0, visibleSections.length - 1));
  const section = visibleSections[active];

  const answeredCounts = visibleSections.map(
    (s) => visibleQs(s).filter((q) => isAnswered(answers[q.id])).length,
  );
  const totalQuestions = visibleSections.reduce((n, s) => n + visibleQs(s).length, 0);
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

      {/* Live calculated values (survey-level), so the designer can watch them. */}
      {calcValues.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
            Calculated
          </span>
          {calcValues.map((cv) => (
            <span
              key={cv.name}
              className="rounded-full border bg-muted px-3 py-1 text-xs font-medium"
            >
              {cv.name}: <span className="font-bold">{String(cv.value ?? "—")}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-8">
        {/* Vertical stepper sidebar */}
        <nav className="hidden w-[220px] shrink-0 md:block">
          <div className="sticky top-6 space-y-1">
            <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
              Sections
            </p>
            {visibleSections.map((s, i) => {
              const total = visibleQs(s).length;
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
            {visibleQs(section).length === 0 ? (
              <div className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                No visible questions in this section.
              </div>
            ) : (
              visibleQs(section).map((q) => (
                <div key={q.id} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <QuestionPreview
                    question={q}
                    value={(answers[q.id] as never) ?? null}
                    onChange={(v) => setAnswer(q, v)}
                    disabled={disabledNames.has(nameById.get(q.id)!)}
                    required={requiredNames.has(nameById.get(q.id)!)}
                    visibleChoiceIds={visibleChoiceIdsFor(q)}
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
              {active + 1} / {visibleSections.length}
            </span>
            {active === visibleSections.length - 1 ? (
              <Button onClick={() => setCompleted(true)}>Finish</Button>
            ) : (
              <Button variant="outline" onClick={() => setIdx(active + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
