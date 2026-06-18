"use client";

// Explore landing — the list of public catalog groups. Each opens its own page
// of item cards. Which groups are public (and which page is their card view) is
// configured per group on the admin Parameters tab.

import Link from "next/link";
import { ChevronRight, Layers } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { usePublicGroups } from "@/lib/dc-catalogs";

export default function ExplorePage() {
  const { t } = useLocale();
  const groups = usePublicGroups();

  return (
    <>
      <div className="animate-fade-in mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("professions.heading")}
        </h1>
        <p className="mt-1 text-[0.85rem] text-muted-foreground">
          {t("professions.subheading")}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="py-16 text-center text-[0.88rem] text-muted-foreground">
          {t("professions.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/explore/${g.name}`}
              className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Layers className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {g.info?.label ?? g.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {g._count?.items ?? 0} items
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
