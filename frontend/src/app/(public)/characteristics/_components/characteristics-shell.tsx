"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import type { CharacteristicsPageData, CategoryKey } from "./mock-data";
import { TabBar } from "./tab-bar";
import { BarChart } from "./bar-chart";
import { SummaryCard } from "./summary-card";
import { ProfessionGrid } from "./profession-grid";
import { EmptyState } from "./empty-state";

const ALL_TAB_KEYS: CategoryKey[] = ["interests", "personality", "skills", "values"];

const VALID_TABS = new Set<string>(ALL_TAB_KEYS);

const TAB_I18N_KEYS: Record<CategoryKey, string> = {
  interests: "characteristics.tabs.interests",
  personality: "characteristics.tabs.personality",
  skills: "characteristics.tabs.skills",
  values: "characteristics.tabs.values",
};

const FIT_KEY_MAP: Record<CategoryKey, string> = {
  interests: "interest",
  personality: "personality",
  skills: "skills",
  values: "values",
};

interface Props {
  data: CharacteristicsPageData;
}

export function CharacteristicsShell({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const tabs = ALL_TAB_KEYS.map((key) => ({
    key,
    label: t(TAB_I18N_KEYS[key]),
    disabled: !data.categories[key],
  }));

  const firstEnabled = tabs.find((t) => !t.disabled)?.key ?? "interests";

  // Read active tab from URL, fallback to first enabled
  const tabParam = searchParams.get("tab");
  const activeTab: CategoryKey =
    tabParam && VALID_TABS.has(tabParam) && data.categories[tabParam as CategoryKey]
      ? (tabParam as CategoryKey)
      : firstEnabled;

  const handleSelectTab = useCallback(
    (key: CategoryKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", key);
      router.push(`/characteristics?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (data.isEmpty) {
    return <EmptyState />;
  }

  const categoryData = data.categories[activeTab];
  const fitKey = FIT_KEY_MAP[activeTab];
  const fitLabel =
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  return (
    <>
      <TabBar tabs={tabs} active={activeTab} onSelect={handleSelectTab} />

      {categoryData ? (
        <>
          {/* key forces re-mount so bar animations replay on tab switch */}
          <div key={`bars-${activeTab}`} className="space-y-3">
            {categoryData.items.map((item, i) => (
              <BarChart key={item.label.en} item={item} index={i} />
            ))}
          </div>

          <SummaryCard text={categoryData.summary} />

          <ProfessionGrid
            key={`profs-${activeTab}`}
            professions={data.professions}
            fitKey={fitKey}
            fitLabel={fitLabel}
          />
        </>
      ) : (
        <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[0.88rem] text-gray-400 mb-4">
            {t("characteristics.noResults")}
          </p>
          <a
            href="/"
            className="text-[0.82rem] font-medium text-gray-600 hover:text-gray-900 transition-colors underline underline-offset-2"
          >
            {t("characteristics.noResults.cta")}
          </a>
        </div>
      )}
    </>
  );
}
