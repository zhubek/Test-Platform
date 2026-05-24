"use client";

import { ArrowRight } from "lucide-react";
import type { ProfessionData } from "./mock-data";
import { ProfessionCard } from "./profession-card";
import { useLocale } from "@/lib/locale-context";

interface Props {
  professions: ProfessionData[];
  fitKey: string;
  fitLabel: string;
}

export function ProfessionGrid({ professions, fitKey, fitLabel }: Props) {
  const { t } = useLocale();

  const sorted = [...professions]
    .sort(
      (a, b) =>
        (b.fit[fitKey as keyof typeof b.fit] ?? 0) -
        (a.fit[fitKey as keyof typeof a.fit] ?? 0),
    )
    .slice(0, 10);

  if (sorted.length === 0) return null;

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[0.88rem] font-semibold text-gray-800">
          {t("characteristics.profGrid.heading").replace("{fit}", fitLabel)}
        </h3>
        <a
          href="/professions"
          className="flex items-center gap-1 text-[0.78rem] font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t("characteristics.profGrid.viewAll")}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((prof, i) => (
          <ProfessionCard key={prof.code} profession={prof} index={i} />
        ))}
      </div>
    </div>
  );
}
