"use client";

// Take a test: render its QUESTION blocks (live, answer-collecting), then on
// submit compute the variables exactly as the admin preview does and store them
// in licenseTest_variables via the attempt's submit endpoint.

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchBlockLibrary,
  fetchTest,
  fetchTestBlocks,
  startAttempt,
  submitAttempt,
  type LibraryBlock,
  type TestBlockInstance,
} from "@/lib/holder-api";
import { buildSubmitEntries, computeScope, type SubmitEntry } from "@/lib/test-runtime";
import { computeMatchEntries, type MatchConfig } from "@/lib/match-runtime";
import { loadGroupItems, loadAllCharacteristicGroups } from "@/lib/dc-catalogs";
import { resolveInstanceProps } from "@/lib/question-instances";
import { ViewRenderer } from "@/lib/view-renderer";
import { AnswersProvider } from "@/lib/view-widgets-test";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { localize, type Localized } from "@/lib/localized";

export default function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const router = useRouter();
  const { locale } = useLocale();

  const [questions, setQuestions] = useState<TestBlockInstance[]>([]);
  const [library, setLibrary] = useState<LibraryBlock[]>([]);
  const [calc, setCalc] = useState<{ name: string; expr: string }[]>([]);
  const [vars, setVars] = useState<{ name: string; initial: string }[]>([]);
  const [matches, setMatches] = useState<MatchConfig[]>([]);
  const [name, setName] = useState<Localized>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [test, qs, lib, attempt] = await Promise.all([
          fetchTest(testId),
          fetchTestBlocks(testId, "QUESTION"),
          fetchBlockLibrary(),
          startAttempt(testId),
        ]);
        setName((test.name as Localized) ?? {});
        setCalc(test.advancedParams?.calc ?? []);
        setVars(test.advancedParams?.vars ?? []);
        setMatches((test.advancedParams?.matches as MatchConfig[]) ?? []);
        setQuestions(qs);
        setLibrary(lib);
        setAttemptId(attempt.id);
        setAnswers((attempt.progress as Record<string, unknown>) ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load test");
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  const libById = useMemo(() => new Map(library.map((b) => [b.id, b])), [library]);
  const resolveBlock = (inst: TestBlockInstance): LibraryBlock | undefined =>
    libById.get(inst.blockId) ?? (inst.block ? library.find((b) => b.name === inst.block!.name) : undefined);

  // Every question with a field must be answered to finish.
  const fields = useMemo(
    () => questions.map((q) => (typeof q.props.field === "string" ? q.props.field.trim() : "")).filter(Boolean),
    [questions],
  );
  const answered = fields.filter((f) => answers[f] !== undefined).length;
  const allAnswered = fields.length > 0 && answered === fields.length;

  const submit = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    setError(null);
    try {
      // Store the calc/characteristic variables + each question's answer.
      const entries = buildSubmitEntries(questions, calc, vars, answers);

      // Reference outputs: rank the configured catalog matches (e.g. professions
      // by RIASEC) and append top1..topN as reference rows (score + item id).
      if (matches.length) {
        const profile = computeScope(questions, calc, vars, answers);
        const charGroups = await loadAllCharacteristicGroups();
        const matchEntries: SubmitEntry[] = [];
        for (const m of matches) {
          const items = await loadGroupItems(m.catalogId);
          const group = charGroups.find((g) => g.id === m.groupId);
          matchEntries.push(...computeMatchEntries(m, profile, items, group));
        }
        entries.push(...matchEntries);
      }

      await submitAttempt(attemptId, { entries, progress: answers });
      // Tell home to open the results drawer (designed RESULT blocks) for this test.
      sessionStorage.setItem("tp-open-results", testId);
      router.push("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-20 text-center text-sm text-muted-foreground">Loading test…</p>;
  if (error && !questions.length) return <p className="py-20 text-center text-sm text-red-500">{error}</p>;

  return (
    <>
      <Link href="/home" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>

      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{localize(name, locale) || "Test"}</h1>
        <span className="text-sm text-muted-foreground">
          {answered} / {fields.length} answered
        </span>
      </div>

      <AnswersProvider onAnswer={(field, value) => setAnswers((a) => ({ ...a, [field]: value }))}>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const block = resolveBlock(q);
            if (!block) {
              return (
                <div key={q.id} className="rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-4 text-xs text-amber-700">
                  Q{i + 1}: block unavailable.
                </div>
              );
            }
            const types = new Map(block.props.map((p) => [p.name, p.type as never]));
            const resolved = resolveInstanceProps({ id: q.id, props: q.props }, types, {}, { locale });
            return (
              <div key={q.id}>
                <div className="mb-1 px-1 text-[0.65rem] font-semibold text-muted-foreground">Q{i + 1}</div>
                <ViewRenderer template={block.html} props={resolved} />
              </div>
            );
          })}
        </div>
      </AnswersProvider>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-6 flex justify-end">
        <Button onClick={submit} disabled={!allAnswered || submitting}>
          {submitting ? "Submitting…" : "Finish & see results"}
        </Button>
      </div>
    </>
  );
}
