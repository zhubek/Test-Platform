"use client";

import { useCallback, useState } from "react";
import { Plus, Code2, X } from "lucide-react";
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

  // Reorder questions within a section (drag & drop). Local-state only for now;
  // a real backend would persist the new order indexes.
  const handleQuestionReorder = useCallback(
    (sIdx: number, from: number, to: number) => {
      if (from === to) return;
      onSectionsChange(
        sections.map((s, i) => {
          if (i !== sIdx) return s;
          const next = [...s.questions];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { ...s, questions: next };
        })
      );
    },
    [sections, onSectionsChange]
  );

  // Reorder whole sections (drag & drop).
  const handleSectionReorder = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const next = [...sections];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onSectionsChange(next);
    },
    [sections, onSectionsChange]
  );

  // Move a question from one section to another (cross-section drag).
  // toQi = target index within the destination section (clamped).
  const handleQuestionMove = useCallback(
    (fromSi: number, fromQi: number, toSi: number, toQi: number) => {
      if (fromSi === toSi) {
        handleQuestionReorder(fromSi, fromQi, toQi);
        return;
      }
      const moved = sections[fromSi]?.questions[fromQi];
      if (!moved) return;
      onSectionsChange(
        sections.map((s, i) => {
          if (i === fromSi) return { ...s, questions: s.questions.filter((_, j) => j !== fromQi) };
          if (i === toSi) {
            const next = [...s.questions];
            next.splice(Math.max(0, Math.min(toQi, next.length)), 0, moved);
            return { ...s, questions: next };
          }
          return s;
        })
      );
    },
    [sections, onSectionsChange, handleQuestionReorder]
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
      {/* ── Left: authoring (Constructor, with a JSON peek icon) ── */}
      <div className="rounded-xl border bg-card">
        {/* header */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="text-sm font-semibold">
            {leftMode === "json" ? "JSON schema" : "Constructor"}
          </span>
          <span className="text-[0.7rem] text-muted-foreground">
            {sections.length} section{sections.length !== 1 && "s"} ·{" "}
            {totalQuestions} question{totalQuestions !== 1 && "s"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setLeftMode(leftMode === "json" ? "blocks" : "json")}
            title={leftMode === "json" ? "Back to constructor" : "View generated JSON (advanced)"}
            className={cn("ml-auto", leftMode === "json" && "bg-muted text-foreground")}
          >
            {leftMode === "json" ? <X className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
          </Button>
        </div>

        {leftMode === "blocks" ? (
          openQ && sections[openQ.si]?.questions[openQ.qi] ? (
            <div className="h-[70vh]">
              <QuestionEditor
                question={sections[openQ.si].questions[openQ.qi]}
                globalIndex={
                  sections
                    .slice(0, openQ.si)
                    .reduce((sum, s) => sum + s.questions.length, 0) + openQ.qi
                }
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
                onQuestionReorder={handleQuestionReorder}
                onSectionReorder={handleSectionReorder}
                onQuestionMove={handleQuestionMove}
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
