import type { Section, Question, QuestionType, AnswerChoice } from "@/app/(admin)/admin/_components/mock-data";
import type { Localized } from "@/lib/localized";

export interface SurveyJsLocalized {
  default?: string;
  en?: string;
  ru?: string;
  kk?: string;
}

export interface SurveyJsChoice {
  value: number;
  text: SurveyJsLocalized;
  imageLink?: string;
  visibleIf?: string;
}

export interface SurveyJsQuestion {
  type: "radiogroup" | "checkbox" | "rating" | "dropdown" | "boolean" | "imagepicker";
  name: string;
  title: SurveyJsLocalized;
  isRequired?: boolean;
  choices?: SurveyJsChoice[];
  // SurveyJS choice sort order. "random" shuffles the options per respondent.
  choicesOrder?: "none" | "asc" | "desc" | "random";
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
  visibleIf?: string;
  // SurveyJS question sort order for this page. "random" shuffles the page's
  // questions per respondent. (Current property name; `questionsOrder` is the
  // deprecated alias.)
  questionOrder?: "initial" | "random";
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
  // likert/rating are single-choice over a fixed numeric scale; modeled as
  // radiogroups with explicit numeric-valued choices so logic/formulas resolve
  // the same way as any other choice question.
  likert: "radiogroup",
  dropdown: "dropdown",
  rating: "radiogroup",
  boolean: "boolean",
  imagepicker: "imagepicker",
};

function toLocalized(v: Localized): SurveyJsLocalized {
  return {
    default: v.en || v.ru || v.kk || "",
    en: v.en,
    ru: v.ru,
    kk: v.kk,
  };
}

// Effective (referenceable) name for a question. If the author left it
// blank, fall back to q{globalIndex+1} — numbered across the whole test.
export function effectiveQuestionName(q: Question, globalIndex: number): string {
  return q.name?.trim() || `q${globalIndex + 1}`;
}

// Effective numeric value for a choice. Blank → 1-based position within its
// question. All answer values are numbers; text labels are resolved at view time.
export function effectiveChoiceValue(c: AnswerChoice, index: number): number {
  return typeof c.value === "number" && !Number.isNaN(c.value) ? c.value : index + 1;
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

  // Boolean — yes/no, no choices.
  if (q.type === "boolean") {
    return base;
  }

  // Choice-based types (single / multiple / dropdown / imagepicker / likert / rating).
  base.choices = q.choices.map((c, ci) => {
    const choice: SurveyJsChoice = {
      value: effectiveChoiceValue(c, ci),
      text: toLocalized(c.text),
    };
    if (q.type === "imagepicker" && c.imageUrl?.trim()) choice.imageLink = c.imageUrl;
    if (c.visibleIf?.trim()) choice.visibleIf = c.visibleIf;
    return choice;
  });
  // Shuffle answer options at runtime when requested.
  if (q.randomizeChoices) base.choicesOrder = "random";
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
      return sections.map((s) => {
        const page: SurveyJsPage = {
          name: s.id,
          title: toLocalized(s.title),
          description: toLocalized(s.description),
          elements: s.questions.map((q) => buildQuestion(q, gi++)),
        };
        if (s.visibleIf?.trim()) page.visibleIf = s.visibleIf;
        // Shuffle this page's questions at runtime when requested.
        if (s.randomizeQuestions) page.questionOrder = "random";
        return page;
      });
    })(),
  };
  if (meta?.triggers?.length) schema.triggers = meta.triggers;
  if (meta?.calculatedValues?.length) schema.calculatedValues = meta.calculatedValues;
  if (meta?.completedHtmlOnCondition?.length) {
    schema.completedHtmlOnCondition = meta.completedHtmlOnCondition;
  }
  return schema;
}
