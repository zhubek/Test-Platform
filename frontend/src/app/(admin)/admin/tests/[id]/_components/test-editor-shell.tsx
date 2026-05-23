"use client";

import { useState, useEffect } from "react";
import { Save, Eye } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { TabBar, type TabId } from "./tab-bar";
import { GeneralTab } from "./general-tab";
import { QuestionsTab } from "./questions-tab";
import { CalculationTab } from "./calculation-tab";
import { WidgetConstructorTab } from "./widget-constructor-tab";
import { StatusToggle } from "../../../_components/status-toggle";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import type {
  ContentTest,
  Section,
  Variable,
  CharacteristicSection,
  Widget,
  TestIconKey,
  TestFormat,
  SurveyLogic,
} from "../../../_components/mock-data";

interface Props {
  initialData: ContentTest;
  testId?: number;
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
  const [format, setFormat] = useState<TestFormat>(initialData.format);
  const [duration, setDuration] = useState(initialData.duration);
  const [status, setStatus] = useState(initialData.status);
  const [characteristicSections, setCharacteristicSections] = useState<CharacteristicSection[]>(
    initialData.characteristicSections
  );
  const [sections, setSections] = useState<Section[]>(initialData.sections);
  const [variables, setVariables] = useState<Variable[]>(initialData.variables);
  const [surveyLogic, setSurveyLogic] = useState<SurveyLogic>({});

  // Mirror unsaved logic (survey-level + per-question) to sessionStorage so
  // the Preview route can read it until backend persistence is wired up.
  useEffect(() => {
    if (!testId) return;
    const key = `profwise-test-logic-${testId}`;
    const payload = {
      surveyLogic,
      perQuestion: sections.flatMap((s) =>
        s.questions
          .filter((q) => q.logic && (q.logic.visibleIf || q.logic.enableIf || q.logic.requiredIf))
          .map((q) => ({ id: q.id, logic: q.logic })),
      ),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }, [testId, sections, surveyLogic]);
  const [resultWidgets, setResultWidgets] = useState<Widget[]>(initialData.resultWidgets);
  const [dashboardWidgets, setDashboardWidgets] = useState<Widget[]>(initialData.orgDashboardWidgets);

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
          {testId && (
            <ButtonLink
              variant="outline"
              size="sm"
              href={`/admin/tests/${testId}/preview`}
              target="_blank"
              rel="noreferrer"
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Preview
            </ButtonLink>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (!onSave) return;
              onSave({
                name,
                desc: description,
                color,
                icon,
                category: typeof category === "object" ? (category as any).en || "" : category,
                duration,
                state: status,
                vars: { variables },
                calcLogic: { characteristicSections },
                resultViewLogic: { widgets: resultWidgets },
                dashboardViewLogic: { widgets: dashboardWidgets },
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
          format={format}
          duration={duration}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onColorChange={setColor}
          onIconChange={setIcon}
          onCategoryChange={setCategory}
          onFormatChange={setFormat}
          onDurationChange={setDuration}
        />
      )}

      {tab === "questions" && (
        <QuestionsTab
          testId={testId}
          sections={sections}
          variables={variables}
          onSectionsChange={setSections}
          onVariablesChange={setVariables}
          surveyLogic={surveyLogic}
          onSurveyLogicChange={setSurveyLogic}
        />
      )}

      {tab === "calculation" && (
        <CalculationTab
          sections={characteristicSections}
          variables={variables}
          onSectionsChange={setCharacteristicSections}
        />
      )}

      {tab === "results" && (
        <WidgetConstructorTab
          heading={t("cm.results.heading")}
          subheading={t("cm.results.sub")}
          widgets={resultWidgets}
          onChange={setResultWidgets}
        />
      )}

      {tab === "dashboard" && (
        <WidgetConstructorTab
          heading={t("cm.dashboard.heading")}
          subheading={t("cm.dashboard.sub")}
          widgets={dashboardWidgets}
          onChange={setDashboardWidgets}
        />
      )}
    </>
  );
}
