"use client";

import { use, useState } from "react";
import { CustomItemsTab } from "../../_components/custom-items-tab";
import { CatalogParameters } from "../../_components/catalog-parameters";
import { CatalogGroupPagesTab } from "../../_components/catalog-group-pages-tab";
import { CATALOGS } from "../../_components/catalog-groups";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { useCustomGroups } from "@/lib/custom-catalogs";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

type GroupTab = "items" | "pages" | "parameters";
const GROUP_TABS: { id: GroupTab; label: string }[] = [
  { id: "items", label: "Items" },
  { id: "pages", label: "Pages" },
  { id: "parameters", label: "Parameters" },
];

export default function CatalogGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLocale();
  const customGroups = useCustomGroups();
  const [groupTab, setGroupTab] = useState<GroupTab>("items");

  const builtIn = CATALOGS.find((c) => c.id === id);
  const custom = customGroups.find((g) => g.id === id);
  const label = builtIn ? t(builtIn.labelKey) : (custom?.name ?? id);

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
          { label },
        ]}
      />

      {/* Group tabs: Items · Pages · Parameters */}
      <div className="mb-6 flex gap-1 border-b border-gray-100">
        {GROUP_TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setGroupTab(tb.id)}
            className={cn(
              "relative px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
              groupTab === tb.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600",
            )}
          >
            {tb.label}
            {groupTab === tb.id && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>

      {groupTab === "items" && <CustomItemsTab group={id} />}
      {groupTab === "pages" && <CatalogGroupPagesTab catalog={id} />}
      {groupTab === "parameters" && <CatalogParameters catalog={id} />}
    </>
  );
}
