"use client";

import { useCallback } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { TestEditorShell } from "../[id]/_components/test-editor-shell";
import { useLocale } from "@/lib/locale-context";
import { useProject } from "@/lib/project-context";
import { createTest, editorPatchToWrite } from "@/lib/backend";
import type { ContentTest } from "../../_components/mock-data";

const emptyTest: ContentTest = {
  id: "new",
  name: { en: "", ru: "", kk: "" },
  description: { en: "", ru: "", kk: "" },
  color: "#4f46e5",
  icon: "compass",
  category: { en: "", ru: "", kk: "" },
  format: "test-only",
  visibilityTags: [],
  visibilityRule: { combinator: "all", items: [] },
  duration: 15,
  status: "draft",
  createdAt: new Date().toISOString().split("T")[0],
  updatedAt: new Date().toISOString().split("T")[0],
  sections: [],
  mappings: [],
  variables: [],
  surveyLogic: {},
  characteristicSections: [],
  resultPages: [],
  dashboardPages: [],
  resultWidgets: [],
  orgDashboardWidgets: [],
  regionDashboardWidgets: [],
};

export default function NewTestPage() {
  const { t } = useLocale();
  const { project } = useProject();

  const handleSave = useCallback(
    async (patch: Record<string, any>) => {
      if (!project.id) return;
      try {
        const created = await createTest(project.id, editorPatchToWrite(patch as never));
        window.location.href = `/admin/tests/${created.id}`;
      } catch (err) {
        console.error("Failed to create test:", err);
        alert("Failed to create test. See console for details.");
      }
    },
    [project.id],
  );

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.tests.heading"), href: "/admin/tests" },
          { label: t("cm.tests.breadcrumb.new") },
        ]}
      />
      <TestEditorShell initialData={emptyTest} onSave={handleSave} />
    </>
  );
}
