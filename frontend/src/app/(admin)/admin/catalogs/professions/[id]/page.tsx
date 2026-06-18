"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { DescriptionEditor } from "./_components/description-editor";
import { CharacteristicsEditor } from "./_components/characteristics-editor";
import { EducationEditor } from "./_components/education-editor";
import { LaborMarketEditor } from "./_components/labor-market-editor";
import { ContentEditor } from "./_components/content-editor";
import { CatalogDetailScaffold, type CatalogPageDef } from "../../_components/catalog-detail-scaffold";
import { CatalogFieldsForm } from "../../_components/catalog-fields-form";
import { PreviewLocaleScope } from "../../_components/edit-language";
import { FileText, Activity, GraduationCap, Briefcase, FileStack, CreditCard } from "lucide-react";
import type { Localized } from "@/lib/localized";
import { ProfessionCard } from "@/app/(public)/professions/_components/profession-card";
import type {
  ProfessionData,
  ProfessionGroup,
  ComplexityLevel,
  PrepLevel,
} from "@/app/(public)/professions/_components/mock-data";
import {
  fetchProfession,
  updateProfession,
  deleteProfession,
  fetchProfessionGroups,
  type ProfessionRow,
  type ProfessionGroupRow,
} from "@/lib/methodic-api";

export default function ProfessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";

  const [prof, setProf] = useState<ProfessionRow | null>(null);
  const [groups, setGroups] = useState<ProfessionGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Plain-text mirrors for the relation/boolean fields (group, popular).
  const [groupText, setGroupText] = useState("");
  const [popularText, setPopularText] = useState("");
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

  // Sync the plain-text mirrors when the profession loads.
  useEffect(() => {
    if (!prof) return;
    setGroupText(prof.profGroup ? prof.profGroup.name[loc] || prof.profGroup.name.en : "");
    setPopularText(prof.popular ? "yes" : "no");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prof?.id]);

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
  const editors: number[] = Array.isArray(prof.params?.access) ? prof.params!.access : [];

  const pages: CatalogPageDef[] = [
    { id: "description", label: t("professionDetail.tabs.description"), icon: FileText,
      render: <DescriptionEditor data={prof.params?.description ?? null} /> },
    { id: "characteristics", label: t("professionDetail.tabs.characteristics"), icon: Activity,
      render: <CharacteristicsEditor professionId={numId} /> },
    { id: "education", label: t("professionDetail.tabs.education"), icon: GraduationCap,
      render: <EducationEditor data={prof.params?.education ?? null} onSave={(ed) => saveParams("education", ed)} /> },
    { id: "labor", label: t("professionDetail.tabs.labor"), icon: Briefcase,
      render: <LaborMarketEditor data={prof.params?.labor_market ?? null} /> },
    { id: "content", label: t("professionDetail.tabs.content"), icon: FileStack,
      render: <ContentEditor data={prof.params?.content ?? null} /> },
    { id: "card", label: "Card", icon: CreditCard, description: "How it appears in Explore",
      render: (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* The card's structural fields live with the card they feed. */}
          <CatalogFieldsForm
            fields={[
              {
                id: "code",
                label: t("cm.methodic.col.code"),
                kind: "text",
                value: prof.code ?? "",
                onChange: (v) => setProf({ ...prof, code: v }),
                onBlur: () => save({ code: profRef.current?.code ?? "" }),
              },
              {
                id: "group",
                label: t("cm.methodic.col.group"),
                kind: "text",
                value: groupText,
                onChange: setGroupText,
                onBlur: () => {
                  const q = groupText.trim().toLowerCase();
                  const g = groups.find((gr) =>
                    [gr.name.en, gr.name.ru, gr.name.kk].some((n) => (n || "").toLowerCase() === q),
                  );
                  setProf({ ...prof, profGroupId: g?.id ?? null, profGroup: g ?? null });
                  save({ profGroupId: g?.id ?? null });
                },
                placeholder: "Technology",
              },
              {
                id: "complexity",
                label: t("cm.methodic.col.complexity"),
                kind: "text",
                value: prof.complexityLevel ?? "",
                onChange: (v) => setProf({ ...prof, complexityLevel: v || null }),
                onBlur: () => save({ complexityLevel: profRef.current?.complexityLevel ?? null }),
                placeholder: "low / medium / high",
              },
              {
                id: "popular",
                label: t("cm.methodic.col.popular"),
                kind: "text",
                value: popularText,
                onChange: setPopularText,
                onBlur: () => {
                  const b = /^(yes|true|1|y)$/i.test(popularText.trim());
                  setProf({ ...prof, popular: b });
                  save({ popular: b });
                },
                placeholder: "yes / no",
              },
            ]}
          />
          <PreviewLocaleScope><ProfessionCardView prof={prof} /></PreviewLocaleScope>
        </div>
      ) },
  ];

  return (
    <CatalogDetailScaffold
      breadcrumb={
        <Breadcrumb
          items={[
            { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
            { label: t("cm.methodic.professions"), href: "/admin/catalogs#professions" },
            { label: name || "—" },
          ]}
        />
      }
      title={name}
      catalog="professions"
      entityId={numId}
      saving={saving}
      titleField={{
        value: prof.name,
        onChange: (v) => setProf({ ...prof, name: v }),
        onBlur: () => save({ name: profRef.current?.name }),
        placeholder: t("cm.methodic.profession.titlePlaceholder"),
      }}
      descriptionField={{
        value: prof.desc ?? { en: "", ru: "", kk: "" },
        onChange: (v) => setProf({ ...prof, desc: v }),
        onBlur: () => save({ desc: profRef.current?.desc }),
        placeholder: t("cm.methodic.profession.descPlaceholder"),
      }}
      extras={{
        value: (prof.params?.output as Record<string, Localized>) ?? {},
        onChange: (next) => saveParams("output", next),
      }}
      pages={pages}
      access={{ editors, onChange: (ids) => saveParams("access", ids) }}
      onDelete={handleDelete}
      deleteLabel="Delete profession"
    />
  );
}

// "Card" view — the exact profession card from /explore, fed from the catalog data.
const VALID_GROUPS = ["Technology", "Healthcare", "Education", "Business", "Creative Arts", "Science"];

function ProfessionCardView({ prof }: { prof: ProfessionRow }) {
  const groupName = prof.profGroup?.name.en ?? "";
  const group = (VALID_GROUPS.includes(groupName) ? groupName : "Technology") as ProfessionGroup;
  const complexity: ComplexityLevel = ["low", "medium", "high"].includes(prof.complexityLevel ?? "")
    ? (prof.complexityLevel as ComplexityLevel)
    : "medium";
  const prepLevel = (complexity === "high" ? 5 : complexity === "medium" ? 3 : 2) as PrepLevel;

  const data: ProfessionData = {
    id: prof.id,
    title: prof.name,
    code: prof.code ?? "",
    desc: prof.desc ?? { en: "", ru: "", kk: "" },
    group,
    popular: prof.popular,
    liked: false,
    icon: "",
    complexity,
    prepLevel,
    fit: {},
  };

  return (
    <div className="max-w-sm">
      <ProfessionCard profession={data} onToggleLike={() => {}} index={0} />
    </div>
  );
}
