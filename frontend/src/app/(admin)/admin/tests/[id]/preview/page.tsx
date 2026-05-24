"use client";

import { use, useEffect, useState } from "react";
import { fetchTest, type TestRow } from "@/lib/api";
import type { Section, QuestionType, SurveyLogic } from "../../../_components/mock-data";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { ButtonLink } from "@/components/button-link";
import { FullSurveyPreview } from "./_full-preview";

function testToSections(t: TestRow): Section[] {
  return (t.sections ?? []).map((s) => ({
    id: String(s.id),
    title: s.title,
    description: { en: "", ru: "", kz: "" },
    visibleIf: s.visibleIf,
    questions: (s.questions ?? []).map((q) => ({
      id: String(q.id),
      text: q.text,
      name: q.name,
      type: (q.type as QuestionType) ?? "single",
      rateMax: q.rateMax,
      logic: q.logic,
      choices: (q.answers ?? []).map((a) => ({
        id: String(a.id),
        text: a.text,
        value: a.value,
        visibleIf: a.visibleIf,
        variables: [],
      })),
    })),
  }));
}

export default function TestPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();

  const [sections, setSections] = useState<Section[] | null>(null);
  const [surveyLogic, setSurveyLogic] = useState<SurveyLogic>({});
  const [testName, setTestName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest(numId)
      .then((test) => {
        setTestName(localize(test.name, locale) || "—");
        setSections(testToSections(test));
        setSurveyLogic((test.surveyLogic as SurveyLogic) ?? {});
      })
      .catch((err) => console.error("Failed to load test for preview:", err))
      .finally(() => setLoading(false));
  }, [numId, locale]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!sections) {
    return <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Test not found</div>;
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.tests.heading"), href: "/admin/tests" },
          { label: testName, href: `/admin/tests/${numId}` },
          { label: "Preview" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Respondent Preview</h1>
          <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
            How this test looks to a respondent. Answers are not saved.
          </p>
        </div>
        <ButtonLink variant="outline" size="sm" href={`/admin/tests/${numId}`}>
          ← Back to editor
        </ButtonLink>
      </div>
      <FullSurveyPreview sections={sections} surveyLogic={surveyLogic} />
    </>
  );
}
