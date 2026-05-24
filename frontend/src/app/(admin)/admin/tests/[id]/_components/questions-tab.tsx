"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";
import { SurveyLogicPanel } from "./survey-logic-panel";
import type { Section, Question, AnswerChoice, Variable, SurveyLogic } from "../../../_components/mock-data";
import type { Localized } from "@/lib/localized";
import {
  createSection,
  updateSection,
  deleteSection,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
} from "@/lib/api";

interface Props {
  testId?: number;
  sections: Section[];
  variables: Variable[];
  onSectionsChange: (sections: Section[]) => void;
  surveyLogic?: SurveyLogic;
  onSurveyLogicChange?: (next: SurveyLogic) => void;
}

export function QuestionsTab({
  testId,
  sections,
  variables,
  onSectionsChange,
  surveyLogic,
  onSurveyLogicChange,
}: Props) {
  const { t } = useLocale();

  // ── Section CRUD ─────────────────────────────────────────────

  const handleSectionAdd = useCallback(async () => {
    if (!testId) {
      // Local-only mode (new test not yet saved)
      const newSection: Section = {
        id: `sec${Date.now()}`,
        title: { en: "", ru: "", kz: "" },
        description: { en: "", ru: "", kz: "" },
        questions: [],
      };
      onSectionsChange([...sections, newSection]);
      return;
    }
    try {
      const created = await createSection({
        title: { en: "", ru: "", kz: "" },
        testId,
        order: sections.length,
      });
      const newSection: Section = {
        id: String(created.id),
        title: created.title,
        description: { en: "", ru: "", kz: "" },
        questions: [],
      };
      onSectionsChange([...sections, newSection]);
    } catch (err) {
      console.error("Failed to create section:", err);
    }
  }, [testId, sections, onSectionsChange]);

  const handleSectionUpdate = useCallback(
    async (sIdx: number, partial: Partial<Section>) => {
      const section = sections[sIdx];
      // Update local state immediately
      onSectionsChange(
        sections.map((s, i) => (i === sIdx ? { ...s, ...partial } : s))
      );
      // Persist title changes to API
      if (partial.title) {
        try {
          await updateSection(Number(section.id), { title: partial.title });
        } catch (err) {
          console.error("Failed to update section:", err);
        }
      }
    },
    [sections, onSectionsChange]
  );

  const handleSectionDelete = useCallback(
    async (sIdx: number) => {
      const section = sections[sIdx];
      try {
        await deleteSection(Number(section.id));
        onSectionsChange(sections.filter((_, i) => i !== sIdx));
      } catch (err) {
        console.error("Failed to delete section:", err);
      }
    },
    [sections, onSectionsChange]
  );

  // ── Question CRUD ────────────────────────────────────────────

  const handleQuestionAdd = useCallback(
    async (sIdx: number) => {
      const section = sections[sIdx];
      try {
        const created = await createQuestion({
          text: { en: "", ru: "", kz: "" },
          sectionId: Number(section.id),
          order: section.questions.length,
          type: "single",
        });
        const newQ: Question = {
          id: String(created.id),
          text: created.text,
          type: (created.type as any) ?? "single",
          choices: [],
        };
        onSectionsChange(
          sections.map((s, i) =>
            i === sIdx ? { ...s, questions: [...s.questions, newQ] } : s
          )
        );
      } catch (err) {
        console.error("Failed to create question:", err);
      }
    },
    [sections, onSectionsChange]
  );

  const handleQuestionUpdate = useCallback(
    async (sIdx: number, qIdx: number, partial: Partial<Question>) => {
      const question = sections[sIdx].questions[qIdx];
      // Update local state immediately
      onSectionsChange(
        sections.map((s, i) =>
          i === sIdx
            ? {
                ...s,
                questions: s.questions.map((q, j) =>
                  j === qIdx ? { ...q, ...partial } : q
                ),
              }
            : s
        )
      );
      // Persist text/type changes to API
      const apiPatch: Record<string, any> = {};
      if (partial.text) apiPatch.text = partial.text;
      if (partial.type) apiPatch.type = partial.type;
      if (Object.keys(apiPatch).length > 0) {
        try {
          await updateQuestion(Number(question.id), apiPatch);
        } catch (err) {
          console.error("Failed to update question:", err);
        }
      }
    },
    [sections, onSectionsChange]
  );

  const handleQuestionDelete = useCallback(
    async (sIdx: number, qIdx: number) => {
      const question = sections[sIdx].questions[qIdx];
      try {
        await deleteQuestion(Number(question.id));
        onSectionsChange(
          sections.map((s, i) =>
            i === sIdx
              ? { ...s, questions: s.questions.filter((_, j) => j !== qIdx) }
              : s
          )
        );
      } catch (err) {
        console.error("Failed to delete question:", err);
      }
    },
    [sections, onSectionsChange]
  );

  // ── Answer (Choice) CRUD ─────────────────────────────────────

  const handleChoiceAdd = useCallback(
    async (sIdx: number, qIdx: number) => {
      const question = sections[sIdx].questions[qIdx];
      try {
        const created = await createAnswer({
          text: { en: "", ru: "", kz: "" },
          questionId: Number(question.id),
        });
        const newChoice: AnswerChoice = {
          id: String(created.id),
          text: created.text,
          variables: Array.isArray(created.vars) ? created.vars : [],
        };
        onSectionsChange(
          sections.map((s, i) =>
            i === sIdx
              ? {
                  ...s,
                  questions: s.questions.map((q, j) =>
                    j === qIdx ? { ...q, choices: [...q.choices, newChoice] } : q
                  ),
                }
              : s
          )
        );
      } catch (err) {
        console.error("Failed to create answer:", err);
      }
    },
    [sections, onSectionsChange]
  );

  const handleChoiceUpdate = useCallback(
    async (sIdx: number, qIdx: number, cIdx: number, partial: Partial<AnswerChoice>) => {
      const choice = sections[sIdx].questions[qIdx].choices[cIdx];
      // Update local state immediately
      onSectionsChange(
        sections.map((s, i) =>
          i === sIdx
            ? {
                ...s,
                questions: s.questions.map((q, j) =>
                  j === qIdx
                    ? {
                        ...q,
                        choices: q.choices.map((c, k) =>
                          k === cIdx ? { ...c, ...partial } : c
                        ),
                      }
                    : q
                ),
              }
            : s
        )
      );
      // Persist to API
      const apiPatch: Record<string, any> = {};
      if (partial.text) apiPatch.text = partial.text;
      if (partial.variables !== undefined) apiPatch.vars = partial.variables;
      if (Object.keys(apiPatch).length > 0) {
        try {
          await updateAnswer(Number(choice.id), apiPatch);
        } catch (err) {
          console.error("Failed to update answer:", err);
        }
      }
    },
    [sections, onSectionsChange]
  );

  const handleChoiceDelete = useCallback(
    async (sIdx: number, qIdx: number, cIdx: number) => {
      const choice = sections[sIdx].questions[qIdx].choices[cIdx];
      try {
        await deleteAnswer(Number(choice.id));
        onSectionsChange(
          sections.map((s, i) =>
            i === sIdx
              ? {
                  ...s,
                  questions: s.questions.map((q, j) =>
                    j === qIdx
                      ? { ...q, choices: q.choices.filter((_, k) => k !== cIdx) }
                      : q
                  ),
                }
              : s
          )
        );
      } catch (err) {
        console.error("Failed to delete answer:", err);
      }
    },
    [sections, onSectionsChange]
  );

  const totalQuestions = sections.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Survey-level Logic (JSON) */}
      {onSurveyLogicChange && (
        <SurveyLogicPanel
          value={surveyLogic ?? {}}
          onChange={onSurveyLogicChange}
        />
      )}

      {/* Sections & Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[0.88rem] font-semibold text-foreground">
              {t("cm.questions.heading")}
            </h3>
            <p className="text-[0.75rem] text-muted-foreground mt-0.5">
              {sections.length} section{sections.length !== 1 && "s"},{" "}
              {totalQuestions} question{totalQuestions !== 1 && "s"}
            </p>
          </div>
        </div>

        {sections.map((section, si) => (
          <SectionCard
            key={section.id}
            section={section}
            sectionIndex={si}
            variables={variables}
            onSectionUpdate={(partial) => handleSectionUpdate(si, partial)}
            onSectionDelete={() => handleSectionDelete(si)}
            onQuestionAdd={() => handleQuestionAdd(si)}
            onQuestionUpdate={(qIdx, partial) => handleQuestionUpdate(si, qIdx, partial)}
            onQuestionDelete={(qIdx) => handleQuestionDelete(si, qIdx)}
            onChoiceAdd={(qIdx) => handleChoiceAdd(si, qIdx)}
            onChoiceUpdate={(qIdx, cIdx, partial) => handleChoiceUpdate(si, qIdx, cIdx, partial)}
            onChoiceDelete={(qIdx, cIdx) => handleChoiceDelete(si, qIdx, cIdx)}
          />
        ))}

        <Button
          variant="outline"
          onClick={handleSectionAdd}
          className="w-full rounded-xl border-2 border-dashed py-4 h-auto text-muted-foreground hover:border-teal-300 hover:text-primary"
        >
          <Plus className="w-4 h-4" />
          {t("cm.questions.addSection")}
        </Button>
      </div>
    </div>
  );
}
