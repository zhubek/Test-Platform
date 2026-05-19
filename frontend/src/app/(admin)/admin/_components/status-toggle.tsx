"use client";

import { useLocale } from "@/lib/locale-context";

interface Props {
  status: "draft" | "published";
  onChange: (status: "draft" | "published") => void;
}

export function StatusToggle({ status, onChange }: Props) {
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5">
      <button
        onClick={() => onChange("draft")}
        className={
          "rounded-full px-3 py-1 text-[0.72rem] font-semibold transition-all duration-200 " +
          (status === "draft"
            ? "bg-white text-amber-700 shadow-sm"
            : "text-gray-400 hover:text-gray-600")
        }
      >
        {t("cm.status.draft")}
      </button>
      <button
        onClick={() => onChange("published")}
        className={
          "rounded-full px-3 py-1 text-[0.72rem] font-semibold transition-all duration-200 " +
          (status === "published"
            ? "bg-white text-emerald-700 shadow-sm"
            : "text-gray-400 hover:text-gray-600")
        }
      >
        {t("cm.status.published")}
      </button>
    </div>
  );
}
