"use client";

import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export function EmptyState() {
  const { t } = useLocale();

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {t("characteristics.empty.heading")}
      </h3>
      <p className="text-[0.88rem] text-gray-400 max-w-md mb-6 leading-relaxed">
        {t("characteristics.empty.body")}
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-[0.8rem] font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md hover:shadow-gray-900/10 active:scale-[0.98]"
      >
        {t("characteristics.empty.cta")}
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
