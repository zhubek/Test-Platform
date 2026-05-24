"use client";

import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../../../tests/[id]/_components/section-card";
import type { Section } from "../../../_components/mock-data";

interface Props {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
}

export function SurveyQuestionsTab({ sections, onSectionsChange }: Props) {
  const { t } = useLocale();

  const handleSectionUpdate = (sIdx: number, partial: Partial<Section>) => {
    onSectionsChange(
      sections.map((s, i) => (i === sIdx ? { ...s, ...partial } : s))
    );
  };

  const handleSectionDelete = (sIdx: number) => {
    onSectionsChange(sections.filter((_, i) => i !== sIdx));
  };

  const handleSectionAdd = () => {
    const newSection: Section = {
      id: `sec${Date.now()}`,
      title: { en: "", ru: "", kz: "" },
      description: { en: "", ru: "", kz: "" },
      questions: [],
    };
    onSectionsChange([...sections, newSection]);
  };

  const totalQuestions = sections.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );

  return (
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
          variables={[]}
          onChange={(partial) => handleSectionUpdate(si, partial)}
          onDelete={() => handleSectionDelete(si)}
        />
      ))}

      <Button
        variant="outline"
        onClick={handleSectionAdd}
        className="w-full h-auto rounded-xl border-2 border-dashed py-4 text-[0.82rem] text-muted-foreground hover:border-primary/30 hover:text-primary"
      >
        <Plus className="w-4 h-4" />
        {t("cm.questions.addSection")}
      </Button>
    </div>
  );
}
