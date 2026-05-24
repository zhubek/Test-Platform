"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfessionsShell } from "./_components/professions-shell";
import { ModeSwitcher } from "./_components/mode-switcher";
import { mockScenarios, type MockMode } from "./_components/mock-data";
import { useLocale } from "@/lib/locale-context";

function ProfessionsContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const mode = (searchParams.get("mode") as MockMode) || "full";
  const scenario = mockScenarios[mode] ?? mockScenarios.full;

  return (
    <>
      {/* Page header */}
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

export default function ProfessionsPage() {
  return (
    <Suspense>
      <ProfessionsContent />
    </Suspense>
  );
}
