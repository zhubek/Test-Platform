"use client";

// Shared shell for every catalog detail page. Standard tabs:
//   General · Pages · Access · Views
// The General tab is the same for EVERY catalog: two fixed variables (Title,
// Description) plus free-form, addable Extra variables. Pages is the
// block-composed, view-only page builder (shown when `entityId` is provided).
// The Views tab shows the catalog's code-defined sub-editors as cards. A single
// page-level language picker drives all localized fields.

import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { type Localized } from "@/lib/localized";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import { EditLanguageProvider, PageLanguageBar } from "./edit-language";
import { AccessTab } from "./access-tab";
import { CatalogPagesTab } from "./catalog-pages-tab";
import { CatalogFieldsForm } from "./catalog-fields-form";
import { ExtraVariables } from "./extra-variables";
import { CharacteristicVariables } from "./characteristic-variables";

export interface CatalogPageDef {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  render: ReactNode;
}

export interface LocalizedFieldProps {
  value: Localized;
  onChange: (v: Localized) => void;
  onBlur?: () => void;
  placeholder?: string;
}

interface Props {
  breadcrumb?: ReactNode;
  title: string;
  // Catalog group id — a built-in CatalogType or a custom group slug.
  catalog: string;
  // The two fixed General variables every catalog item has.
  titleField: LocalizedFieldProps;
  descriptionField: LocalizedFieldProps;
  // Free-form, addable named values (stored on the item's `output` record).
  extras: {
    value: Record<string, Localized>;
    onChange: (v: Record<string, Localized>) => void;
    onBlur?: () => void;
  };
  // Numeric characteristic values keyed by characteristic id.
  characteristics?: {
    value: Record<string, number>;
    onChange: (v: Record<string, number>) => void;
    onBlur?: () => void;
  };
  // Enables the block-composed "Pages" tab for this entity.
  entityId?: number | string;
  pages?: CatalogPageDef[];
  access: { editors: number[]; onChange: (ids: number[]) => void };
  onDelete?: () => void;
  deleteLabel?: string;
  saving?: boolean;
}

const TABS = ["general", "datapages", "access", "pages"] as const;
type TabId = (typeof TABS)[number];
const LABEL_KEYS: Record<TabId, string> = {
  general: "admin.catUi.tabGeneral",
  datapages: "admin.catUi.tabPages",
  access: "admin.catUi.tabAccess",
  pages: "admin.catUi.tabViews",
};

export function CatalogDetailScaffold(props: Props) {
  return (
    <EditLanguageProvider>
      <ScaffoldInner {...props} />
    </EditLanguageProvider>
  );
}

function ScaffoldInner({
  breadcrumb,
  title,
  catalog,
  titleField,
  descriptionField,
  extras,
  characteristics,
  entityId,
  pages = [],
  access,
  onDelete,
  deleteLabel,
  saving,
}: Props) {
  const { t } = useLocale();
  const [tab, setTab] = useState<TabId>("general");
  const [openPage, setOpenPage] = useState<string | null>(null);

  return (
    <>
      {breadcrumb}

      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="truncate text-lg font-bold tracking-tight text-gray-900">{title || "—"}</h1>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-gray-400">{t("admin.common.saving")}</span>}
          <PageLanguageBar />
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-100">
        {TABS.filter(
          (id) =>
            (id !== "pages" || pages.length > 0) &&
            (id !== "datapages" || entityId != null),
        ).map((id) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setOpenPage(null);
            }}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
              tab === id ? "text-gray-900" : "text-gray-400 hover:text-gray-600",
            )}
          >
            {t(LABEL_KEYS[id])}
            {tab === id && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          <CatalogFieldsForm
            fields={[
              { id: "title", label: t("admin.catUi.title"), kind: "localized", ...titleField },
              { id: "description", label: t("admin.common.description"), kind: "localized", ...descriptionField },
            ]}
          />
          <ExtraVariables
            catalog={catalog}
            value={extras.value}
            onChange={extras.onChange}
            onBlur={extras.onBlur}
          />
          {characteristics && (
            <CharacteristicVariables
              catalog={catalog}
              value={characteristics.value}
              onChange={characteristics.onChange}
              onBlur={characteristics.onBlur}
            />
          )}
          {onDelete && (
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={onDelete}
                className="text-xs text-red-500 transition-colors hover:text-red-700"
              >
                {deleteLabel ?? t("admin.common.delete")}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "datapages" && entityId != null && (
        <CatalogPagesTab catalog={catalog} entityId={entityId} />
      )}

      {tab === "access" && <AccessTab editors={access.editors} onChange={access.onChange} />}

      {tab === "pages" &&
        (openPage ? (
          <PageView pages={pages} openPage={openPage} onBack={() => setOpenPage(null)} />
        ) : pages.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-gray-400">
            {t("admin.catUi.noViews")}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setOpenPage(p.id)}
                className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/30"
              >
                {p.icon && (
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-teal-100 group-hover:text-teal-600">
                    <p.icon className="h-4 w-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{p.label}</span>
                  {p.description && (
                    <span className="mt-0.5 block text-xs text-gray-400">{p.description}</span>
                  )}
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-teal-500" />
              </button>
            ))}
          </div>
        ))}
    </>
  );
}

function PageView({
  pages,
  openPage,
  onBack,
}: {
  pages: CatalogPageDef[];
  openPage: string;
  onBack: () => void;
}) {
  const pg = pages.find((p) => p.id === openPage);
  if (!pg) return null;
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {pg.label}
      </button>
      {pg.render}
    </div>
  );
}
