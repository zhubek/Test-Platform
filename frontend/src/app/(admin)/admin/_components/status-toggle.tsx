"use client";

import { useLocale } from "@/lib/locale-context";

interface Props {
  status: "draft" | "published";
  onChange: (status: "draft" | "published") => void;
}

export function StatusToggle({ status, onChange }: Props) {
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
      <button
        onClick={() => onChange("draft")}
        className={
          "rounded-full px-3 py-1 text-[0.72rem] font-semibold transition-all " +
          (status === "draft"
            ? "bg-background text-amber-700 shadow-sm"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        {t("cm.status.draft")}
      </button>
      <button
        onClick={() => onChange("published")}
        className={
          "rounded-full px-3 py-1 text-[0.72rem] font-semibold transition-all " +
          (status === "published"
            ? "bg-background text-emerald-700 shadow-sm"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        {t("cm.status.published")}
      </button>
    </div>
  );
}
