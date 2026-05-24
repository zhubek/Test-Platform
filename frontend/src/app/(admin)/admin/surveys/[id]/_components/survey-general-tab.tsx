"use client";

import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
import { LocalizedTextarea } from "@/components/localized-textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Localized } from "@/lib/localized";
import type { SurveyFormat } from "../../../_components/mock-data";

interface Props {
  name: Localized;
  description: Localized;
  format: SurveyFormat;
  duration: number;
  onNameChange: (v: Localized) => void;
  onDescriptionChange: (v: Localized) => void;
  onFormatChange: (v: SurveyFormat) => void;
  onDurationChange: (v: number) => void;
}

export function SurveyGeneralTab({
  name,
  description,
  format,
  duration,
  onNameChange,
  onDescriptionChange,
  onFormatChange,
  onDurationChange,
}: Props) {
  const { t } = useLocale();

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
      {/* Name */}
      <div>
        <Label className="mb-1.5 text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
          {t("cm.survey.nameLabel")}
        </Label>
        <LocalizedInput
          value={name}
          onChange={onNameChange}
          placeholder={t("cm.survey.namePlaceholder")}
          className="w-full"
        />
      </div>

      {/* Description */}
      <div>
        <Label className="mb-1.5 text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
          {t("cm.general.descriptionLabel")}
        </Label>
        <LocalizedTextarea
          value={description}
          onChange={onDescriptionChange}
          placeholder={t("cm.survey.descriptionPlaceholder")}
          rows={3}
          className="w-full"
        />
      </div>

      {/* Duration + Format row */}
      <div className="flex flex-col sm:flex-row gap-5">
        <div>
          <Label className="mb-1.5 text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("cm.general.durationLabel")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={60}
              value={duration}
              onChange={(e) => onDurationChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
            />
            <span className="text-[0.78rem] text-muted-foreground">{t("cm.general.durationUnit")}</span>
          </div>
        </div>

        <div>
          <Label className="mb-1.5 text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("cm.general.formatLabel")}
          </Label>
          <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
            <Button
              variant={format === "included" ? "outline" : "ghost"}
              size="sm"
              onClick={() => onFormatChange("included")}
              className="rounded-full"
            >
              {t("cm.survey.formatIncluded")}
            </Button>
            <Button
              variant={format === "separate" ? "outline" : "ghost"}
              size="sm"
              onClick={() => onFormatChange("separate")}
              className={format === "separate" ? "rounded-full text-violet-700" : "rounded-full"}
            >
              {t("cm.survey.formatSeparate")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
