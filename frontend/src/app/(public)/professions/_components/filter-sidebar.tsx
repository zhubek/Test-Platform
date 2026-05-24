"use client";

import type { ProfessionGroup } from "./mock-data";
import { useLocale } from "@/lib/locale-context";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_GROUPS: ProfessionGroup[] = [
  "Technology",
  "Healthcare",
  "Education",
  "Business",
  "Creative Arts",
  "Science",
];

interface Props {
  likedOnly: boolean;
  onLikedOnlyChange: (v: boolean) => void;
  popularOnly: boolean;
  onPopularOnlyChange: (v: boolean) => void;
  activeGroups: Set<ProfessionGroup>;
  onToggleGroup: (g: ProfessionGroup) => void;
}

export function FilterSidebar({
  likedOnly,
  onLikedOnlyChange,
  popularOnly,
  onPopularOnlyChange,
  activeGroups,
  onToggleGroup,
}: Props) {
  const { t } = useLocale();

  return (
    <aside className="hidden md:block w-[210px] shrink-0 pr-6 border-r">
      <FilterGroup title={t("professions.filter.liked")}>
        <FilterCheckbox
          label={t("professions.filter.likedOnly")}
          checked={likedOnly}
          onChange={onLikedOnlyChange}
        />
      </FilterGroup>

      <FilterGroup title={t("professions.filter.group")}>
        {ALL_GROUPS.map((g) => (
          <FilterCheckbox
            key={g}
            label={g}
            checked={activeGroups.has(g)}
            onChange={() => onToggleGroup(g)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t("professions.filter.popular")}>
        <FilterCheckbox
          label={t("professions.filter.popularOnly")}
          checked={popularOnly}
          onChange={onPopularOnlyChange}
        />
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="text-[0.75rem] font-bold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[0.84rem] text-muted-foreground py-0.5 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {label}
    </label>
  );
}
