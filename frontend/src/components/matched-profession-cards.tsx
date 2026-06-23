"use client";

// Renders a test's matched catalog items (e.g. professions) as their real card
// view — the same card authored for /explore — each tagged with its fit score,
// two per row. Driven by the result scope's `professions` collection. This is
// what the system "Profession matches" RESULT block expands into wherever it is
// placed on a result page (editor preview + holder result drawer).

import { CatalogBlocks, useMatchedCards } from "@/lib/public-catalog";

export interface MatchRow {
  rank: number;
  name: string;
  score: number;
  id: string | null;
}

export function MatchedProfessionCards({
  catalog,
  matches,
}: {
  catalog?: string;
  matches: MatchRow[];
}) {
  const ids = matches.map((m) => m.id).filter((x): x is string => !!x);
  const { loading, resolveBlock, cards } = useMatchedCards(catalog ?? "", ids);

  if (!catalog || matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-6 text-center text-xs text-muted-foreground">
        Matched professions appear here once the test is completed.
      </div>
    );
  }

  return (
    <div>
      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading matches…</p>
      ) : (
        // Always two profession cards per row.
        <div className="grid grid-cols-2 gap-3 [&_.max-w-sm]:max-w-none">
          {matches.map((m) => {
            const blocks = m.id ? cards.get(m.id) : undefined;
            return (
              <div key={`${m.rank}-${m.id}`} className="relative">
                <span className="absolute right-2 top-2 z-10 rounded-full bg-indigo-600 px-2 py-0.5 text-[0.7rem] font-bold text-white shadow">
                  {m.score}%
                </span>
                {blocks ? (
                  <CatalogBlocks blocks={blocks} resolveBlock={resolveBlock} />
                ) : (
                  <div className="rounded-xl border px-3 py-3 text-sm font-medium text-gray-700">
                    {m.rank}. {m.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** True when a block is the system "Profession matches" marker block. */
export function isProfessionMatchesBlock(block: { html?: string } | null | undefined): boolean {
  return !!block?.html?.includes('name="profession-matches"');
}
