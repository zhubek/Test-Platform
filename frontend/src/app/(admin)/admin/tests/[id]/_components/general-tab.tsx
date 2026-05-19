"use client";

import {
  Compass,
  Fingerprint,
  Puzzle,
  Heart,
  Briefcase,
  Wrench,
  Scale,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
import { LocalizedTextarea } from "@/components/localized-textarea";
import type { Localized } from "@/lib/localized";
import type { TestIconKey, TestFormat } from "../../../_components/mock-data";

const COLOR_SWATCHES = [
  "#4f46e5", "#059669", "#7c3aed", "#ea580c",
  "#dc2626", "#0891b2", "#ca8a04", "#6366f1",
];

const ICON_OPTIONS: { key: TestIconKey; icon: LucideIcon; label: string }[] = [
  { key: "compass", icon: Compass, label: "Compass" },
  { key: "fingerprint", icon: Fingerprint, label: "Fingerprint" },
  { key: "puzzle", icon: Puzzle, label: "Puzzle" },
  { key: "heart", icon: Heart, label: "Heart" },
  { key: "briefcase", icon: Briefcase, label: "Briefcase" },
  { key: "wrench", icon: Wrench, label: "Wrench" },
  { key: "scale", icon: Scale, label: "Scale" },
  { key: "book-open", icon: BookOpen, label: "Book" },
];

interface Props {
  name: Localized;
  description: Localized;
  color: string;
  icon: TestIconKey;
  category: Localized;
  format: TestFormat;
  duration: number;
  onNameChange: (v: Localized) => void;
  onDescriptionChange: (v: Localized) => void;
  onColorChange: (v: string) => void;
  onIconChange: (v: TestIconKey) => void;
  onCategoryChange: (v: Localized) => void;
  onFormatChange: (v: TestFormat) => void;
  onDurationChange: (v: number) => void;
}

export function GeneralTab({
  name,
  description,
  color,
  icon,
  category,
  format,
  duration,
  onNameChange,
  onDescriptionChange,
  onColorChange,
  onIconChange,
  onCategoryChange,
  onFormatChange,
  onDurationChange,
}: Props) {
  const { t } = useLocale();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      {/* Name */}
      <div>
        <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {t("cm.general.nameLabel")}
        </label>
        <LocalizedInput
          value={name}
          onChange={onNameChange}
          placeholder={t("cm.general.namePlaceholder")}
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
          placeholder={t("cm.general.descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {t("cm.general.categoryLabel")}
        </label>
        <LocalizedInput
          value={category}
          onChange={onCategoryChange}
          placeholder={t("cm.general.categoryPlaceholder")}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
        />
      </div>

      {/* Color + Icon row */}
      <div className="flex flex-col sm:flex-row gap-5">
        <div>
          <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t("cm.general.colorLabel")}
          </label>
          <div className="flex gap-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={
                  "w-7 h-7 rounded-full transition-all " +
                  (c === color
                    ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                    : "hover:scale-110")
                }
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[0.75rem] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t("cm.general.iconLabel")}
          </label>
          <div className="flex gap-1.5">
            {ICON_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => onIconChange(opt.key)}
                  title={opt.label}
                  className={
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all " +
                    (icon === opt.key
                      ? "bg-teal-50 text-teal-600 ring-2 ring-teal-400 ring-offset-1"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")
                  }
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
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
              max={180}
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
              onClick={() => onFormatChange("test-only")}
              className={
                "rounded-full px-3 py-1.5 text-[0.72rem] font-semibold transition-all duration-200 " +
                (format === "test-only"
                  ? "bg-white text-gray-700 shadow-sm"
                  : "text-gray-400 hover:text-gray-600")
              }
            >
              {t("cm.general.formatTestOnly")}
            </button>
            <button
              onClick={() => onFormatChange("with-consulting")}
              className={
                "rounded-full px-3 py-1.5 text-[0.72rem] font-semibold transition-all duration-200 " +
                (format === "with-consulting"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-400 hover:text-gray-600")
              }
            >
              {t("cm.general.formatConsulting")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
