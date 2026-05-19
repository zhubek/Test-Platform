"use client";

import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
import { LocalizedTextarea } from "@/components/localized-textarea";
import type { Localized } from "@/lib/localized";
import type { SurveyFormat } from "../../../_components/mock-data";

interface Props {
  name: Localized;
  description: Localized;
  format: SurveyFormat;
  duration: number;
  onNameChange: (v: Localized) => void;
  onDescriptionChange: (v: Localized) => void;
  onFormatChange: (v: SurveyFormat) => void;
  onDurationChange: (v: number) => void;
}

export function SurveyGeneralTab({
  name,
  description,
  format,
  duration,
  onNameChange,
  onDescriptionChange,
  onFormatChange,
  onDurationChange,
}: Props) {
  const { t } = useLocale();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      {/* Name */}
      <div>
        <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {t("cm.survey.nameLabel")}
        </label>
        <LocalizedInput
          value={name}
          onChange={onNameChange}
          placeholder={t("cm.survey.namePlaceholder")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {t("cm.general.descriptionLabel")}
        </label>
        <LocalizedTextarea
          value={description}
          onChange={onDescriptionChange}
          placeholder={t("cm.survey.descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
        />
      </div>

      {/* Duration + Format row */}
      <div className="flex flex-col sm:flex-row gap-5">
        <div>
          <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {t("cm.general.durationLabel")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={duration}
              onChange={(e) => onDurationChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            />
            <span className="text-[0.78rem] text-gray-400">{t("cm.general.durationUnit")}</span>
          </div>
        </div>

        <div>
          <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {t("cm.general.formatLabel")}
          </label>
          <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5">
            <button
              onClick={() => onFormatChange("included")}
              className={
                "rounded-full px-3 py-1.5 text-[0.72rem] font-semibold transition-all duration-200 " +
                (format === "included"
                  ? "bg-white text-gray-700 shadow-sm"
                  : "text-gray-400 hover:text-gray-600")
              }
            >
              {t("cm.survey.formatIncluded")}
            </button>
            <button
              onClick={() => onFormatChange("separate")}
              className={
                "rounded-full px-3 py-1.5 text-[0.72rem] font-semibold transition-all duration-200 " +
                (format === "separate"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-400 hover:text-gray-600")
              }
            >
              {t("cm.survey.formatSeparate")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
