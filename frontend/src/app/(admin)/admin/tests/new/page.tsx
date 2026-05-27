"use client";

import { useCallback } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { TestEditorShell } from "../[id]/_components/test-editor-shell";
import { useLocale } from "@/lib/locale-context";
import { createTest } from "@/lib/api";
import type { ContentTest } from "../../_components/mock-data";

const emptyTest: ContentTest = {
  id: "new",
  name: { en: "", ru: "", kz: "" },
  description: { en: "", ru: "", kz: "" },
  color: "#4f46e5",
  icon: "compass",
  category: { en: "", ru: "", kz: "" },
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
  resultWidgets: [],
  orgDashboardWidgets: [],
  regionDashboardWidgets: [],
};

export default function NewTestPage() {
  const { t } = useLocale();

  const handleSave = useCallback(async (patch: Record<string, any>) => {
    try {
      const created = await createTest(patch);
      window.location.href = `/admin/tests/${created.id}`;
    } catch (err) {
      console.error("Failed to create test:", err);
    }
  }, []);

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
