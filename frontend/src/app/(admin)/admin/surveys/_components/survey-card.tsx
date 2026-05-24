"use client";

import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import type { ContentSurvey } from "../../_components/mock-data";

type SurveyListItem = Pick<ContentSurvey, "id" | "name" | "description" | "format" | "duration" | "status" | "createdAt" | "updatedAt"> & { questionCount: number };

interface Props {
  survey: SurveyListItem;
}

export function SurveyCard({ survey }: Props) {
  const { t, locale } = useLocale();
  return (
    <a
      href={`/admin/surveys/${survey.id}`}
      className="block bg-card rounded-xl border shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
          </div>
          <div>
            <h3 className="text-[0.92rem] font-semibold text-foreground group-hover:text-primary transition-colors">
              {localize(survey.name, locale)}
            </h3>
            <p className="text-[0.72rem] text-muted-foreground mt-0.5">
              {t("common.updated")} {survey.updatedAt}
            </p>
          </div>
        </div>
        <span
          className={
            "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
            (survey.status === "published"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700")
          }
        >
          {survey.status === "published" ? t("cm.status.published") : t("cm.status.draft")}
        </span>
      </div>

      <p className="text-[0.78rem] text-muted-foreground line-clamp-2 mb-3">
        {localize(survey.description, locale)}
      </p>

      <div className="flex items-center gap-3 text-[0.72rem] text-muted-foreground">
        <span>{survey.duration} {t("cm.general.durationUnit")}</span>
        <span className="w-1 h-1 rounded-full bg-muted" />
        <span>{survey.questionCount} {t("common.questions")}</span>
        <span className="w-1 h-1 rounded-full bg-muted" />
        <span>
          {survey.format === "included"
            ? t("cm.survey.formatIncluded")
            : t("cm.survey.formatSeparate")}
        </span>
        <span className="w-1 h-1 rounded-full bg-muted" />
        <span>{t("common.created")} {survey.createdAt}</span>
      </div>
    </a>
  );
}
