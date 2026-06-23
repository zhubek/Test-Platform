"use client";

// Results drawer (slide-over) that renders the test's DESIGNED RESULT blocks
// against the holder's real attempt variables — the same blocks authored in the
// admin Result View tab. A dated attempt picker lets the holder switch between
// past results (newest first); it only appears once there is more than one
// attempt (attempt history is a later backend addition — today there is one
// result per test per holder).

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, X } from "lucide-react";
import {
  fetchAttempt,
  fetchBlockLibrary,
  fetchTestBlocks,
  type HolderTest,
  type LibraryBlock,
  type TestBlockInstance,
} from "@/lib/holder-api";
import { buildResultScope } from "@/lib/test-runtime";
import { resolveInstanceProps } from "@/lib/question-instances";
import { ViewRenderer } from "@/lib/view-renderer";
import {
  MatchedProfessionCards,
  isProfessionMatchesBlock,
  type MatchRow,
} from "@/components/matched-profession-cards";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DrawerAttempt {
  id: string;
  date: string;
}

export function BlockResultsDrawer({
  open,
  test,
  userName,
  onClose,
}: {
  open: boolean;
  test: HolderTest | null;
  userName?: string;
  onClose: () => void;
}) {
  const [blocks, setBlocks] = useState<TestBlockInstance[]>([]);
  const [library, setLibrary] = useState<LibraryBlock[]>([]);
  const [attempts, setAttempts] = useState<DrawerAttempt[]>([]);
  const [selected, setSelected] = useState(0);
  const [scope, setScope] = useState<Record<string, unknown>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { locale } = useLocale();
  const calc = useMemo(() => test?.advancedParams?.calc ?? [], [test]);

  // Resolve one attempt's variables into the render scope.
  const loadScope = useCallback(
    async (attemptId: string) => {
      const full = await fetchAttempt(attemptId);
      setScope(buildResultScope(full.variables ?? [], calc, locale, { user: { name: userName } }));
    },
    [calc, userName, locale],
  );

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Load the RESULT blocks + library + the (currently single) attempt on open.
  useEffect(() => {
    if (!open || !test) return;
    let active = true;
    setLoading(true);
    setError(null);
    setSelected(0);
    setPickerOpen(false);
    (async () => {
      try {
        const [rb, lib] = await Promise.all([fetchTestBlocks(test.id, "RESULT"), fetchBlockLibrary()]);
        if (!active) return;
        setBlocks(rb);
        setLibrary(lib);
        if (!test.attempt) {
          setAttempts([]);
          return;
        }
        const full = await fetchAttempt(test.attempt.id);
        if (!active) return;
        const when = full.endTime ?? full.updatedTime ?? "";
        setAttempts([{ id: test.attempt.id, date: when ? new Date(when).toLocaleString() : "" }]);
        setScope(buildResultScope(full.variables ?? [], test.advancedParams?.calc ?? [], locale, { user: { name: userName } }));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, test, userName]);

  const pickAttempt = (i: number) => {
    setSelected(i);
    setPickerOpen(false);
    const att = attempts[i];
    if (att) void loadScope(att.id);
  };

  const libById = new Map(library.map((b) => [b.id, b]));
  const current = attempts[selected];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/25 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-[101] flex w-[760px] max-w-[96vw] flex-col bg-card shadow-xl shadow-black/10 transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h3 className="text-[0.95rem] font-semibold text-foreground">{test?.name?.en ?? "Results"}</h3>
            <p className="mt-0.5 text-[0.72rem] text-muted-foreground">Results</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="py-16 text-center text-sm text-red-500">{error}</p>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-[0.88rem] text-muted-foreground">No results yet.</p>
            </div>
          ) : (
            <>
              {/* Dated attempt picker — shown once there is more than one attempt. */}
              {attempts.length > 1 ? (
                <div className="relative mb-6">
                  <button
                    onClick={() => setPickerOpen((p) => !p)}
                    className="flex w-full items-center justify-between rounded-lg border bg-muted/80 px-3.5 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <span className="text-[0.8rem] font-medium text-foreground">{current?.date}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", pickerOpen && "rotate-180")} />
                  </button>
                  {pickerOpen && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-card py-1 shadow-lg">
                      {attempts.map((a, i) => (
                        <button
                          key={a.id}
                          onClick={() => pickAttempt(i)}
                          className={cn(
                            "flex w-full px-3.5 py-2.5 text-left text-[0.8rem] transition-colors hover:bg-muted",
                            i === selected ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {a.date}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                current?.date && <p className="mb-5 text-[0.72rem] text-muted-foreground">{current.date}</p>
              )}

              {/* The test's designed RESULT blocks, against this attempt's data. */}
              {blocks.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  This test has no result page configured.
                </p>
              ) : (
                <div className="space-y-5">
                  {blocks.map((inst) => {
                    const block =
                      libById.get(inst.blockId) ??
                      (inst.block ? library.find((b) => b.name === inst.block!.name) : undefined);
                    if (!block) return null;
                    // The system "Profession matches" block expands into the
                    // matched-profession card grid wherever it's placed.
                    if (isProfessionMatchesBlock(block)) {
                      return (
                        <MatchedProfessionCards
                          key={inst.id}
                          catalog={test?.advancedParams?.matches?.[0]?.catalogId}
                          matches={(scope.professions as MatchRow[]) ?? []}
                        />
                      );
                    }
                    const types = new Map(block.props.map((p) => [p.name, p.type as never]));
                    const resolved = resolveInstanceProps({ id: inst.id, props: inst.props }, types, scope, { locale });
                    // Merge the result scope so blocks can iterate its derived
                    // collections (professions, topInterests, …) via data-each,
                    // while the block's own resolved props take precedence.
                    return (
                      <ViewRenderer key={inst.id} template={block.html} props={{ ...scope, ...resolved }} />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
