"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { TestEditorShell } from "./_components/test-editor-shell";
import { useLocale } from "@/lib/locale-context";
import { fetchTest, updateTest, type TestRow } from "@/lib/api";
import type { ContentTest } from "../../_components/mock-data";

function apiTestToContentTest(t: TestRow): ContentTest {
  const vars = t.vars?.variables ?? [];
  const calcLogic = t.calcLogic?.characteristicSections ?? [];
  const resultWidgets = t.resultViewLogic?.widgets ?? [];
  const dashboardWidgets = t.dashboardViewLogic?.widgets ?? [];

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
    duration: t.duration ?? 0,
    status: t.state === "published" ? "published" : "draft",
    createdAt: t.createdAt?.slice(0, 10) ?? "",
    updatedAt: t.updatedAt?.slice(0, 10) ?? "",
    sections: (t.sections ?? []).map((s) => ({
      id: String(s.id),
      title: s.title,
      description: { en: "", ru: "", kz: "" },
      questions: (s.questions ?? []).map((q) => ({
        id: String(q.id),
        text: q.text,
        type: (q.type as any) ?? "single",
        choices: (q.answers ?? []).map((a) => ({
          id: String(a.id),
          text: a.text,
          variables: Array.isArray(a.vars)
            ? a.vars
            : a.vars?.variableId
              ? [{ variableId: a.vars.variableId, value: a.vars.value ?? 0 }]
              : [],
        })),
      })),
    })),
    variables: vars,
    characteristicSections: calcLogic,
    resultWidgets,
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
