"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { SurveyCard } from "./_components/survey-card";
import { contentSurveyList } from "../_components/mock-data";
import { ListFilters } from "../_components/list-filters";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

export default function SurveysPage() {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let list = contentSurveyList;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          localize(s.name, locale).toLowerCase().includes(q) ||
          localize(s.description, locale).toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (dateFrom) list = list.filter((s) => s.createdAt >= dateFrom);
    if (dateTo) list = list.filter((s) => s.createdAt <= dateTo);
    return list;
  }, [search, statusFilter, dateFrom, dateTo, locale]);

  return (
    <>
      <div className="animate-fade-in flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {t("cm.surveys.heading")}
        </h1>
        <a
          href="/admin/surveys/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[0.82rem] font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("cm.surveys.create")}
        </a>
      </div>

      <ListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("cm.filters.searchSurveys")}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilters={[
          {
            label: t("common.created"),
            from: dateFrom,
            to: dateTo,
            onFromChange: setDateFrom,
            onToChange: setDateTo,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((survey, i) => (
          <div
            key={survey.id}
            className="animate-stagger-fade-up"
            style={{ "--stagger-index": i } as React.CSSProperties}
          >
            <SurveyCard survey={survey} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-sm text-gray-400">
            {t("cm.filters.noResults")}
          </div>
        )}
      </div>
    </>
  );
}
