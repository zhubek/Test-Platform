"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { TestEditorShell } from "./_components/test-editor-shell";
import { useLocale } from "@/lib/locale-context";
import {
  fetchTest,
  updateTest,
  setTestState,
  editorPatchToWrite,
  type AdminTest,
} from "@/lib/backend";
import type { ContentTest } from "../../_components/mock-data";
import type { VisibilityRule } from "@/lib/visibility-rule";

// Backend Test → the rich ContentTest the editor shell consumes. The shell only
// edits the General-tab fields; the block-based tabs (Questions/Calc/Result)
// load their own localStorage drafts keyed by this test's id.
function toContentTest(t: AdminTest): ContentTest {
  const ap = t.advancedParams as Record<string, any>;
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    color: t.color,
    icon: (t.icon as ContentTest["icon"]) ?? "compass",
    category: t.category,
    format: "test-only",
    visibilityTags: Array.isArray(ap.visibilityTags) ? ap.visibilityTags : [],
    visibilityRule: (ap.visibilityRule as VisibilityRule) ?? { combinator: "all", items: [] },
    duration: t.duration,
    status: t.state === "PUBLISHED" ? "published" : "draft",
    createdAt: t.createdAt?.slice(0, 10) ?? "",
    updatedAt: t.updatedAt?.slice(0, 10) ?? "",
    sections: [],
    mappings: ap.mappings ?? [],
    variables: ap.vars ?? [],
    surveyLogic: (t.surveyLogic as ContentTest["surveyLogic"]) ?? {},
    characteristicSections: ap.characteristicSections ?? [],
    resultPages: ap.result?.pages ?? [],
    resultWidgets: [],
    dashboardPages: [],
    orgDashboardWidgets: [],
    regionDashboardWidgets: [],
  };
}

export default function TestEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";

  const [test, setTest] = useState<AdminTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTest(id)
      .then((x) => { if (!cancelled) setTest(x); })
      .catch((err) => console.error("Failed to load test:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = useCallback(
    async (patch: Record<string, any>) => {
      try {
        // Merge against the SERVER's current bags, not the page's load-time copy
        // — the Questions/Calculation/Result tabs save advancedParams directly, so
        // a stale base here would revert their work (vars/calc/matches/result).
        const fresh = await fetchTest(id).catch(() => test ?? undefined);
        // Persist the General-tab fields, merging into the existing bags.
        let next = await updateTest(id, editorPatchToWrite(patch as never, fresh ?? undefined));
        // The published/draft toggle goes through the lifecycle endpoint, and
        // only when it actually changed (the backend rejects a same-state move).
        const desired = patch.state === "published" ? "PUBLISHED" : "DRAFT";
        if (test && desired !== test.state) {
          next = await setTestState(id, desired);
        }
        setTest(next);
      } catch (err) {
        console.error("Failed to save:", err);
        alert("Failed to save test. See console for details.");
      }
    },
    [id, test],
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }

  if (!test) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Test not found</div>;
  }

  const name = test.name[loc] || test.name.en || "—";

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.tests.heading"), href: "/admin/tests" },
          { label: name },
        ]}
      />
      <TestEditorShell initialData={toContentTest(test)} testId={test.id} onSave={handleSave} />
    </>
  );
}
