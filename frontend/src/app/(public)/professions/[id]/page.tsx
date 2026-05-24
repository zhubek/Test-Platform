"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DetailShell } from "./_components/detail-shell";
import {
  mockScenarios,
  professionDetails,
  type MockMode,
} from "../_components/mock-data";
import { useLocale } from "@/lib/locale-context";

function ProfessionDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const id = params.id as string;
  const mode = (searchParams.get("mode") as MockMode) || "full";
  const scenario = mockScenarios[mode] ?? mockScenarios.full;

  const profId = parseInt(id, 10);
  const profession = scenario.data.professions.find((p) => p.id === profId);

  if (!profession) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            {t("professionDetail.notFound")}
          </h2>
          <a
            href={`/professions?mode=${mode}`}
            className="text-[0.85rem] text-gray-500 hover:text-gray-900 underline underline-offset-2"
          >
            {t("professionDetail.back")}
          </a>
        </div>
      </div>
    );
  }

  const detail = professionDetails[profId] ?? null;

  return (
    <Suspense>
      <DetailShell profession={profession} detail={detail} mode={mode} />
    </Suspense>
  );
}

export default function ProfessionDetailPage() {
  return (
    <Suspense>
      <ProfessionDetailContent />
    </Suspense>
  );
}
