"use client";

import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { ButtonLink } from "@/components/button-link";

export function EmptyState() {
  const { t } = useLocale();

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t("characteristics.empty.heading")}
      </h3>
      <p className="text-[0.88rem] text-muted-foreground max-w-md mb-6 leading-relaxed">
        {t("characteristics.empty.body")}
      </p>
      <ButtonLink href="/">
        {t("characteristics.empty.cta")}
        <ArrowRight className="h-4 w-4" />
      </ButtonLink>
    </div>
  );
}
