"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Clock, ListChecks } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { getTestIcon } from "@/lib/test-icon";
import { fetchTests, createTest, type TestRow } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TestsPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests()
      .then(setTests)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = tests;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const name = localize(t.name, locale);
        const desc = t.desc ? localize(t.desc, locale) : "";
        return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      });
    }
    if (statusFilter !== "all") list = list.filter((t) => t.state === statusFilter);
    return list;
  }, [tests, search, statusFilter, locale]);

  async function handleAdd() {
    const created = await createTest({
      name: { en: "Untitled test", ru: "", kz: "" },
      state: "draft",
    });
    router.push(`/admin/tests/${created.id}`);
  }

  const questionCount = (t: TestRow) =>
    (t.sections ?? []).reduce((n, s) => n + s.questions.length, 0);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("cm.tests.heading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Build and manage assessments.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          {t("cm.tests.create")}
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2.5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cm.filters.searchTests")}
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          {t("cm.filters.noResults")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((test) => {
            const Icon = getTestIcon(test.icon);
            const color = test.color ?? "#6b7280";
            return (
              <Link key={test.id} href={`/admin/tests/${test.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ background: color + "1a", color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge
                        variant={test.state === "published" ? "default" : "secondary"}
                      >
                        {test.state}
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 text-base">
                      {localize(test.name, locale) || "—"}
                    </CardTitle>
                    {test.desc && (
                      <CardDescription className="line-clamp-2">
                        {localize(test.desc, locale)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {test.category && <Badge variant="outline">{test.category}</Badge>}
                    {test.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {test.duration} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" /> {questionCount(test)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
