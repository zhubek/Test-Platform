"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { DescriptionEditor } from "./_components/description-editor";
import { CharacteristicsEditor } from "./_components/characteristics-editor";
import { EducationEditor } from "./_components/education-editor";
import { LaborMarketEditor } from "./_components/labor-market-editor";
import { ContentEditor } from "./_components/content-editor";
import { OutputVariablesTab } from "../../_components/output-variables-tab";
import {
  fetchProfession,
  updateProfession,
  deleteProfession,
  fetchProfessionGroups,
  type ProfessionRow,
  type ProfessionGroupRow,
} from "@/lib/methodic-api";

const TABS = [
  "general",
  "description",
  "characteristics",
  "education",
  "labor",
  "content",
  "output",
] as const;
type Tab = (typeof TABS)[number];

export default function ProfessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";

  const [prof, setProf] = useState<ProfessionRow | null>(null);
  const [groups, setGroups] = useState<ProfessionGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const profRef = useRef(prof);
  profRef.current = prof;

  useEffect(() => {
    Promise.all([fetchProfession(numId), fetchProfessionGroups()])
      .then(([p, g]) => {
        setProf(p);
        setGroups(g);
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [numId]);

  const save = useCallback(
    async (patch: Record<string, any>) => {
      setSaving(true);
      try {
        const updated = await updateProfession(numId, patch);
        setProf(updated);
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [numId],
  );

  const saveParams = useCallback(
    (key: string, value: any) => {
      if (!profRef.current) return;
      const newParams = { ...profRef.current.params, [key]: value };
      save({ params: newParams });
    },
    [save],
  );

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this profession?")) return;
    await deleteProfession(numId);
    window.location.href = "/admin/catalogs#professions";
  }, [numId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }

  if (!prof) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Profession not found</div>;
  }

  const name = prof.name[loc] || prof.name.en || "";

  const tabLabels: Record<Tab, string> = {
    general: t("cm.methodic.profession.tabs.general"),
    description: t("professionDetail.tabs.description"),
    characteristics: t("professionDetail.tabs.characteristics"),
    education: t("professionDetail.tabs.education"),
    labor: t("professionDetail.tabs.labor"),
    content: t("professionDetail.tabs.content"),
    output: t("cm.methodic.tab.output"),
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
          { label: t("cm.methodic.professions"), href: "/admin/catalogs#professions" },
          { label: name || "—" },
        ]}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              "relative shrink-0 px-4 py-2.5 text-[0.82rem] font-medium transition-colors " +
              (activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600")
            }
          >
            {tabLabels[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <GeneralTab
          prof={prof}
          setProf={setProf}
          groups={groups}
          loc={loc}
          save={save}
          saving={saving}
          onDelete={handleDelete}
          t={t}
        />
      )}
      {activeTab === "description" && (
        <DescriptionEditor data={prof.params?.description ?? null} />
      )}
      {activeTab === "characteristics" && (
        <CharacteristicsEditor professionId={numId} />
      )}
      {activeTab === "education" && (
        <EducationEditor
          data={prof.params?.education ?? null}
          onSave={(ed) => saveParams("education", ed)}
        />
      )}
      {activeTab === "labor" && (
        <LaborMarketEditor data={prof.params?.labor_market ?? null} />
      )}
      {activeTab === "content" && (
        <ContentEditor data={prof.params?.content ?? null} />
      )}
      {activeTab === "output" && (
        <OutputVariablesTab
          type="professions"
          output={(prof.params?.output as Record<string, import("@/lib/localized").Localized>) ?? {}}
          onChange={(next) => saveParams("output", next)}
        />
      )}
    </>
  );
}

/* GeneralTab is now inline since it needs API-specific props */
import { LocalizedInput } from "../../_components/localized-input";
import { LocalizedTextarea } from "../../_components/localized-textarea";
import { Star } from "lucide-react";
import type { Localized } from "@/lib/methodic-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const textareaClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none";

function GeneralTab({
  prof,
  setProf,
  groups,
  loc,
  save,
  saving,
  onDelete,
  t,
}: {
  prof: ProfessionRow;
  setProf: (p: ProfessionRow) => void;
  groups: ProfessionGroupRow[];
  loc: "en" | "ru" | "kz";
  save: (patch: Record<string, any>) => Promise<void>;
  saving: boolean;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="max-w-2xl space-y-6">
      <Field label={t("cm.methodic.col.title")}>
        <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) save({ name: prof.name }); }}>
          <LocalizedInput
            value={prof.name}
            onChange={(v) => setProf({ ...prof, name: v })}
            placeholder={t("cm.methodic.profession.titlePlaceholder")}
            className={inputClass}
          />
        </div>
      </Field>

      <Field label={t("cm.methodic.col.description")}>
        <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) save({ desc: prof.desc }); }}>
          <LocalizedTextarea
            value={prof.desc ?? { en: "", ru: "", kz: "" }}
            onChange={(v) => setProf({ ...prof, desc: v })}
            placeholder={t("cm.methodic.profession.descPlaceholder")}
            className={textareaClass}
            rows={3}
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("cm.methodic.col.code")}>
          <input
            type="text"
            value={prof.code ?? ""}
            onChange={(e) => setProf({ ...prof, code: e.target.value })}
            onBlur={() => save({ code: prof.code })}
            className={inputClass}
          />
        </Field>
        <Field label={t("cm.methodic.col.group")}>
          <select
            value={prof.profGroupId ?? ""}
            onChange={(e) => {
              const groupId = e.target.value ? Number(e.target.value) : null;
              const profGroup = groups.find((g) => g.id === groupId) ?? null;
              setProf({ ...prof, profGroupId: groupId, profGroup });
              save({ profGroupId: groupId });
            }}
            className={inputClass + " cursor-pointer"}
          >
            <option value="">— {t("cm.methodic.col.group")} —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name[loc] || g.name.en}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("cm.methodic.col.complexity")}>
          <select
            value={prof.complexityLevel ?? ""}
            onChange={(e) => {
              const val = e.target.value || null;
              setProf({ ...prof, complexityLevel: val });
              save({ complexityLevel: val });
            }}
            className={inputClass + " cursor-pointer"}
          >
            <option value="">—</option>
            {["low", "medium", "high"].map((c) => (
              <option key={c} value={c}>
                {t(`cm.methodic.complexity.${c}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("cm.methodic.col.popular")}>
          <button
            type="button"
            onClick={() => {
              const newVal = !prof.popular;
              setProf({ ...prof, popular: newVal });
              save({ popular: newVal });
            }}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
              (prof.popular
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-400 hover:text-gray-600")
            }
          >
            <Star className={"w-4 h-4 " + (prof.popular ? "fill-amber-400 text-amber-400" : "")} />
            {prof.popular ? t("cm.methodic.filter.popular") : t("cm.methodic.filter.regular")}
          </button>
        </Field>
      </div>

      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">{saving ? "Saving..." : ""}</span>
        <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700 transition-colors">
          Delete profession
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
