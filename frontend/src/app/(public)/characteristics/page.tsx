"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CharacteristicsShell } from "./_components/characteristics-shell";
import { ModeSwitcher } from "./_components/mode-switcher";
import { mockScenarios, type MockMode } from "./_components/mock-data";
import { useLocale } from "@/lib/locale-context";

function CharacteristicsContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const mode = (searchParams.get("mode") as MockMode) || "full";
  const scenario = mockScenarios[mode] ?? mockScenarios.full;

  return (
    <>
      {/* Page header */}
      <div className="animate-fade-in mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {t("characteristics.heading")}
        </h1>
        <p className="mt-1 text-[0.85rem] text-gray-400">
          {t("characteristics.subheading")}
        </p>
      </div>

      <CharacteristicsShell data={scenario.data} />

      <Suspense>
        <ModeSwitcher />
      </Suspense>
    </>
  );
}

export default function CharacteristicsPage() {
  return (
    <Suspense>
      <CharacteristicsContent />
    </Suspense>
  );
}
