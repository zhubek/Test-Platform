"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { TestEditorShell } from "./_components/test-editor-shell";
import { useLocale } from "@/lib/locale-context";
import { fetchTest, updateTest, type TestRow } from "@/lib/api";
import type { ContentTest } from "../../_components/mock-data";
import type { VisibilityRule } from "@/lib/visibility-rule";

function apiTestToContentTest(t: TestRow): ContentTest {
  const toLoc = (x: any): { en: string; ru: string; kz: string } =>
    x && typeof x === "object"
      ? { en: x.en ?? "", ru: x.ru ?? "", kz: x.kz ?? "" }
      : { en: x ?? "", ru: "", kz: "" };
  const vars = (t.vars?.variables ?? []).map((v: any) => ({
    id: v.id,
    name: v.name,
    label: v.label ? toLoc(v.label) : toLoc(v.description),
    kind: v.kind ?? "custom",
    formula: v.formula ?? "",
    scope: v.scope ?? "both",
    valueTranslations: v.valueTranslations,
    source: v.source,
    mappingId: v.mappingId,
    rank: v.rank,
  }));
  const mappings = t.calcLogic?.mappings ?? [];
  const calcLogic = t.calcLogic?.characteristicSections ?? [];
  const resultWidgets = t.resultViewLogic?.widgets ?? [];
  // Prefer pages; fall back to legacy flat components wrapped in one page.
  const legacyComponents = t.resultViewLogic?.components ?? [];
  const resultPages =
    t.resultViewLogic?.pages ??
    (legacyComponents.length
      ? [{ id: "rp_legacy", title: { en: "Results", ru: "Результаты", kz: "Нәтижелер" }, components: legacyComponents }]
      : []);
  const dashboardWidgets = t.dashboardViewLogic?.widgets ?? [];
  const dashboardPages = t.dashboardViewLogic?.pages ?? [];

  return {
    id: String(t.id),
    name: t.name,
    description: t.desc ?? { en: "", ru: "", kz: "" },
    color: t.color ?? "#6b7280",
    icon: (t.icon as any) ?? "compass",
    category: typeof t.category === "string"
      ? { en: t.category, ru: t.category, kz: t.category }
      : (t.category ?? { en: "", ru: "", kz: "" }),
    format: "test-only",
    visibilityTags: Array.isArray((t as { visibilityTags?: string[] }).visibilityTags)
      ? (t as { visibilityTags?: string[] }).visibilityTags!
      : [],
    visibilityRule: (t as { visibilityRule?: VisibilityRule }).visibilityRule ?? {
      combinator: "all",
      items: [],
    },
    duration: t.duration ?? 0,
    status: t.state === "published" ? "published" : "draft",
    createdAt: t.createdAt?.slice(0, 10) ?? "",
    updatedAt: t.updatedAt?.slice(0, 10) ?? "",
    sections: (t.sections ?? []).map((s) => ({
      id: String(s.id),
      title: s.title,
      description: { en: "", ru: "", kz: "" },
      visibleIf: s.visibleIf,
      questions: (s.questions ?? []).map((q) => ({
        id: String(q.id),
        text: q.text,
        name: q.name,
        type: (q.type as any) ?? "single",
        rateMax: q.rateMax,
        logic: q.logic,
        choices: (q.answers ?? []).map((a) => ({
          id: String(a.id),
          text: a.text,
          value: a.value,
          visibleIf: a.visibleIf,
          variables: Array.isArray(a.vars)
            ? a.vars
            : a.vars?.variableId
              ? [{ variableId: a.vars.variableId, value: a.vars.value ?? 0 }]
              : [],
        })),
      })),
    })),
    mappings,
    variables: vars,
    surveyLogic: (t.surveyLogic as ContentTest["surveyLogic"]) ?? {},
    characteristicSections: calcLogic,
    resultPages,
    resultWidgets,
    dashboardPages,
    orgDashboardWidgets: dashboardWidgets,
    regionDashboardWidgets: [],
  };
}

export default function TestEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";

  const [test, setTest] = useState<TestRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest(numId)
      .then(setTest)
      .catch((err) => console.error("Failed to load test:", err))
      .finally(() => setLoading(false));
  }, [numId]);

  const handleSave = useCallback(
    async (patch: Record<string, any>) => {
      try {
        const updated = await updateTest(numId, patch);
        setTest(updated);
      } catch (err) {
        console.error("Failed to save:", err);
      }
    },
    [numId],
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }

  if (!test) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Test not found</div>;
  }

  const name = test.name[loc] || test.name.en || "—";
  const contentTest = apiTestToContentTest(test);

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.tests.heading"), href: "/admin/tests" },
          { label: name },
        ]}
      />
      <TestEditorShell initialData={contentTest} testId={numId} onSave={handleSave} />
    </>
  );
}
