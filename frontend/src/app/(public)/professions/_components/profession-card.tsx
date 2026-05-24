"use client";

import type { ProfessionData, ProfessionGroup } from "./mock-data";
import { groupBadgeColors, groupBgColors, prepLevelLabels } from "./mock-data";
import {
  Heart,
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
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import { cn } from "@/lib/utils";

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
  onToggleLike: (id: number) => void;
  mode?: string;
  index: number;
}

export function ProfessionCard({ profession: p, onToggleLike, mode, index }: Props) {
  const { t, locale } = useLocale();

  const detailHref = `/professions/${p.id}${mode ? `?mode=${mode}` : ""}`;

  const Icon = groupIcons[p.group];

  return (
    <div
      className="animate-fade-up relative flex flex-col bg-card border rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Heart — top right */}
      <Button
        onClick={() => onToggleLike(p.id)}
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle like"
        className={cn(
          "absolute right-3 top-3",
          p.liked
            ? "text-red-500 hover:text-red-600"
            : "text-muted-foreground hover:text-red-400",
        )}
      >
        <Heart className="h-5 w-5" fill={p.liked ? "currentColor" : "none"} />
      </Button>

      {/* Title */}
      <h3 className="text-[1.02rem] font-bold text-foreground leading-tight pr-9">
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
          {t(`professionDetail.group.${p.group}`)}
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

      {/* Actions: prep-level dots + details button */}
      <div className="mt-auto flex items-center gap-3 pt-1.5">
        <ButtonLink href={detailHref} variant="outline" size="sm">
          {t("professions.card.details")}
        </ButtonLink>
        <div
          className="flex items-center gap-1"
          title={localize(prepLevelLabels[p.prepLevel], locale)}
        >
          {[1, 2, 3, 4, 5].map((seg) => (
            <span
              key={seg}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                seg <= p.prepLevel ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
