"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { fetchTest, type TestRow } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { ButtonLink } from "@/components/button-link";

const TakeRunner = dynamic(
  () => import("./_take-runner").then((m) => m.TakeRunner),
  {
    ssr: false,
    loading: () => (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading test…
      </div>
    ),
  },
);

export default function TakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locale } = useLocale();
  const [test, setTest] = useState<TestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchTest(Number(id))
      .then(setTest)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (notFound || !test) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Test not found.</p>
        <ButtonLink variant="link" href="/tests">
          Back to tests
        </ButtonLink>
      </div>
    );
  }

  const hasQuestions = (test.sections ?? []).some((s) => s.questions.length > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <ButtonLink variant="ghost" size="sm" className="mb-4" href="/tests">
        <ArrowLeft className="mr-1 h-4 w-4" /> All tests
      </ButtonLink>

      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        {localize(test.name, locale)}
      </h1>
      {test.desc && (
        <p className="mb-6 text-muted-foreground">{localize(test.desc, locale)}</p>
      )}

      {hasQuestions ? (
        <TakeRunner test={test} locale={locale} />
      ) : (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          This test has no questions yet.
        </div>
      )}
    </div>
  );
}
