"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrgBanner } from "./_components/org-banner";
import { LicenseBanner } from "./_components/license-banner";
import { TestList } from "./_components/test-list";
import { ModeSwitcher } from "./_components/mode-switcher";
import { mockScenarios, type MockMode } from "./_components/mock-data";
import { useLocale } from "@/lib/locale-context";

function HomeContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const mode = (searchParams.get("mode") as MockMode) || "assigned";
  const scenario = mockScenarios[mode] ?? mockScenarios.assigned;
  const { tests } = scenario;
  const hasTests = tests.length > 0;

  return (
    <>
      {/* Page header */}
      <div className="animate-fade-in mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("home.heading")}
        </h1>
        <p className="mt-1 text-[0.85rem] text-muted-foreground">
          {t("home.subheading")}
        </p>
      </div>

      {/* Organization banner or License banner */}
      <div className="mb-8">
        {mode === "no-license" ? <LicenseBanner /> : <OrgBanner />}
      </div>

      {/* No-license empty state */}
      {!hasTests && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("home.empty.heading")}
          </h3>
          <p className="text-[0.88rem] text-muted-foreground max-w-md mb-6 leading-relaxed">
            {t("home.empty.body")}
          </p>
        </div>
      )}

      {/* Test sections with results drawer */}
      {hasTests && <TestList tests={tests} />}

      {/* Floating mode switcher for preview */}
      <Suspense>
        <ModeSwitcher />
      </Suspense>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
