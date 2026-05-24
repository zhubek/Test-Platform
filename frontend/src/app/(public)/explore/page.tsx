"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfessionsShell } from "../professions/_components/professions-shell";
import { ModeSwitcher } from "../professions/_components/mode-switcher";
import { mockScenarios, type MockMode } from "../professions/_components/mock-data";
import { useLocale } from "@/lib/locale-context";

function ExploreContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const mode = (searchParams.get("mode") as MockMode) || "full";
  const scenario = mockScenarios[mode] ?? mockScenarios.full;

  return (
    <>
      <div className="animate-fade-in mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("professions.heading")}
        </h1>
        <p className="mt-1 text-[0.85rem] text-muted-foreground">
          {t("professions.subheading")}
        </p>
      </div>

      <ProfessionsShell data={scenario.data} mode={mode} />

      <Suspense>
        <ModeSwitcher />
      </Suspense>
    </>
  );
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  );
}
