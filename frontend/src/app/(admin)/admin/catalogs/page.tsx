"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Layers, Plus } from "lucide-react";
import { CharacteristicsTab } from "./_components/characteristics-tab";
import { NewCatalogDialog } from "./_components/new-catalog-dialog";
import { CATALOGS } from "./_components/catalog-groups";
import { useDcGroups } from "@/lib/dc-catalogs";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

export default function MethodicPage() {
  const { t } = useLocale();
  const router = useRouter();
  // Project-scoped: only the groups of the project picked in the menu.
  const groups = useDcGroups();
  const [topTab, setTopTab] = useState<"catalogs" | "characteristics">("catalogs");
  const [newOpen, setNewOpen] = useState(false);

  // Back-compat with detail-page breadcrumbs, which link to /admin/catalogs#<entity>.
  // The hash is only readable on the client, so this must run post-hydration.
  // `#characteristics` selects the characteristics tab; any other entity hash is
  // a catalog group — forward it to that group's own page.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash === "characteristics") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopTab("characteristics");
    } else if (hash) {
      router.replace(`/admin/catalogs/group/${hash}`);
    }
  }, [router]);

  // ── Hub: catalog cards + characteristics ──────────────────────────────────
  return (
    <>
      <div className="animate-fade-in mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {t("cm.methodic.heading")}
        </h1>
      </div>

      {/* Top tabs: Catalogs (card grid) vs Characteristics (separate) */}
      <div className="mb-6 flex gap-1 border-b border-gray-100">
        {(["catalogs", "characteristics"] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTopTab(tb)}
            className={cn(
              "relative px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
              topTab === tb ? "text-gray-900" : "text-gray-400 hover:text-gray-600",
            )}
          >
            {tb === "catalogs" ? "Catalogs" : t("cm.methodic.tabs.characteristics")}
            {topTab === tb && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>

      {topTab === "characteristics" && <CharacteristicsTab />}

      {topTab === "catalogs" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            // Known built-ins get their icon + i18n label; custom groups get a
            // generic icon and their stored label.
            const meta = CATALOGS.find((c) => c.id === g.name);
            const Icon = meta?.icon ?? Layers;
            const label = meta ? t(meta.labelKey) : (g.info?.label ?? g.name);
            return (
              <Link
                key={g.id}
                href={`/admin/catalogs/group/${g.name}`}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-teal-100 group-hover:text-teal-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-semibold text-gray-900">{label}</span>
                <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-teal-500" />
              </Link>
            );
          })}

          <button
            onClick={() => setNewOpen(true)}
            className="flex min-h-[72px] items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 transition-colors hover:border-teal-300 hover:text-teal-600"
          >
            <Plus className="h-4 w-4" /> New catalog
          </button>
        </div>
      )}

      <NewCatalogDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(group) => {
          setNewOpen(false);
          router.push(`/admin/catalogs/group/${group.id}`);
        }}
      />
    </>
  );
}
