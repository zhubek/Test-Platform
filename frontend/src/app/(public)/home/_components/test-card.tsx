"use client";

import type { LucideIcon } from "lucide-react";
import {
  Clock,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BarChart3,
  Compass,
  Fingerprint,
  Puzzle,
  Heart,
  Briefcase,
  Wrench,
  Scale,
  BookOpen,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { Localized } from "@/lib/localized";
import { localize } from "@/lib/localized";

export type TestStatus = "available" | "in-progress" | "completed";
export type TestFormat = "test-only" | "with-consulting";
export type TestIconKey =
  | "compass"
  | "fingerprint"
  | "puzzle"
  | "heart"
  | "briefcase"
  | "wrench"
  | "scale"
  | "book-open";

interface IconStyle {
  component: LucideIcon;
  gradient: string;
  color: string;
}

const iconStyles: Record<TestIconKey, IconStyle> = {
  compass: { component: Compass, gradient: "bg-gradient-to-br from-orange-400 to-rose-500", color: "text-white" },
  fingerprint: { component: Fingerprint, gradient: "bg-gradient-to-br from-emerald-400 to-teal-600", color: "text-white" },
  puzzle: { component: Puzzle, gradient: "bg-gradient-to-br from-violet-400 to-purple-600", color: "text-white" },
  heart: { component: Heart, gradient: "bg-gradient-to-br from-pink-400 to-rose-600", color: "text-white" },
  briefcase: { component: Briefcase, gradient: "bg-gradient-to-br from-blue-400 to-indigo-600", color: "text-white" },
  wrench: { component: Wrench, gradient: "bg-gradient-to-br from-cyan-400 to-blue-600", color: "text-white" },
  scale: { component: Scale, gradient: "bg-gradient-to-br from-amber-400 to-orange-600", color: "text-white" },
  "book-open": { component: BookOpen, gradient: "bg-gradient-to-br from-lime-400 to-emerald-600", color: "text-white" },
};

export interface TestCardProps {
  id: string;
  title: Localized;
  description: Localized;
  status: TestStatus;
  category: Localized;
  format: TestFormat;
  duration: Localized;
  questions: Localized;
  extraMeta?: Localized;
  icon: TestIconKey;
  assigned?: boolean;
  dimmed?: boolean;
  resultCount?: number;
  onViewResults?: () => void;
  index?: number;
}

export function TestCard({
  id,
  title,
  description,
  status,
  category,
  format,
  duration,
  questions,
  extraMeta,
  icon,
  assigned,
  dimmed,
  resultCount = 0,
  onViewResults,
  index = 0,
}: TestCardProps) {
  const { t, locale } = useLocale();

  const statusConfig: Record<
    TestStatus,
    { label: string; dotClass: string; textClass: string }
  > = {
    available: {
      label: t("testCard.status.available"),
      dotClass: "bg-blue-500",
      textClass: "text-blue-600",
    },
    "in-progress": {
      label: t("testCard.status.inProgress"),
      dotClass: "bg-amber-500",
      textClass: "text-amber-600",
    },
    completed: {
      label: t("testCard.status.completed"),
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-600",
    },
  };

  const cfg = statusConfig[status];
  const { component: Icon, gradient: iconGradient, color: iconColor } = iconStyles[icon];

  return (
    <div
      className={
        "animate-fade-up group relative flex overflow-hidden rounded-2xl border border-black/[0.04] bg-white transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.06] hover:-translate-y-0.5 " +
        (dimmed ? "pointer-events-none opacity-40" : "")
      }
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Icon column */}
      <div
        className={`flex shrink-0 items-center justify-center w-14 md:w-[88px] ${iconGradient}`}
      >
        <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-lg md:rounded-xl bg-white/20 ring-1 ring-white/30">
          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${iconColor}`} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 md:gap-2 p-3 md:p-4 min-w-0">
        {/* Top row: title + status + assigned */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h3 className="text-[0.9rem] font-semibold text-gray-900 tracking-tight leading-tight">
              {localize(title, locale)}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
              <span className={`text-[0.65rem] font-medium ${cfg.textClass}`}>
                {cfg.label}
              </span>
            </div>
          </div>
          {assigned && (
            <span className="shrink-0 rounded-md bg-violet-50 border border-violet-100 px-2 py-0.5 text-[0.6rem] font-bold text-violet-600 uppercase tracking-wide">
              {t("testCard.badge.assigned")}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[0.78rem] leading-relaxed text-gray-500 line-clamp-2">
          {localize(description, locale)}
        </p>

        {/* Tags + Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-[0.68rem]">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-500">
            {localize(category, locale)}
          </span>
          {format === "with-consulting" && (
            <span className="rounded-md bg-amber-50 border border-amber-100/60 px-2 py-0.5 font-medium text-amber-600 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              {t("testCard.badge.consulting")}
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-400">
            <Clock className="h-3 w-3" />
            {localize(duration, locale)}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <HelpCircle className="h-3 w-3" />
            {localize(questions, locale)}
          </span>
          {extraMeta && (
            <span className="text-gray-400 font-medium">{localize(extraMeta, locale)}</span>
          )}
        </div>

        {/* Progress bar for in-progress */}
        {status === "in-progress" && (
          <div className="w-full max-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.62rem] font-medium text-gray-400">
                {t("testCard.progress")}
              </span>
              <span className="text-[0.62rem] font-bold text-gray-600">
                53%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="animate-progress h-full w-[53%] rounded-full bg-gradient-to-r from-amber-400 to-amber-500" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {status === "in-progress" && (
            <a href={`/test/${id}?mode=partial`} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[0.75rem] font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md hover:shadow-gray-900/10 active:scale-[0.98]">
              {t("testCard.action.continue")}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
          {(status === "in-progress" || status === "completed") && (
            <a href={`/test/${id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[0.75rem] font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]">
              <RotateCcw className="h-3 w-3" />
              {t("testCard.action.startNew")}
            </a>
          )}
          {status === "available" && (
            <a href={`/test/${id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[0.75rem] font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md hover:shadow-gray-900/10 active:scale-[0.98]">
              {t("testCard.action.startNew")}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={resultCount > 0 ? onViewResults : undefined}
            disabled={resultCount === 0}
            className={
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium transition-all duration-200 active:scale-[0.98] " +
              (resultCount > 0 && status === "completed"
                ? "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md hover:shadow-gray-900/10"
                : resultCount > 0
                  ? "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                  : "border border-gray-200 bg-white text-gray-300 cursor-default")
            }
          >
            <BarChart3 className="h-3 w-3" />
            {t("testCard.action.results")}
            {resultCount > 1 && (
              <span className="rounded-full bg-white/20 px-1.5 text-[0.6rem] font-bold">
                {resultCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
