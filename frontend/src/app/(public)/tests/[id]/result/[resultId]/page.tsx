"use client";

import { use, useEffect, useState } from "react";
import { Trophy, RotateCcw, ArrowLeft } from "lucide-react";
import {
  fetchResult,
  fetchTest,
  type ResultRecord,
  type TestRow,
} from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { getTestIcon } from "@/lib/test-icon";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { ResultBarChart, type ChartDatum } from "./_result-chart";

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string; resultId: string }>;
}) {
  const { id, resultId } = use(params);
  const { locale } = useLocale();
  const [result, setResult] = useState<ResultRecord | null>(null);
  const [test, setTest] = useState<TestRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchResult(resultId), fetchTest(Number(id))])
      .then(([r, t]) => {
        setResult(r);
        setTest(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, resultId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading result…
      </div>
    );
  }

  if (!result || !test) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Result not found.</p>
        <ButtonLink variant="link" href="/tests">
          Back to tests
        </ButtonLink>
      </div>
    );
  }

  const color = test.color ?? "#0d9488";
  const Icon = getTestIcon(test.icon);

  // Map variable id -> localized label.
  const varLabels: Record<string, string> = {};
  for (const v of test.vars?.variables ?? []) {
    varLabels[v.id] = localize(v.description, locale);
  }

  const data: ChartDatum[] = Object.entries(result.characteristics)
    .map(([key, value]) => ({ key, label: varLabels[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);

  const topLabel = result.topDimension
    ? varLabels[result.topDimension] ?? result.topDimension
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <ButtonLink variant="ghost" size="sm" className="mb-4" href="/tests">
        <ArrowLeft className="mr-1 h-4 w-4" /> All tests
      </ButtonLink>

      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: color + "1a", color }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Your result</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {localize(test.name, locale)}
          </h1>
        </div>
      </div>

      {topLabel && (
        <Card className="mb-5 border-0 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-5">
            <Trophy className="h-8 w-8" style={{ color }} />
            <div>
              <p className="text-sm text-muted-foreground">Your top dimension</p>
              <p className="text-xl font-semibold">{topLabel}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base">Your profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultBarChart data={data} color={color} topKey={result.topDimension} />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <ButtonLink href={`/tests/${test.id}/take`}>
          <RotateCcw className="mr-1 h-4 w-4" /> Retake test
        </ButtonLink>
        <ButtonLink variant="outline" href="/tests">
          Explore more tests
        </ButtonLink>
      </div>
    </div>
  );
}
