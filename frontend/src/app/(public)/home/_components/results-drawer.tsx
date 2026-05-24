"use client";

import { useEffect, useState } from "react";
import { X, BarChart3, ChevronDown, Download, Briefcase } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { Localized } from "@/lib/localized";
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ScoreEntry {
  label: Localized;
  value: number;
  high: boolean;
  description?: Localized;
}

export interface ResultEntry {
  date: string;
  summary: Localized;
  scores: ScoreEntry[];
  professions?: Localized[];
}

export interface ResultsDrawerProps {
  open: boolean;
  testTitle: string;
  results: ResultEntry[];
  onClose: () => void;
}

export function ResultsDrawer({
  open,
  testTitle,
  results,
  onClose,
}: ResultsDrawerProps) {
  const { t, locale } = useLocale();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Reset to latest result when drawer opens or results change
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setPickerOpen(false);
    }
  }, [open, results]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const current = results[selectedIndex];
  const maxScore = current
    ? Math.max(...current.scores.map((s) => s.value))
    : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className={
          "fixed inset-0 z-[100] bg-black/25 transition-opacity duration-200 " +
          (open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none")
        }
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={
          "fixed top-0 right-0 bottom-0 z-[101] w-[460px] max-w-[92vw] bg-card shadow-xl shadow-black/10 transition-transform duration-250 ease-out flex flex-col " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h3 className="text-[0.95rem] font-semibold text-foreground">
              {testTitle}
            </h3>
            <p className="text-[0.72rem] text-muted-foreground mt-0.5">{t("resultsDrawer.results")}</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-[0.88rem] text-muted-foreground">
                {t("resultsDrawer.empty")}
              </p>
            </div>
          ) : (
            <>
              {/* Attempt picker */}
              {results.length > 1 && (
                <div className="relative mb-6">
                  <button
                    onClick={() => setPickerOpen(!pickerOpen)}
                    className="flex w-full items-center justify-between rounded-lg border bg-muted/80 px-3.5 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <div>
                      <span className="text-[0.8rem] font-medium text-foreground">
                        {t("resultsDrawer.attempt")} {results.length - selectedIndex}
                      </span>
                      <span className="text-[0.72rem] text-muted-foreground ml-2">
                        {current.date}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                        pickerOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {pickerOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg border bg-card py-1 shadow-lg shadow-black/[0.08]">
                      {results.map((r, i) => (
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
                          <span
                            className={cn(
                              "text-[0.8rem] font-medium",
                              i === selectedIndex
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {t("resultsDrawer.attempt")} {results.length - i}
                          </span>
                          <span className="text-[0.72rem] text-muted-foreground">
                            {r.date}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Single attempt label (when only 1 result) */}
              {results.length === 1 && (
                <div className="mb-5 flex items-center gap-2">
                  <span className="text-[0.72rem] text-muted-foreground">
                    {current.date}
                  </span>
                </div>
              )}

              {/* Summary */}
              <p className="text-[0.82rem] text-muted-foreground leading-relaxed mb-6">
                {localize(current.summary, locale)}
              </p>

              {/* Score bars */}
              <div className="mb-6">
                <h4 className="text-[0.72rem] font-semibold text-foreground uppercase tracking-wider mb-3">
                  {t("resultsDrawer.scores")}
                </h4>
                <div className="flex flex-col gap-3">
                  {current.scores.map((score) => (
                    <div key={localize(score.label, locale)}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={
                            "text-[0.78rem] font-medium " +
                            (score.high ? "text-foreground" : "text-muted-foreground")
                          }
                        >
                          {localize(score.label, locale)}
                        </span>
                        <span
                          className={
                            "text-[0.7rem] font-bold " +
                            (score.high ? "text-blue-600" : "text-muted-foreground")
                          }
                        >
                          {score.value}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={
                            "h-full rounded-full transition-all duration-500 " +
                            (score.high
                              ? "bg-gradient-to-r from-blue-400 to-blue-500"
                              : "bg-muted-foreground/40")
                          }
                          style={{
                            width: `${(score.value / maxScore) * 100}%`,
                          }}
                        />
                      </div>
                      {score.description && (
                        <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                          {localize(score.description, locale)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended professions */}
              {current.professions && current.professions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[0.72rem] font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" />
                    {t("resultsDrawer.recommendedProfessions")}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {current.professions.map((profession) => (
                      <span
                        key={localize(profession, locale)}
                        className="rounded-lg border bg-muted px-2.5 py-1 text-[0.74rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {localize(profession, locale)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — Download PDF */}
        {results.length > 0 && (
          <div className="border-t px-6 py-4">
            <Button className="w-full">
              <Download className="h-4 w-4" />
              {t("resultsDrawer.downloadPdf")}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
