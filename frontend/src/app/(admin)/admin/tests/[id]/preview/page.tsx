"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchTest, type TestRow } from "@/lib/api";
import { sectionsToSurveyJson, type SurveyJsSchema } from "@/lib/surveyjs";
import type { QuestionLogic, SurveyLogic } from "../../../_components/mock-data";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { useLocale } from "@/lib/locale-context";

const SurveyRunner = dynamic(() => import("./_survey-runner"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-10 text-sm text-gray-400">Loading preview...</div>
  ),
});

function testToSections(t: TestRow) {
  return (t.sections ?? []).map((s) => ({
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
  const loc = locale as "en" | "ru" | "kz";

  const [schema, setSchema] = useState<SurveyJsSchema | null>(null);
  const [testName, setTestName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest(numId)
      .then((test) => {
        setTestName(test.name[loc] || test.name.en || "—");
        const sections = testToSections(test);

        // Overlay unsaved logic from the editor via sessionStorage.
        let surveyLogic: SurveyLogic = {};
        let perQuestion: { id: string; logic: QuestionLogic }[] = [];
        try {
          const raw = localStorage.getItem(`profwise-test-logic-${numId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            surveyLogic = parsed.surveyLogic ?? {};
            perQuestion = parsed.perQuestion ?? [];
          }
        } catch {
          // ignore; preview just runs without overlay
        }

        const logicByQ = new Map(perQuestion.map((p) => [p.id, p.logic]));
        const sectionsWithLogic = sections.map((s) => ({
          ...s,
          questions: s.questions.map((q) =>
            logicByQ.has(q.id) ? { ...q, logic: logicByQ.get(q.id) } : q,
          ),
        }));

        setSchema(
          sectionsToSurveyJson(sectionsWithLogic, {
            title: test.name,
            description: test.desc ?? undefined,
            triggers: surveyLogic.triggers,
            calculatedValues: surveyLogic.calculatedValues,
            completedHtmlOnCondition: surveyLogic.completedHtmlOnCondition,
          }),
        );
      })
      .catch((err) => console.error("Failed to load test for preview:", err))
      .finally(() => setLoading(false));
  }, [numId, loc]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }

  if (!schema) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Test not found</div>;
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Respondent Preview
          </h1>
          <p className="text-[0.75rem] text-gray-400 mt-0.5">
            Rendered with SurveyJS runner. Answers are not persisted.
          </p>
        </div>
        <a
          href={`/admin/tests/${numId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[0.82rem] font-medium text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
        >
          ← Back to editor
        </a>
      </div>
      <SurveyRunner schema={schema} locale={loc} />
    </>
  );
}
