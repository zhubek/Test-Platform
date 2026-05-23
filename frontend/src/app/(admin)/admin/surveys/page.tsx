"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Clock, ListChecks } from "lucide-react";
import { contentSurveyList } from "../_components/mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SurveysPage() {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = contentSurveyList;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          localize(s.name, locale).toLowerCase().includes(q) ||
          localize(s.description, locale).toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [search, statusFilter, locale]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("cm.surveys.heading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Feedback and satisfaction surveys.
          </p>
        </div>
        <ButtonLink href="/admin/surveys/new">
          <Plus className="mr-1 h-4 w-4" />
          {t("cm.surveys.create")}
        </ButtonLink>
      </div>

      <div className="mb-5 flex flex-wrap gap-2.5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cm.filters.searchSurveys")}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          {t("cm.filters.noResults")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((survey) => (
            <Link key={survey.id} href={`/admin/surveys/${survey.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">{survey.format}</Badge>
                    <Badge
                      variant={survey.status === "published" ? "default" : "secondary"}
                    >
                      {survey.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-base">
                    {localize(survey.name, locale)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {localize(survey.description, locale)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {survey.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" /> {survey.questionCount}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
