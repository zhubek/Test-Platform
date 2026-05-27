"use client";

import { useState, useEffect } from "react";
import { Save, Eye } from "lucide-react";
import { syncCharacteristics } from "@/lib/characteristics-sync";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { TabBar, type TabId } from "./tab-bar";
import { GeneralTab } from "./general-tab";
import { QuestionsTab } from "./questions-tab";
import { CalculationTab } from "./calculation-tab";
import { WidgetConstructorTab } from "./widget-constructor-tab";
import { ResultViewTab } from "./result-view-tab";
import { StatusToggle } from "../../../_components/status-toggle";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import type {
  ContentTest,
  Section,
  Variable,
  CatalogMapping,
  CharacteristicSection,
  ResultPage,
  Widget,
  TestIconKey,
  SurveyLogic,
} from "../../../_components/mock-data";
import type { VisibilityRule } from "@/lib/visibility-rule";

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
  const [visibilityTags, setVisibilityTags] = useState<string[]>(
    initialData.visibilityTags ?? [],
  );
  const [visibilityRule, setVisibilityRule] = useState<VisibilityRule>(
    initialData.visibilityRule ?? { combinator: "all", items: [] },
  );
  const [duration, setDuration] = useState(initialData.duration);
  const [status, setStatus] = useState(initialData.status);
  const [characteristicSections, setCharacteristicSections] = useState<CharacteristicSection[]>(
    initialData.characteristicSections
  );
  const [sections, setSections] = useState<Section[]>(initialData.sections);
  const [mappings, setMappings] = useState<CatalogMapping[]>(initialData.mappings);
  const [variables, setVariables] = useState<Variable[]>(initialData.variables);
  const [surveyLogic, setSurveyLogic] = useState<SurveyLogic>(initialData.surveyLogic ?? {});
  const [resultPages, setResultPages] = useState<ResultPage[]>(initialData.resultPages ?? []);
  const [resultWidgets, setResultWidgets] = useState<Widget[]>(initialData.resultWidgets);
  const [dashboardWidgets, setDashboardWidgets] = useState<Widget[]>(initialData.orgDashboardWidgets);

  // Keep characteristic variables in sync with the mappings, regardless of which
  // tab is open (so Result View etc. always see them).
  useEffect(() => {
    const next = syncCharacteristics(mappings, variables);
    if (next) setVariables(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings]);

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
                visibilityTags,
                visibilityRule,
                duration,
                state: status,
                vars: { variables },
                calcLogic: { characteristicSections, mappings },
                surveyLogic,
                resultViewLogic: { widgets: resultWidgets, pages: resultPages },
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
          visibilityTags={visibilityTags}
          visibilityRule={visibilityRule}
          duration={duration}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onColorChange={setColor}
          onIconChange={setIcon}
          onCategoryChange={setCategory}
          onVisibilityTagsChange={setVisibilityTags}
          onVisibilityRuleChange={setVisibilityRule}
          onDurationChange={setDuration}
        />
      )}

      {tab === "questions" && (
        <QuestionsTab
          testId={testId}
          sections={sections}
          variables={variables}
          onSectionsChange={setSections}
          surveyLogic={surveyLogic}
          onSurveyLogicChange={setSurveyLogic}
        />
      )}

      {tab === "calculation" && (
        <CalculationTab
          mappings={mappings}
          sections={characteristicSections}
          questionSections={sections}
          surveyLogic={surveyLogic}
          variables={variables}
          onMappingsChange={setMappings}
          onSectionsChange={setCharacteristicSections}
          onVariablesChange={setVariables}
        />
      )}

      {tab === "result" && (
        <ResultViewTab
          pages={resultPages}
          variables={variables}
          mappings={mappings}
          onChange={setResultPages}
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
