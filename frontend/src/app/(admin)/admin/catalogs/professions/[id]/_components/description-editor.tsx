"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "../../../_components/localized-input";
import { LocalizedTextarea } from "../../../_components/localized-textarea";
import { EditorLayout } from "../../../_components/editor-layout";
import { DescriptionTab } from "@/app/professions/[id]/_components/description-tab";
import type { DescriptionData } from "@/app/professions/_components/mock-data";
import type { Localized } from "@/lib/localized";
import { l } from "@/lib/localized";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const textareaClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none";

const emptyData: DescriptionData = {
  title: l("", ""),
  intro: l("", ""),
  responsibilities: [],
  typicalDay: [],
  requiredSkills: [],
  workEnvironment: [],
  specializations: [],
};

interface Props {
  data: DescriptionData | null;
}

export function DescriptionEditor({ data: initial }: Props) {
  const { t } = useLocale();
  const src = initial ?? emptyData;

  const [title, setTitle] = useState<Localized>({ ...src.title });
  const [intro, setIntro] = useState<Localized>({ ...src.intro });
  const [responsibilities, setResponsibilities] = useState<Localized[]>(
    src.responsibilities.map((r) => ({ ...r }))
  );
  const [typicalDay, setTypicalDay] = useState(
    src.typicalDay.map((d) => ({
      period: { ...d.period },
      text: { ...d.text },
    }))
  );
  const [requiredSkills, setRequiredSkills] = useState(
    src.requiredSkills.map((s) => ({
      label: { ...s.label },
      color: s.color,
    }))
  );
  const [workEnvironment, setWorkEnvironment] = useState<Localized[]>(
    src.workEnvironment.map((w) => ({ ...w }))
  );
  const [specializations, setSpecializations] = useState(
    src.specializations.map((s) => ({
      path: { ...s.path },
      tools: { ...s.tools },
    }))
  );

  const updateListItem = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number,
    value: T
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeListItem = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const liveData: DescriptionData = {
    title,
    intro,
    responsibilities,
    typicalDay,
    requiredSkills,
    workEnvironment,
    specializations,
  };

  return (
    <EditorLayout
      editor={
        <>
          {/* Title */}
          <FieldGroup label={t("cm.methodic.col.title")}>
            <LocalizedInput value={title} onChange={setTitle} className={inputClass} />
          </FieldGroup>

          {/* Intro */}
          <FieldGroup label={t("cm.methodic.profession.intro")}>
            <LocalizedTextarea value={intro} onChange={setIntro} className={textareaClass} rows={4} />
          </FieldGroup>

          {/* Responsibilities */}
          <FieldGroup label={t("professionDetail.responsibilities")}>
            {responsibilities.map((r, i) => (
              <div key={i} className="mb-2 flex gap-1.5">
                <div className="flex-1">
                  <LocalizedInput
                    value={r}
                    onChange={(v) => updateListItem(setResponsibilities, i, v)}
                    className={inputClass}
                  />
                </div>
                <RemoveButton onClick={() => removeListItem(setResponsibilities, i)} />
              </div>
            ))}
            <AddButton
              label={t("common.add")}
              onClick={() => setResponsibilities((prev) => [...prev, l("", "")])}
            />
          </FieldGroup>

          {/* Typical Day */}
          <FieldGroup label={t("professionDetail.typicalDay")}>
            {typicalDay.map((d, i) => (
              <div key={i} className="mb-3 space-y-1.5">
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <LocalizedInput
                      value={d.period}
                      onChange={(v) =>
                        updateListItem(setTypicalDay, i, { ...d, period: v })
                      }
                      placeholder={t("cm.methodic.profession.period")}
                      className={inputClass}
                    />
                  </div>
                  <RemoveButton onClick={() => removeListItem(setTypicalDay, i)} />
                </div>
                <LocalizedTextarea
                  value={d.text}
                  onChange={(v) =>
                    updateListItem(setTypicalDay, i, { ...d, text: v })
                  }
                  className={textareaClass}
                  rows={2}
                />
              </div>
            ))}
            <AddButton
              label={t("common.add")}
              onClick={() =>
                setTypicalDay((prev) => [
                  ...prev,
                  { period: l("", ""), text: l("", "") },
                ])
              }
            />
          </FieldGroup>

          {/* Required Skills */}
          <FieldGroup label={t("professionDetail.requiredSkills")}>
            {requiredSkills.map((s, i) => (
              <div key={i} className="mb-3 bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <LocalizedInput
                      value={s.label}
                      onChange={(v) =>
                        updateListItem(setRequiredSkills, i, { ...s, label: v })
                      }
                      className={inputClass}
                    />
                  </div>
                  <RemoveButton onClick={() => removeListItem(setRequiredSkills, i)} />
                </div>
                <ColorPicker
                  value={s.color}
                  onChange={(color) =>
                    updateListItem(setRequiredSkills, i, { ...s, color })
                  }
                />
              </div>
            ))}
            <AddButton
              label={t("common.add")}
              onClick={() =>
                setRequiredSkills((prev) => [
                  ...prev,
                  { label: l("", ""), color: "bg-blue-100 text-blue-800" },
                ])
              }
            />
          </FieldGroup>

          {/* Work Environment */}
          <FieldGroup label={t("professionDetail.workEnvironment")}>
            {workEnvironment.map((w, i) => (
              <div key={i} className="mb-2 flex gap-1.5">
                <div className="flex-1">
                  <LocalizedTextarea
                    value={w}
                    onChange={(v) => updateListItem(setWorkEnvironment, i, v)}
                    className={textareaClass}
                    rows={2}
                  />
                </div>
                <RemoveButton onClick={() => removeListItem(setWorkEnvironment, i)} />
              </div>
            ))}
            <AddButton
              label={t("common.add")}
              onClick={() => setWorkEnvironment((prev) => [...prev, l("", "")])}
            />
          </FieldGroup>

          {/* Specializations */}
          <FieldGroup label={t("professionDetail.specializations")}>
            {specializations.map((s, i) => (
              <div key={i} className="mb-3 bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <LocalizedInput
                      value={s.path}
                      onChange={(v) =>
                        updateListItem(setSpecializations, i, { ...s, path: v })
                      }
                      placeholder={t("professionDetail.specPath")}
                      className={inputClass}
                    />
                  </div>
                  <RemoveButton onClick={() => removeListItem(setSpecializations, i)} />
                </div>
                <LocalizedInput
                  value={s.tools}
                  onChange={(v) =>
                    updateListItem(setSpecializations, i, {
                      ...s,
                      tools: v,
                    })
                  }
                  placeholder={t("professionDetail.specTools")}
                  className={inputClass}
                />
              </div>
            ))}
            <AddButton
              label={t("common.add")}
              onClick={() =>
                setSpecializations((prev) => [
                  ...prev,
                  { path: l("", ""), tools: l("", "") },
                ])
              }
            />
          </FieldGroup>
        </>
      }
      preview={<DescriptionTab data={liveData} />}
    />
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
    >
      + {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 self-start mt-2 text-gray-300 hover:text-red-400 transition-colors"
      title="Remove"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

const SKILL_COLORS = [
  { value: "bg-blue-100 text-blue-800", label: "Blue", bg: "#dbeafe", dot: "#1e40af" },
  { value: "bg-violet-100 text-violet-800", label: "Violet", bg: "#ede9fe", dot: "#5b21b6" },
  { value: "bg-emerald-100 text-emerald-800", label: "Emerald", bg: "#d1fae5", dot: "#065f46" },
  { value: "bg-amber-100 text-amber-800", label: "Amber", bg: "#fef3c7", dot: "#92400e" },
  { value: "bg-rose-100 text-rose-800", label: "Rose", bg: "#ffe4e6", dot: "#9f1239" },
  { value: "bg-cyan-100 text-cyan-800", label: "Cyan", bg: "#cffafe", dot: "#155e75" },
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {SKILL_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className="relative w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
          style={{
            background: c.bg,
            borderColor: value === c.value ? c.dot : "transparent",
          }}
          title={c.label}
        >
          {value === c.value && (
            <svg
              className="absolute inset-0 m-auto w-3 h-3"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 6L5 8.5L9.5 4"
                stroke={c.dot}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
