"use client";

import type { ProfessionData, ProfessionGroup } from "./mock-data";
import {
  Cpu,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Palette,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { ButtonLink } from "@/components/button-link";
import { cn } from "@/lib/utils";

const groupBadgeColors: Record<ProfessionGroup, string> = {
  Technology: "bg-blue-100 text-blue-800",
  Healthcare: "bg-emerald-100 text-emerald-800",
  Education: "bg-amber-100 text-amber-800",
  Business: "bg-violet-100 text-violet-800",
  "Creative Arts": "bg-pink-100 text-pink-800",
  Science: "bg-sky-100 text-sky-800",
};

const groupBgColors: Record<ProfessionGroup, string> = {
  Technology: "bg-blue-50 text-blue-600",
  Healthcare: "bg-emerald-50 text-emerald-600",
  Education: "bg-amber-50 text-amber-600",
  Business: "bg-violet-50 text-violet-600",
  "Creative Arts": "bg-pink-50 text-pink-600",
  Science: "bg-sky-50 text-sky-600",
};

const groupIcons: Record<ProfessionGroup, LucideIcon> = {
  Technology: Cpu,
  Healthcare: HeartPulse,
  Education: GraduationCap,
  Business: Briefcase,
  "Creative Arts": Palette,
  Science: FlaskConical,
};

interface Props {
  profession: ProfessionData;
  index: number;
  /** Active-tab fit dimension key, e.g. "interest" */
  fitKey: string;
}

export function ProfessionCard({ profession: p, index, fitKey }: Props) {
  const { t, locale } = useLocale();
  const Icon = groupIcons[p.group];
  const match = p.fit[fitKey as keyof typeof p.fit];

  return (
    <div
      className="animate-fade-up relative flex flex-col bg-card border rounded-xl p-5 transition-all duration-200 hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Title */}
      <h3 className="text-[1.02rem] font-bold text-foreground leading-tight">
        {localize(p.title, locale)}
        <span className="text-[0.72rem] text-muted-foreground font-normal ml-1.5">
          {p.code}
        </span>
      </h3>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mt-2.5 mb-2.5 flex-wrap">
        <span
          className={
            "text-[0.68rem] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap " +
            groupBadgeColors[p.group]
          }
        >
          {p.group}
        </span>
        {p.popular && (
          <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold whitespace-nowrap">
            {t("professions.card.popular")}
          </span>
        )}
      </div>

      {/* Description — wraps around the floated icon */}
      <div className="mb-3">
        <div
          className={cn(
            "float-right ml-3 mb-1 flex h-12 w-12 items-center justify-center rounded-2xl",
            groupBgColors[p.group],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="text-[0.84rem] text-muted-foreground leading-relaxed">
          {localize(p.desc, locale)}
        </p>
        <div className="clear-both" />
      </div>

      {/* Actions: match (related tab only) + details */}
      <div className="mt-auto flex items-center gap-2 pt-1.5">
        {match != null && (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[0.72rem] font-semibold text-primary">
            {t("professions.card.match")}: {match}%
          </span>
        )}
        <ButtonLink
          href="/explore"
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          {t("professions.card.details")}
        </ButtonLink>
      </div>
    </div>
  );
}
