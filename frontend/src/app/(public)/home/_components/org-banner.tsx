"use client";

import { Building2, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export function OrgBanner() {
  const { t } = useLocale();

  return (
    <div className="animate-fade-up flex items-center gap-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-violet-50/80 border border-indigo-100/60 px-5 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        <Building2 className="h-4.5 w-4.5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.82rem] text-gray-600">
          {t("orgBanner.memberOf")}{" "}
          <span className="font-semibold text-gray-900">Acme Education Group</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-[0.7rem] font-semibold text-emerald-700">{t("orgBanner.active")}</span>
      </div>
    </div>
  );
}
