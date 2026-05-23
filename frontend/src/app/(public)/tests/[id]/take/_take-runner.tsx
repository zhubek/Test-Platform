"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { FlatLight } from "survey-core/themes";
import "survey-core/survey-core.css";
import { submitTestResult, type TestRow } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

// SurveyJS uses "kk" for Kazakh, "ru" for Russian, "en" default.
const localeMap: Record<Locale, string> = { en: "en", ru: "ru", kz: "kk" };

function toSurveyText(v: { en: string; ru: string; kz: string }) {
  return { default: v.en, ru: v.ru || undefined, kk: v.kz || undefined };
}

function buildModel(test: TestRow) {
  const pages = (test.sections ?? []).map((s) => ({
    name: `s${s.id}`,
    title: toSurveyText(s.title),
    elements: s.questions.map((q) => ({
      type: q.type === "multiple" ? "checkbox" : "radiogroup",
      name: String(q.id),
      title: toSurveyText(q.text),
      isRequired: true,
      choices: q.answers.map((a) => ({
        value: String(a.id),
        text: toSurveyText(a.text),
      })),
    })),
  }));

  return {
    title: toSurveyText(test.name),
    showProgressBar: "top" as const,
    progressBarType: "questions" as const,
    pages,
  };
}

export function TakeRunner({ test, locale }: { test: TestRow; locale: Locale }) {
  const router = useRouter();

  const survey = useMemo(() => {
    const model = new Model(buildModel(test));
    model.locale = localeMap[locale];
    model.applyTheme(FlatLight);
    return model;
  }, [test, locale]);

  survey.locale = localeMap[locale];

  survey.onComplete.add(async (sender) => {
    const answers = sender.data as Record<string, number | string | string[]>;
    try {
      const result = await submitTestResult(test.id, answers);
      router.push(`/tests/${test.id}/result/${result.id}`);
    } catch (e) {
      console.error("Failed to submit result:", e);
    }
  });

  return <Survey model={survey} />;
}
