"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "../../../_components/localized-input";
import { LocalizedTextarea } from "../../../_components/localized-textarea";
import type { Localized } from "@/lib/localized";
import type {
  ProfessionData,
  ProfessionGroup,
  ComplexityLevel,
} from "@/app/professions/_components/mock-data";

const GROUPS: ProfessionGroup[] = [
  "Technology",
  "Healthcare",
  "Education",
  "Business",
  "Creative Arts",
  "Science",
];

const COMPLEXITIES: ComplexityLevel[] = ["low", "medium", "high"];

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const textareaClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none";

interface Props {
  profession: ProfessionData;
}

export function GeneralTab({ profession }: Props) {
  const { t } = useLocale();
  const [title, setTitle] = useState<Localized>({ ...profession.title });
  const [desc, setDesc] = useState<Localized>({ ...profession.desc });
  const [code, setCode] = useState(profession.code);
  const [group, setGroup] = useState<ProfessionGroup>(profession.group);
  const [complexity, setComplexity] = useState<ComplexityLevel>(
    profession.complexity
  );
  const [popular, setPopular] = useState(profession.popular);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Title */}
      <div>
        <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          {t("cm.methodic.col.title")}
        </label>
        <LocalizedInput
          value={title}
          onChange={setTitle}
          placeholder={t("cm.methodic.profession.titlePlaceholder")}
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          {t("cm.methodic.col.description")}
        </label>
        <LocalizedTextarea
          value={desc}
          onChange={setDesc}
          placeholder={t("cm.methodic.profession.descPlaceholder")}
          className={textareaClass}
          rows={3}
        />
      </div>

      {/* Code + Group row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {t("cm.methodic.col.code")}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {t("cm.methodic.col.group")}
          </label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as ProfessionGroup)}
            className={inputClass + " cursor-pointer"}
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complexity + Popular row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {t("cm.methodic.col.complexity")}
          </label>
          <select
            value={complexity}
            onChange={(e) => setComplexity(e.target.value as ComplexityLevel)}
            className={inputClass + " cursor-pointer"}
          >
            {COMPLEXITIES.map((c) => (
              <option key={c} value={c}>
                {t(`cm.methodic.complexity.${c}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {t("cm.methodic.col.popular")}
          </label>
          <button
            type="button"
            onClick={() => setPopular(!popular)}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
              (popular
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-400 hover:text-gray-600")
            }
          >
            <Star
              className={
                "w-4 h-4 " + (popular ? "fill-amber-400 text-amber-400" : "")
              }
            />
            {popular
              ? t("cm.methodic.filter.popular")
              : t("cm.methodic.filter.regular")}
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="pt-2">
        <button className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors">
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}
