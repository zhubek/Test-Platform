"use client";

import { useLocale } from "@/lib/locale-context";
import type { Localized } from "@/lib/localized";
import { localize } from "@/lib/localized";

interface Props {
  text: Localized;
}

export function SummaryCard({ text }: Props) {
  const { t, locale } = useLocale();

  return (
    <div className="animate-fade-in mt-6 rounded-2xl border border-black/[0.04] bg-white p-5 md:p-6">
      <h3 className="text-[0.88rem] font-semibold text-gray-800 mb-2">
        {t("characteristics.summary")}
      </h3>
      <p className="text-[0.82rem] leading-relaxed text-gray-500">{localize(text, locale)}</p>
    </div>
  );
}
