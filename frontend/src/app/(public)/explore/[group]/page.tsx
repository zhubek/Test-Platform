"use client";

// A public catalog group's items, rendered as cards through the group's chosen
// card-view page. A filter sidebar (built from the group's filterable
// variables) narrows the grid client-side.

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { CatalogBlocks, useCatalogCards } from "@/lib/public-catalog";
import {
  CatalogFilterSidebar,
  applyCatalogFilters,
  type FilterState,
} from "../_components/catalog-filters";

export default function ExploreGroupPage() {
  const params = useParams();
  const group = params.group as string;
  const { t } = useLocale();
  const { locale } = useLocale();
  const { loading, resolveBlock, cards, filters, label } = useCatalogCards(group);
  const [filterState, setFilterState] = useState<FilterState>({});

  const filtered = useMemo(
    () => applyCatalogFilters(cards, filters, filterState, locale),
    [cards, filters, filterState, locale],
  );
  // Popular items first, order otherwise preserved.
  const ordered = useMemo(
    () => [...filtered].sort((a, b) => Number(b.popular) - Number(a.popular)),
    [filtered],
  );

  return (
    <>
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("professions.heading")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">{label}</h1>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
      ) : cards.length === 0 ? (
        <div className="py-16 text-center text-[0.88rem] text-muted-foreground">
          {t("professions.empty")}
        </div>
      ) : (
        <div className="flex flex-col gap-8 md:flex-row">
          <CatalogFilterSidebar filters={filters} state={filterState} onChange={setFilterState} />

          <div className="min-w-0 flex-1">
            {ordered.length === 0 ? (
              <div className="py-16 text-center text-[0.88rem] text-muted-foreground">
                {t("cm.filters.noResults")}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {ordered.map((c) => (
                  <div key={c.id} className="animate-fade-up">
                    <CatalogBlocks blocks={c.blocks} resolveBlock={resolveBlock} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
