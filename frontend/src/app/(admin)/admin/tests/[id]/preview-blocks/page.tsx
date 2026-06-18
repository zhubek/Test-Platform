"use client";

// Preview runner for the block-based questions constructor. Runs the LOCAL
// DRAFT (same browser, saved by the Questions tab): renders each question
// block, captures answers, executes "after answered" operations in document
// order against the declared variables, and re-evaluates visible-if live —
// answer something and watch dependent questions appear. The variables panel
// on the right shows the state the way the runtime will compute it.

import { use, useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { fetchBlocks, type Block } from "@/lib/backend";
import { ViewRenderer } from "@/lib/view-renderer";
import { AnswersProvider } from "@/lib/view-widgets-test";
import { evaluate } from "@/lib/view-expr";
import { TEST_SAMPLE_CONTEXT } from "@/lib/mock-sources";
import {
  applyVarDefaults,
  loadDraft,
  resolveBlockRef,
  resolveInstanceProps,
  type QuestionsDraft,
} from "@/lib/question-instances";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";

export default function PreviewBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale } = useLocale();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [draft, setDraft] = useState<QuestionsDraft | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  // Remount key — resetting answers also needs to clear the widgets' internal
  // selection state, which lives inside the rendered blocks.
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    fetchBlocks("TEST").then(setBlocks).catch((e) => console.error("Failed to load blocks:", e));
    setDraft(loadDraft(id));
  }, [id]);

  // The runtime fold: start from initial variable values, walk questions in
  // order, apply each ANSWERED question's operations, and decide visibility as
  // we go. Recomputed from scratch on every answer change, so operations never
  // double-apply.
  const { scope, visible } = useMemo(() => {
    const scope: Record<string, unknown> = { ...TEST_SAMPLE_CONTEXT };
    const visible = new Set<string>();
    if (!draft) return { scope, visible };
    applyVarDefaults(scope, draft.vars, draft.items);
    for (const it of draft.items) {
      const shown = !it.visibleIf?.trim() || !!evaluate(it.visibleIf, scope);
      if (!shown) continue; // hidden questions don't run their operations
      visible.add(it.id);
      const field = typeof it.props.field === "string" ? it.props.field.trim() : "";
      const answer = field ? answers[field] : undefined;
      if (answer === undefined) continue;
      scope[field] = answer;
      for (const op of it.onAnswer ?? []) {
        const target = op.target.trim();
        if (target && op.expr.trim()) scope[target] = evaluate(op.expr, { ...scope, answer });
      }
    }
    return { scope, visible };
  }, [draft, answers]);

  // Variable names worth showing in the debug panel.
  const varNames = useMemo(() => {
    if (!draft) return [];
    const names = new Set<string>();
    for (const v of draft.vars) if (v.name.trim()) names.add(v.name.trim());
    for (const it of draft.items) for (const a of it.onAnswer ?? []) if (a.target.trim()) names.add(a.target.trim());
    return [...names];
  }, [draft]);

  if (!draft) return <div className="py-16 text-center text-sm text-muted-foreground">Loading preview…</div>;

  if (draft.items.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No questions in this test&apos;s draft yet — build some in the Questions tab first.
      </div>
    );
  }

  const answered = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Test preview</h1>
          <p className="text-sm text-muted-foreground">
            Running the local questions draft — answers drive operations and visibility live.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAnswers({});
            setRunKey((k) => k + 1);
          }}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restart
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        {/* Questions */}
        <AnswersProvider onAnswer={(field, value) => setAnswers((a) => ({ ...a, [field]: value }))}>
          <div key={runKey} className="space-y-4">
            {draft.items.map((it, i) => {
              if (!visible.has(it.id)) return null;
              const block = resolveBlockRef(it, blocks);
              if (!block) return null;
              const types = new Map(block.props.map((p) => [p.name, p.type]));
              const resolved = resolveInstanceProps(it, types, scope, { locale });
              return (
                <div key={it.id}>
                  <div className="mb-1 px-1 text-[0.65rem] font-semibold text-muted-foreground">Q{i + 1}</div>
                  <ViewRenderer template={block.html} props={resolved} />
                </div>
              );
            })}
          </div>
        </AnswersProvider>

        {/* Variables / answers debug panel */}
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-3">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Variables
            </p>
            {varNames.length === 0 ? (
              <p className="text-[0.7rem] text-muted-foreground">None declared.</p>
            ) : (
              <div className="space-y-1">
                {varNames.map((n) => (
                  <div key={n} className="flex items-baseline justify-between gap-2 text-xs">
                    <code className="font-mono text-muted-foreground">{n}</code>
                    <span className="font-mono font-semibold tabular-nums">{String(scope[n] ?? "—")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Answers <span className="font-normal normal-case">({answered})</span>
            </p>
            {answered === 0 ? (
              <p className="text-[0.7rem] text-muted-foreground">Nothing answered yet.</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(answers).map(([f, v]) => (
                  <div key={f} className="flex items-baseline justify-between gap-2 text-xs">
                    <code className="font-mono text-muted-foreground">{f}</code>
                    <span className="truncate font-mono">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
