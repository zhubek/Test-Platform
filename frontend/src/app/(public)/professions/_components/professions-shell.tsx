"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import type { ProfessionsPageData, ProfessionGroup, ProfessionData } from "./mock-data";
import { FilterSidebar } from "./filter-sidebar";
import { SortBar, type SortKey } from "./sort-bar";
import { ProfessionCard } from "./profession-card";
import { Button } from "@/components/ui/button";

const ALL_GROUPS: ProfessionGroup[] = [
  "Technology",
  "Healthcare",
  "Education",
  "Business",
  "Creative Arts",
  "Science",
];

function avgFit(p: ProfessionData): number {
  const vals = Object.values(p.fit).filter((v): v is number => v !== undefined);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : -1;
}

interface Props {
  data: ProfessionsPageData;
  mode: string;
}

export function ProfessionsShell({ data, mode }: Props) {
  const { t } = useLocale();
  const [professions, setProfessions] = useState(data.professions);
  const [likedOnly, setLikedOnly] = useState(false);
  const [popularOnly, setPopularOnly] = useState(false);
  const [activeGroups, setActiveGroups] = useState<Set<ProfessionGroup>>(
    () => new Set(ALL_GROUPS),
  );
  const [sortBy, setSortBy] = useState<SortKey>("overall");
  const [showAll, setShowAll] = useState(false);

  const toggleGroup = useCallback((g: ProfessionGroup) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }, []);

  const toggleLike = useCallback((id: number) => {
    setProfessions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked } : p)),
    );
  }, []);

  const filtered = useMemo(() => {
    return professions.filter((p) => {
      if (likedOnly && !p.liked) return false;
      if (popularOnly && !p.popular) return false;
      if (!activeGroups.has(p.group)) return false;
      return true;
    });
  }, [professions, likedOnly, popularOnly, activeGroups]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let va: number, vb: number;
      if (sortBy === "overall") {
        va = avgFit(a);
        vb = avgFit(b);
      } else {
        va = a.fit[sortBy] ?? -1;
        vb = b.fit[sortBy] ?? -1;
      }
      return vb - va;
    });
    return list;
  }, [filtered, sortBy]);

  const popular = sorted.filter((p) => p.popular);
  const others = sorted.filter((p) => !p.popular);

  return (
    <div className="flex gap-0">
      <FilterSidebar
        likedOnly={likedOnly}
        onLikedOnlyChange={setLikedOnly}
        popularOnly={popularOnly}
        onPopularOnlyChange={setPopularOnly}
        activeGroups={activeGroups}
        onToggleGroup={toggleGroup}
      />

      <div className="flex-1 min-w-0 pl-0 md:pl-6">
        <SortBar
          value={sortBy}
          onChange={setSortBy}
          hidden={!data.hasFitData}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Popular section */}
          {popular.length > 0 && (
            <>
              <SectionLabel>{t("professions.section.popular")}</SectionLabel>
              {popular.map((p, i) => (
                <ProfessionCard
                  key={p.id}
                  profession={p}
                  onToggleLike={toggleLike}
                  mode={mode}
                  index={i}
                />
              ))}
            </>
          )}

          {/* Show all / Others */}
          {others.length > 0 && (
            <>
              {!showAll ? (
                <div className="col-span-full text-center py-4">
                  <Button
                    onClick={() => setShowAll(true)}
                    variant="outline"
                  >
                    {t("professions.showAll")} ({others.length} more)
                  </Button>
                </div>
              ) : (
                <>
                  <SectionLabel>{t("professions.section.others")}</SectionLabel>
                  {others.map((p, i) => (
                    <ProfessionCard
                      key={p.id}
                      profession={p}
                      onToggleLike={toggleLike}
                      mode={mode}
                      index={i}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {sorted.length === 0 && (
            <div className="col-span-full animate-fade-in flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[0.88rem] text-muted-foreground">
                {t("professions.empty")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full text-[0.8rem] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1 border-t mt-1 first:border-t-0 first:mt-0 first:pt-0">
      {children}
    </div>
  );
}
