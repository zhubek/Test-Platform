"use client";

// Show a test's results: load the holder's completed attempt, read the stored
// variables from licenseTest_variables, re-fold the calculation to recover any
// derived (non-numeric) values, then render the test's RESULT blocks against
// that scope.

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchAttempt,
  fetchBlockLibrary,
  fetchMe,
  fetchMyTests,
  fetchTest,
  fetchTestBlocks,
  type LibraryBlock,
  type TestBlockInstance,
} from "@/lib/holder-api";
import { resultScopeFromStored } from "@/lib/test-runtime";
import { resolveInstanceProps } from "@/lib/question-instances";
import { ViewRenderer } from "@/lib/view-renderer";
import { Button } from "@/components/ui/button";

export default function ResultPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);

  const [blocks, setBlocks] = useState<TestBlockInstance[]>([]);
  const [library, setLibrary] = useState<LibraryBlock[]>([]);
  const [scope, setScope] = useState<Record<string, unknown>>({});
  const [title, setTitle] = useState("");
  const [stored, setStored] = useState<{ variable: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [test, mine, me] = await Promise.all([fetchTest(testId), fetchMyTests(), fetchMe()]);
        setTitle(test.name?.en ?? "Results");
        const attempt = mine.find((t) => t.id === testId)?.attempt;
        if (!attempt) throw new Error("No attempt found for this test yet.");
        const [full, rb, lib] = await Promise.all([
          fetchAttempt(attempt.id),
          fetchTestBlocks(testId, "RESULT"),
          fetchBlockLibrary(),
        ]);
        const vars = full.variables ?? [];
        setStored(vars);
        setScope(
          resultScopeFromStored(vars, test.advancedParams?.calc ?? [], {
            user: { name: me.name ?? me.login },
          }),
        );
        setBlocks(rb);
        setLibrary(lib);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  const libById = useMemo(() => new Map(library.map((b) => [b.id, b])), [library]);

  if (loading) return <p className="py-20 text-center text-sm text-muted-foreground">Loading results…</p>;
  if (error) return <p className="py-20 text-center text-sm text-red-500">{error}</p>;

  return (
    <>
      <Link href="/home" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">{title} — your results</h1>

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          This test has no result page configured.
        </div>
      ) : (
        <div className="space-y-5">
          {blocks.map((inst) => {
            const block = libById.get(inst.blockId) ?? (inst.block ? library.find((b) => b.name === inst.block!.name) : undefined);
            if (!block) return null;
            const types = new Map(block.props.map((p) => [p.name, p.type as never]));
            const resolved = resolveInstanceProps({ id: inst.id, props: inst.props }, types, scope);
            return <ViewRenderer key={inst.id} template={block.html} props={resolved} />;
          })}
        </div>
      )}

      {/* The raw stored variables (from licenseTest_variables) for transparency. */}
      {stored.length > 0 && (
        <details className="mt-8 rounded-lg border bg-card p-3 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">Stored variables</summary>
          <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
            {stored.map((v) => (
              <div key={v.variable} className="flex justify-between gap-2 rounded bg-muted/40 px-2 py-1">
                <code className="font-mono text-xs">{v.variable}</code>
                <span className="font-mono text-xs font-semibold tabular-nums">{v.value}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="mt-6">
        <Link href={`/home/take/${testId}`}>
          <Button variant="outline" size="sm">Retake</Button>
        </Link>
      </div>
    </>
  );
}
