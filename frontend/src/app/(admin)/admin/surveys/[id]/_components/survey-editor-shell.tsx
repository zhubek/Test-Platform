"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { SurveyTabBar, type SurveyTabId } from "./survey-tab-bar";
import { SurveyGeneralTab } from "./survey-general-tab";
import { SurveyQuestionsTab } from "./survey-questions-tab";
import { WidgetConstructorTab } from "../../../tests/[id]/_components/widget-constructor-tab";
import { StatusToggle } from "../../../_components/status-toggle";
import type {
  ContentSurvey,
  Section,
  Widget,
  SurveyFormat,
} from "../../../_components/mock-data";

const SURVEY_DEFAULT_SQL = "SELECT q.text AS question, c.text AS answer, COUNT(*) AS count FROM answers a JOIN choices c ON c.id = a.choice_id JOIN questions q ON q.id = c.question_id WHERE a.survey_id = :survey_id GROUP BY q.text, c.text ORDER BY q.text, count DESC";

interface Props {
  initialData: ContentSurvey;
}

export function SurveyEditorShell({ initialData }: Props) {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<SurveyTabId>("general");
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [format, setFormat] = useState<SurveyFormat>(initialData.format);
  const [duration, setDuration] = useState(initialData.duration);
  const [status, setStatus] = useState(initialData.status);
  const [sections, setSections] = useState<Section[]>(initialData.sections);
  const [orgDashboardWidgets, setOrgDashboardWidgets] = useState<Widget[]>(initialData.orgDashboardWidgets);
  const [regionDashboardWidgets, setRegionDashboardWidgets] = useState<Widget[]>(initialData.regionDashboardWidgets);

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          </div>
          <span className="text-[0.82rem] font-medium text-gray-500">
            {localize(name, locale) || t("cm.surveyEditor.untitled")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusToggle status={status} onChange={setStatus} />
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[0.82rem] font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors">
            <Save className="w-3.5 h-3.5" />
            {t("cm.testEditor.save")}
          </button>
        </div>
      </div>

      <SurveyTabBar active={tab} onChange={setTab} />

      {tab === "general" && (
        <SurveyGeneralTab
          name={name}
          description={description}
          format={format}
          duration={duration}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onFormatChange={setFormat}
          onDurationChange={setDuration}
        />
      )}

      {tab === "questions" && (
        <SurveyQuestionsTab
          sections={sections}
          onSectionsChange={setSections}
        />
      )}

      {tab === "dashboard_org" && (
        <WidgetConstructorTab
          heading={t("cm.dashboardOrg.heading")}
          subheading={t("cm.dashboardOrg.sub")}
          widgets={orgDashboardWidgets}
          onChange={setOrgDashboardWidgets}
          defaultSql={SURVEY_DEFAULT_SQL}
        />
      )}

      {tab === "dashboard_region" && (
        <WidgetConstructorTab
          heading={t("cm.dashboardRegion.heading")}
          subheading={t("cm.dashboardRegion.sub")}
          widgets={regionDashboardWidgets}
          onChange={setRegionDashboardWidgets}
          defaultSql={SURVEY_DEFAULT_SQL}
        />
      )}
    </>
  );
}
