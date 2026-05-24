"use client";

import { useEffect, useState } from "react";
import { X, BarChart3, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AttemptResult } from "./mock-data";

export interface DrawerData {
  studentName: string;
  testLabel: string;
  status: "completed" | "assigned";
  attempts: AttemptResult[];
}

interface Props {
  open: boolean;
  data: DrawerData | null;
  onClose: () => void;
}

export function ResultsDrawer({ open, data, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setPickerOpen(false);
    }
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const current = data?.attempts[selectedIndex];
  const maxScore = current ? Math.max(...current.scores.map((s) => s.value), 1) : 1;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/25 transition-opacity duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 right-0 top-0 z-[101] flex w-[460px] max-w-[92vw] flex-col bg-background shadow-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {data && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h3 className="text-base font-semibold">{data.testLabel}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{data.studentName}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {data.status === "assigned" || data.attempts.length === 0 || !current ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <BarChart3 className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="mb-1 text-sm font-semibold">Test assigned</p>
                  <p className="max-w-[280px] text-sm text-muted-foreground">
                    This test hasn&apos;t been completed yet. Results will appear here
                    once the student finishes.
                  </p>
                </div>
              ) : (
                <div className="px-6 py-5">
                  {/* Attempt picker */}
                  {data.attempts.length > 1 ? (
                    <div className="relative mb-6">
                      <button
                        onClick={() => setPickerOpen(!pickerOpen)}
                        className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-3.5 py-2.5 text-left transition-colors hover:bg-muted"
                      >
                        <span>
                          <span className="text-sm font-medium">
                            Attempt {data.attempts.length - selectedIndex}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {current.date}
                          </span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform",
                            pickerOpen && "rotate-180",
                          )}
                        />
                      </button>
                      {pickerOpen && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-popover py-1 shadow-lg">
                          {data.attempts.map((r, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedIndex(i);
                                setPickerOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-muted",
                                i === selectedIndex && "bg-muted",
                              )}
                            >
                              <span className="text-sm font-medium">
                                Attempt {data.attempts.length - i}
                              </span>
                              <span className="text-xs text-muted-foreground">{r.date}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-5 text-xs text-muted-foreground">{current.date}</div>
                  )}

                  {/* Summary */}
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    {current.summary}
                  </p>

                  {/* Score bars */}
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider">
                    Scores
                  </h4>
                  <div className="mb-6 flex flex-col gap-3">
                    {current.scores.map((score) => {
                      const high = score.value > 60;
                      return (
                        <div key={score.label}>
                          <div className="mb-1 flex items-center justify-between">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                high ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {score.label}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-bold",
                                high ? "text-primary" : "text-muted-foreground",
                              )}
                            >
                              {score.value}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                high ? "bg-primary" : "bg-muted-foreground/40",
                              )}
                              style={{ width: `${(score.value / maxScore) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Top results */}
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider">
                    Top results
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {current.scores
                      .filter((s) => s.value > 60)
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((s) => (
                        <span
                          key={s.label}
                          className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          {s.label} — {s.value}%
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {data.status === "completed" && data.attempts.length > 0 && (
              <div className="border-t px-6 py-4">
                <Button className="w-full" variant="default">
                  <Download className="mr-1 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
