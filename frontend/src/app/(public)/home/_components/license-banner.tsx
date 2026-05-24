"use client";

import { KeyRound } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LicenseBanner() {
  const { t } = useLocale();

  return (
    <div className="animate-fade-up flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        <KeyRound className="h-4.5 w-4.5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.88rem] font-semibold text-amber-900">
          {t("licenseBanner.title")}
        </p>
        <p className="text-[0.78rem] text-amber-700/80 mt-0.5">
          {t("licenseBanner.body")}
        </p>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Input
          type="text"
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="h-9 flex-1 sm:w-[200px] border-amber-300 bg-white text-gray-700 placeholder:text-amber-400"
        />
        <Button className="h-9 shrink-0 bg-amber-500 text-white hover:bg-amber-600">
          {t("licenseBanner.activate")}
        </Button>
      </div>
    </div>
  );
}
