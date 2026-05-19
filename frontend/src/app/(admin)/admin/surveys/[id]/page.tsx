"use client";

import { use } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { SurveyEditorShell } from "./_components/survey-editor-shell";
import { surveyMap } from "./_components/survey-mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

export default function SurveyEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, locale } = useLocale();
  const survey = surveyMap[id] ?? surveyMap["satisfaction"]!;

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.surveys.heading"), href: "/admin/surveys" },
          { label: localize(survey.name, locale) },
        ]}
      />
      <SurveyEditorShell initialData={survey} />
    </>
  );
}
