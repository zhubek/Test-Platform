import type { Section, Question, QuestionType, AnswerChoice } from "@/app/(admin)/admin/_components/mock-data";
import type { Localized } from "@/lib/localized";

export interface SurveyJsLocalized {
  default?: string;
  en?: string;
  ru?: string;
  kz?: string;
}

export interface SurveyJsChoice {
  value: string;
  text: SurveyJsLocalized;
}

export interface SurveyJsQuestion {
  type: "radiogroup" | "checkbox" | "rating";
  name: string;
  title: SurveyJsLocalized;
  isRequired?: boolean;
  choices?: SurveyJsChoice[];
  rateMin?: number;
  rateMax?: number;
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
}

export interface SurveyJsPage {
  name: string;
  title?: SurveyJsLocalized;
  description?: SurveyJsLocalized;
  elements: SurveyJsQuestion[];
}

export interface SurveyJsSchema {
  title?: SurveyJsLocalized;
  description?: SurveyJsLocalized;
  showProgressBar?: "top" | "bottom" | "off";
  pages: SurveyJsPage[];
  triggers?: unknown[];
  calculatedValues?: unknown[];
  completedHtmlOnCondition?: unknown[];
}

const typeMap: Record<QuestionType, SurveyJsQuestion["type"]> = {
  single: "radiogroup",
  multiple: "checkbox",
  likert: "rating",
};

function toLocalized(v: Localized): SurveyJsLocalized {
  return {
    default: v.en || v.ru || v.kz || "",
    en: v.en,
    ru: v.ru,
    kz: v.kz,
  };
}

// Effective (referenceable) name for a question. If the author left it
// blank, fall back to q{globalIndex+1} — numbered across the whole test.
export function effectiveQuestionName(q: Question, globalIndex: number): string {
  return q.name?.trim() || `q${globalIndex + 1}`;
}

// Effective value for a choice. Blank → opt{index+1} within its question.
export function effectiveChoiceValue(c: AnswerChoice, index: number): string {
  return c.value?.trim() || `opt${index + 1}`;
}

function buildQuestion(q: Question, globalIndex: number): SurveyJsQuestion {
  const base: SurveyJsQuestion = {
    type: typeMap[q.type],
    name: effectiveQuestionName(q, globalIndex),
    title: toLocalized(q.text),
  };

  if (q.logic?.visibleIf) base.visibleIf = q.logic.visibleIf;
  if (q.logic?.enableIf) base.enableIf = q.logic.enableIf;
  if (q.logic?.requiredIf) base.requiredIf = q.logic.requiredIf;

  if (q.type === "likert") {
    base.rateMin = 1;
    base.rateMax = 5;
    return base;
  }

  base.choices = q.choices.map((c, ci) => ({
    value: effectiveChoiceValue(c, ci),
    text: toLocalized(c.text),
  }));
  return base;
}

export interface SurveyJsMeta {
  title?: Localized;
  description?: Localized;
  triggers?: unknown[];
  calculatedValues?: unknown[];
  completedHtmlOnCondition?: unknown[];
}

export function sectionsToSurveyJson(
  sections: Section[],
  meta?: SurveyJsMeta,
): SurveyJsSchema {
  const schema: SurveyJsSchema = {
    title: meta?.title ? toLocalized(meta.title) : undefined,
    description: meta?.description ? toLocalized(meta.description) : undefined,
    showProgressBar: "top",
    pages: (() => {
      let gi = 0; // running global question index across all pages
      return sections.map((s) => ({
        name: s.id,
        title: toLocalized(s.title),
        description: toLocalized(s.description),
        elements: s.questions.map((q) => buildQuestion(q, gi++)),
      }));
    })(),
  };
  if (meta?.triggers?.length) schema.triggers = meta.triggers;
  if (meta?.calculatedValues?.length) schema.calculatedValues = meta.calculatedValues;
  if (meta?.completedHtmlOnCondition?.length) {
    schema.completedHtmlOnCondition = meta.completedHtmlOnCondition;
  }
  return schema;
}
