"use client";

// Profession detail — rendered from the data catalog. Each of the item's
// catalog pages (Description, Characteristics, Education, Labor market, Content)
// becomes a tab; its blocks render filled with this item's values.

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { CatalogBlocks, useProfessionDetail } from "@/lib/public-catalog";

export default function ProfessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const { loading, item, tabs, resolveBlock } = useProfessionDetail(id);
  const [active, setActive] = useState(0);

  if (loading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mb-4 text-5xl">🔍</div>
          <h2 className="mb-2 text-lg font-semibold text-gray-700">Profession not found</h2>
          <Link href="/explore" className="text-[0.85rem] text-gray-500 underline underline-offset-2 hover:text-gray-900">
            Back to professions
          </Link>
        </div>
      </div>
    );
  }

  const activeTab = tabs[active];

  return (
    <>
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Professions
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        {localize(item.title, loc) || "—"}
      </h1>

      {tabs.length === 0 ? (
        <div className="py-16 text-center text-[0.88rem] text-gray-400">
          No views configured for this catalog.
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="scrollbar-hide -mx-1 mb-7 flex gap-1 overflow-x-auto rounded-xl bg-gray-100/80 p-1 px-1">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActive(i)}
                className={
                  "shrink-0 rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-all duration-200 sm:px-5 sm:text-sm " +
                  (i === active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")
                }
              >
                {localize(tab.title, loc)}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          {activeTab && (
            <div key={activeTab.id} className="animate-fade-in">
              <CatalogBlocks blocks={activeTab.blocks} resolveBlock={resolveBlock} />
            </div>
          )}
        </>
      )}
    </>
  );
}
