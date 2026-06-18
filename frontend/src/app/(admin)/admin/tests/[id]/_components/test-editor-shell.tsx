"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { TabBar, type TabId } from "./tab-bar";
import { GeneralTab } from "./general-tab";
import { BlocksQuestionsTab } from "./blocks-questions-tab";
import { CalculationTab } from "./calculation-tab";
import { ResultViewTab } from "./result-view-tab";
import { DashboardTab } from "./dashboard-tab";
import { StatusToggle } from "../../../_components/status-toggle";
import { Button } from "@/components/ui/button";
import type {
  ContentTest,
  Section,
  Variable,
  TestIconKey,
  SurveyLogic,
} from "../../../_components/mock-data";
import type { VisibilityRule } from "@/lib/visibility-rule";

interface Props {
  initialData: ContentTest;
  testId?: string;
  onSave?: (patch: Record<string, any>) => Promise<void>;
}

export function TestEditorShell({ initialData, testId, onSave }: Props) {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<TabId>("general");
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [color, setColor] = useState(initialData.color);
  const [icon, setIcon] = useState<TestIconKey>(initialData.icon);
  const [category, setCategory] = useState(initialData.category);
  const [visibilityRule, setVisibilityRule] = useState<VisibilityRule>(
    initialData.visibilityRule ?? { combinator: "all", items: [] },
  );
  const [duration, setDuration] = useState(initialData.duration);
  const [status, setStatus] = useState(initialData.status);
  const [sections, setSections] = useState<Section[]>(initialData.sections);
  const [variables] = useState<Variable[]>(initialData.variables);
  const [surveyLogic, setSurveyLogic] = useState<SurveyLogic>(initialData.surveyLogic ?? {});

  return (
    <>
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: color + "20" }}
          >
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {localize(name, locale) || t("cm.testEditor.untitled")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusToggle status={status} onChange={setStatus} />
          <Button
            size="sm"
            onClick={() => {
              if (!onSave) return;
              onSave({
                name,
                desc: description,
                color,
                icon,
                category,
                visibilityRule,
                duration,
                state: status,
                vars: { variables },
                surveyLogic,
              });
            }}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            {t("cm.testEditor.save")}
          </Button>
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "general" && (
        <GeneralTab
          name={name}
          description={description}
          color={color}
          icon={icon}
          category={category}
          visibilityRule={visibilityRule}
          duration={duration}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onColorChange={setColor}
          onIconChange={setIcon}
          onCategoryChange={setCategory}
          onVisibilityRuleChange={setVisibilityRule}
          onDurationChange={setDuration}
        />
      )}

      {tab === "blocks" && <BlocksQuestionsTab testId={testId} />}

      {tab === "calculation" && <CalculationTab testId={testId} />}

      {tab === "result" && <ResultViewTab testId={testId} />}

      {tab === "dashboard" && <DashboardTab />}
    </>
  );
}
