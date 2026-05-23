"use client";

import { useEffect, useState } from "react";
import { Clock, ListChecks, ArrowRight } from "lucide-react";
import { fetchPublicTests, type PublicTestSummary } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { getTestIcon } from "@/lib/test-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";

export default function PublicTestsPage() {
  const { locale } = useLocale();
  const [tests, setTests] = useState<PublicTestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicTests()
      .then(setTests)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Explore tests</h1>
        <p className="mt-1 text-muted-foreground">
          Discover yourself through validated assessments.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const Icon = getTestIcon(test.icon);
            const color = test.color ?? "#6b7280";
            return (
              <Card key={test.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader>
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: color + "1a", color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 text-lg">
                    {localize(test.name, locale)}
                  </CardTitle>
                  {test.desc && (
                    <CardDescription className="line-clamp-2">
                      {localize(test.desc, locale)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {test.category && <Badge variant="secondary">{test.category}</Badge>}
                    {test.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {test.duration} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" /> {test.questionCount} questions
                    </span>
                  </div>
                  <ButtonLink className="w-full" href={`/tests/${test.id}/take`}>
                    Start test <ArrowRight className="ml-1 h-4 w-4" />
                  </ButtonLink>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
