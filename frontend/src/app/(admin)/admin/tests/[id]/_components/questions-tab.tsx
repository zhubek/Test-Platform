"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SurveyLogicPanel } from "./survey-logic-panel";
import { JsonView } from "./json-view";
import { SurveyPreview } from "./preview/survey-preview";
import { BlocksList } from "./blocks-list";
import { QuestionEditor } from "./question-editor";
import { localize } from "@/lib/localized";
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
  const [leftMode, setLeftMode] = useState<"blocks" | "json">("blocks");
  const [activeSection, setActiveSection] = useState(0);
  // Drill-in: which question is open in the editor (null = list view)
  const [openQ, setOpenQ] = useState<{ si: number; qi: number } | null>(null);

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
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── Left: authoring (Blocks | JSON) ── */}
      <div className="rounded-xl border bg-card">
        {/* sub-tabs */}
        <div className="flex items-center gap-1 border-b px-3 py-2">
          {(["blocks", "json"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setLeftMode(m)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                leftMode === m
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "blocks" ? "Blocks" : "JSON"}
            </button>
          ))}
          <span className="ml-auto text-[0.7rem] text-muted-foreground">
            {sections.length} section{sections.length !== 1 && "s"} ·{" "}
            {totalQuestions} question{totalQuestions !== 1 && "s"}
          </span>
        </div>

        {leftMode === "blocks" ? (
          openQ && sections[openQ.si]?.questions[openQ.qi] ? (
            <div className="h-[70vh]">
              <QuestionEditor
                question={sections[openQ.si].questions[openQ.qi]}
                pageTitle={localize(sections[openQ.si].title, "en") || `Page ${openQ.si + 1}`}
                onBack={() => setOpenQ(null)}
                onQuestionUpdate={(partial) => handleQuestionUpdate(openQ.si, openQ.qi, partial)}
                onChoiceAdd={() => handleChoiceAdd(openQ.si, openQ.qi)}
                onChoiceUpdate={(cIdx, partial) => handleChoiceUpdate(openQ.si, openQ.qi, cIdx, partial)}
                onChoiceDelete={(cIdx) => handleChoiceDelete(openQ.si, openQ.qi, cIdx)}
              />
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-4 overflow-auto p-4">
              {onSurveyLogicChange && (
                <SurveyLogicPanel value={surveyLogic ?? {}} onChange={onSurveyLogicChange} />
              )}
              <BlocksList
                sections={sections}
                onSectionUpdate={(si, partial) => handleSectionUpdate(si, partial)}
                onSectionDelete={(si) => handleSectionDelete(si)}
                onSectionAdd={handleSectionAdd}
                onQuestionAdd={(si) => handleQuestionAdd(si)}
                onQuestionUpdate={(si, qi, partial) => handleQuestionUpdate(si, qi, partial)}
                onQuestionDelete={(si, qi) => handleQuestionDelete(si, qi)}
                onOpenQuestion={(si, qi) => {
                  setActiveSection(si);
                  setOpenQ({ si, qi });
                }}
                activePage={activeSection}
                onActivePageChange={setActiveSection}
              />
            </div>
          )
        ) : (
          <div className="h-[70vh]">
            <JsonView sections={sections} />
          </div>
        )}
      </div>

      {/* ── Right: live preview ── */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">
          Live preview
        </div>
        <div className="max-h-[70vh] overflow-auto p-5">
          <SurveyPreview
            sections={sections}
            activeSectionIndex={activeSection}
            onActiveSectionChange={setActiveSection}
          />
        </div>
      </div>
    </div>
  );
}
