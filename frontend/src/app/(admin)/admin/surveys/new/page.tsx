"use client";

import { Breadcrumb } from "../../_components/breadcrumb";
import { SurveyEditorShell } from "../[id]/_components/survey-editor-shell";
import { useLocale } from "@/lib/locale-context";
import type { ContentSurvey } from "../../_components/mock-data";

const emptySurvey: ContentSurvey = {
  id: "new",
  name: { en: "", ru: "", kk: "" },
  description: { en: "", ru: "", kk: "" },
  format: "included",
  duration: 5,
  status: "draft",
  createdAt: new Date().toISOString().split("T")[0],
  updatedAt: new Date().toISOString().split("T")[0],
  sections: [],
  orgDashboardWidgets: [],
  regionDashboardWidgets: [],
};

export default function NewSurveyPage() {
  const { t } = useLocale();

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.surveys.heading"), href: "/admin/surveys" },
          { label: t("cm.surveys.breadcrumb.new") },
        ]}
      />
      <SurveyEditorShell initialData={emptySurvey} />
    </>
  );
}
