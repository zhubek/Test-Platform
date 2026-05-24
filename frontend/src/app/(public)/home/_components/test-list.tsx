"use client";

import { useState } from "react";
import { TestCard } from "./test-card";
import { ResultsDrawer } from "./results-drawer";
import type { TestData } from "./mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

interface TestListProps {
  tests: TestData[];
}

export function TestList({ tests }: TestListProps) {
  const { t, locale } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const inProgress = tests.filter((t) => t.status === "in-progress");
  const completed = tests.filter((t) => t.status === "completed");
  const available = tests.filter((t) => t.status === "available");

  function openResults(testId: string) {
    setActiveTestId(testId);
    setDrawerOpen(true);
  }

  const activeTest = tests.find((t) => t.id === activeTestId);
  const activeResults = activeTest?.results ?? [];

  let cardIndex = 0;

  return (
    <>
      {/* In Progress section */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[0.82rem] font-semibold text-foreground uppercase tracking-wider">
              {t("testList.continue")}
            </h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700">
              {inProgress.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inProgress.map((test) => {
              const i = cardIndex++;
              const { results, ...cardProps } = test;
              return (
                <TestCard
                  key={test.id}
                  {...cardProps}
                  resultCount={results.length}
                  index={i}
                  onViewResults={() => openResults(test.id)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Completed section */}
      {completed.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[0.82rem] font-semibold text-foreground uppercase tracking-wider">
              {t("testList.completed")}
            </h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">
              {completed.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completed.map((test) => {
              const i = cardIndex++;
              const { results, ...cardProps } = test;
              return (
                <TestCard
                  key={test.id}
                  {...cardProps}
                  resultCount={results.length}
                  index={i}
                  onViewResults={() => openResults(test.id)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Available section */}
      {available.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[0.82rem] font-semibold text-foreground uppercase tracking-wider">
              {t("testList.available")}
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
              {available.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {available.map((test) => {
              const i = cardIndex++;
              const { results, ...cardProps } = test;
              return (
                <TestCard
                  key={test.id}
                  {...cardProps}
                  resultCount={results.length}
                  index={i}
                  onViewResults={() => openResults(test.id)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Results drawer */}
      <ResultsDrawer
        open={drawerOpen}
        testTitle={activeTest ? localize(activeTest.title, locale) : ""}
        results={activeResults}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
