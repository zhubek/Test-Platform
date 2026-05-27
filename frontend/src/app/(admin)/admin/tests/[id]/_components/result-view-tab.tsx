"use client";

import { useState } from "react";
import {
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, X,
  BarChart3, Radar, PieChart, Table, LayoutGrid, AlignLeft,
  Trophy, Gauge as GaugeIcon, ListOrdered, Award, Heading, Type, Minus,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize, l } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalizedInput } from "@/components/localized-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { findGroup } from "@/lib/catalog-characteristics";
import { ResultComponentView, type ResultDatum } from "./result-component";
import type {
  ResultComponent,
  ResultComponentType,
  ResultPage,
  CatalogMapping,
  Variable,
} from "../../../_components/mock-data";

interface Props {
  pages: ResultPage[];
  variables: Variable[];
  mappings: CatalogMapping[];
  onChange: (pages: ResultPage[]) => void;
}

type BlockBinding = ResultComponent["binding"]["kind"] | "static";
interface BlockDef {
  type: ResultComponentType;
  icon: typeof BarChart3;
  key: string; // label i18n key
  descKey: string; // short description i18n key
  group: "characteristics" | "single" | "mapping" | "layout";
  bindingKind: BlockBinding;
}

const COMPONENT_TYPES: BlockDef[] = [
  // Characteristics
  { type: "characteristics_bar", icon: BarChart3, key: "cm.resultView.typeBar", descKey: "cm.resultView.descBar", group: "characteristics", bindingKind: "characteristics" },
  { type: "characteristics_radar", icon: Radar, key: "cm.resultView.typeRadar", descKey: "cm.resultView.descRadar", group: "characteristics", bindingKind: "characteristics" },
  { type: "characteristics_pie", icon: PieChart, key: "cm.resultView.typePie", descKey: "cm.resultView.descPie", group: "characteristics", bindingKind: "characteristics" },
  { type: "score_table", icon: Table, key: "cm.resultView.typeTable", descKey: "cm.resultView.descTable", group: "characteristics", bindingKind: "characteristics" },
  { type: "stat_grid", icon: LayoutGrid, key: "cm.resultView.typeStatGrid", descKey: "cm.resultView.descStatGrid", group: "characteristics", bindingKind: "characteristics" },
  { type: "summary_text", icon: AlignLeft, key: "cm.resultView.typeSummary", descKey: "cm.resultView.descSummary", group: "characteristics", bindingKind: "characteristics" },
  // Single variable
  { type: "score_card", icon: Trophy, key: "cm.resultView.typeCard", descKey: "cm.resultView.descCard", group: "single", bindingKind: "characteristics" },
  { type: "gauge", icon: GaugeIcon, key: "cm.resultView.typeGauge", descKey: "cm.resultView.descGauge", group: "single", bindingKind: "characteristics" },
  // Mapping
  { type: "matches_list", icon: ListOrdered, key: "cm.resultView.typeMatches", descKey: "cm.resultView.descMatches", group: "mapping", bindingKind: "mapping" },
  { type: "match_detail", icon: Award, key: "cm.resultView.typeMatchDetail", descKey: "cm.resultView.descMatchDetail", group: "mapping", bindingKind: "mapping" },
  // Static layout
  { type: "heading", icon: Heading, key: "cm.resultView.typeHeading", descKey: "cm.resultView.descHeading", group: "layout", bindingKind: "static" },
  { type: "text", icon: Type, key: "cm.resultView.typeText", descKey: "cm.resultView.descText", group: "layout", bindingKind: "static" },
  { type: "divider", icon: Minus, key: "cm.resultView.typeDivider", descKey: "cm.resultView.descDivider", group: "layout", bindingKind: "static" },
];

const BLOCK_GROUPS: { id: BlockDef["group"]; key: string }[] = [
  { id: "characteristics", key: "cm.resultView.groupCharacteristics" },
  { id: "single", key: "cm.resultView.groupSingle" },
  { id: "mapping", key: "cm.resultView.groupMapping" },
  { id: "layout", key: "cm.resultView.groupLayout" },
];

export function ResultViewTab({ pages, variables, mappings, onChange }: Props) {
  const { t, locale } = useLocale();
  const charVars = variables.filter((v) => v.kind === "characteristic");
  const [active, setActive] = useState(0);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);

  const activePage = pages[Math.min(active, Math.max(0, pages.length - 1))];
  // Which page's "Add block" modal is open (null = closed).
  const [pickerPage, setPickerPage] = useState<number | null>(null);

  // ── Page handlers ───────────────────────────────────────────────
  const addPage = () => {
    onChange([...pages, { id: `rp_${Date.now()}`, title: { en: "", ru: "", kz: "" }, components: [] }]);
    setActive(pages.length);
  };
  const updatePage = (pi: number, partial: Partial<ResultPage>) =>
    onChange(pages.map((p, i) => (i === pi ? { ...p, ...partial } : p)));
  const deletePage = (pi: number) => {
    onChange(pages.filter((_, i) => i !== pi));
    setActive((a) => Math.max(0, Math.min(a, pages.length - 2)));
  };

  // ── Component handlers (within the active page) ─────────────────
  const setComponents = (pi: number, components: ResultComponent[]) => updatePage(pi, { components });
  const addComponent = (pi: number, type: ResultComponentType) => {
    const def = COMPONENT_TYPES.find((c) => c.type === type)!;
    const binding: ResultComponent["binding"] =
      def.bindingKind === "mapping" ? { kind: "mapping", mappingId: mappings[0]?.id } : { kind: "characteristics" };
    const options: ResultComponent["options"] =
      type === "matches_list" ? { count: 5, sort: "score_desc", showValues: true } : { sort: "score_desc", showValues: true };
    setComponents(pi, [
      ...pages[pi].components,
      {
        id: `rc_${Date.now()}`,
        type,
        title: { en: "", ru: "", kz: "" },
        binding,
        variableNames: [],
        options,
        params: [],
        ...(def.bindingKind === "static" ? { content: { en: "", ru: "", kz: "" } } : {}),
      },
    ]);
  };
  const updateComponent = (pi: number, id: string, partial: Partial<ResultComponent>) =>
    setComponents(pi, pages[pi].components.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  const removeComponent = (pi: number, id: string) =>
    setComponents(pi, pages[pi].components.filter((c) => c.id !== id));

  // Sample data for a component, honoring its variable selection.
  const sampleData = (c: ResultComponent): ResultDatum[] => {
    if (c.binding.kind === "mapping") {
      const m = mappings.find((x) => x.id === c.binding.mappingId);
      const group = m && findGroup(m.catalogId, m.groupId);
      const items = (group?.items ?? []).slice(0, m?.topN ?? 5);
      return items.map((it, i) => ({ label: localize(it.name, locale), value: 95 - i * 11 }));
    }
    const picked = c.variableNames?.length ? charVars.filter((v) => c.variableNames!.includes(v.name)) : charVars;
    return picked.map((v, i) => ({ label: localize(v.label, locale) || v.name, value: 30 + ((i * 37) % 60) }));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── Left: constructor (pages + component forms) ── */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="text-sm font-semibold">{t("cm.resultView.heading")}</span>
          <span className="text-[0.7rem] text-muted-foreground">
            {pages.length} page{pages.length !== 1 && "s"}
          </span>
          <Button variant="ghost" size="sm" onClick={addPage} className="ml-auto text-primary hover:text-teal-700">
            <Plus className="h-3.5 w-3.5" /> {t("cm.resultView.addPage")}
          </Button>
        </div>

        <div className="max-h-[72vh] space-y-3 overflow-auto p-3">
          {pages.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center text-[0.78rem] text-muted-foreground">
              {t("cm.resultView.empty")}
            </div>
          ) : (
            pages.map((page, pi) => (
              <div
                key={page.id}
                className={cn(
                  "rounded-lg border",
                  pi === active ? "border-primary/40" : "border-border",
                )}
              >
                {/* Page header */}
                <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
                  {editingTitle === pi ? (
                    <LocalizedInput
                      value={page.title}
                      onChange={(v) => updatePage(pi, { title: v })}
                      placeholder={t("cm.resultView.pageTitle")}
                      className="flex-1"
                    />
                  ) : (
                    <button onClick={() => setActive(pi)} className="flex-1 text-left text-sm font-semibold">
                      <span className="text-muted-foreground">{pi + 1}. </span>
                      {localize(page.title, locale) || `${t("cm.resultView.page")} ${pi + 1}`}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        ({page.components.length})
                      </span>
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingTitle(editingTitle === pi ? null : pi)}
                    title={t("cm.resultView.renamePage")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deletePage(pi)}
                    className="text-muted-foreground hover:text-red-500"
                    title={t("cm.resultView.deletePage")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Page body: component configs + Add block */}
                <div className="space-y-3 p-2.5">
                  {page.components.length === 0 ? (
                    <p className="py-3 text-center text-[0.72rem] text-muted-foreground">
                      {t("cm.resultView.pageEmpty")}
                    </p>
                  ) : (
                    page.components.map((c) => (
                      <ComponentConfig
                        key={c.id}
                        component={c}
                        charVars={charVars}
                        mappings={mappings}
                        onUpdate={(partial) => updateComponent(pi, c.id, partial)}
                        onRemove={() => removeComponent(pi, c.id)}
                      />
                    ))
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerPage(pi)}
                    className="w-full border-dashed text-muted-foreground hover:border-teal-300 hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("cm.resultView.addBlock")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right: live preview (one page at a time, with pills) ── */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">
          {t("cm.resultView.preview")}
        </div>
        <div className="max-h-[72vh] overflow-auto p-5">
          {pages.length === 0 || !activePage ? (
            <p className="py-10 text-center text-[0.78rem] text-muted-foreground">
              {t("cm.resultView.previewEmpty")}
            </p>
          ) : (
            <>
              {/* Page pills */}
              {pages.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {pages.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setActive(i)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        i === active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {i + 1}. {localize(p.title, locale) || `${t("cm.resultView.page")} ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}

              <h2 className="mb-4 text-lg font-bold tracking-tight">
                {localize(activePage.title, locale) || `${t("cm.resultView.page")} ${active + 1}`}
              </h2>

              {activePage.components.length === 0 ? (
                <p className="py-10 text-center text-[0.78rem] text-muted-foreground">
                  {t("cm.resultView.pageEmpty")}
                </p>
              ) : (
                <div className="space-y-4">
                  {activePage.components.map((c) => {
                    const def = COMPONENT_TYPES.find((x) => x.type === c.type)!;
                    return (
                      <ResultComponentView
                        key={c.id}
                        component={{ ...c, title: c.title.en || c.title.ru || c.title.kz ? c.title : l(t(def.key)) }}
                        data={sampleData(c)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Prev / next */}
              {pages.length > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <Button variant="outline" size="sm" disabled={active === 0} onClick={() => setActive(active - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> {t("cm.resultView.prev")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {active + 1} / {pages.length}
                  </span>
                  <Button variant="outline" size="sm" disabled={active === pages.length - 1} onClick={() => setActive(active + 1)}>
                    {t("cm.resultView.next")} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add-block picker modal */}
      {pickerPage !== null && (
        <BlockPicker
          onCancel={() => setPickerPage(null)}
          onPick={(type) => {
            addComponent(pickerPage, type);
            setPickerPage(null);
          }}
        />
      )}
    </div>
  );
}

// ── Add-block picker modal (grid of block cards by group) ───────
function BlockPicker({ onCancel, onPick }: { onCancel: () => void; onPick: (type: ResultComponentType) => void }) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative mx-4 max-h-[85vh] w-full max-w-2xl space-y-4 overflow-auto rounded-xl bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-[0.9rem] font-semibold">{t("cm.resultView.addBlock")}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {BLOCK_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(g.key)}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COMPONENT_TYPES.filter((b) => b.group === g.id).map((b) => (
                <button
                  key={b.type}
                  onClick={() => onPick(b.type)}
                  className="flex flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left transition-colors hover:border-foreground hover:bg-muted/40"
                >
                  <b.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[0.8rem] font-medium">{t(b.key)}</span>
                  <span className="text-[0.68rem] leading-snug text-muted-foreground">{t(b.descKey)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Per-component configuration form (no preview — that's on the right) ──
function ComponentConfig({
  component: c,
  charVars,
  mappings,
  onUpdate,
  onRemove,
}: {
  component: ResultComponent;
  charVars: Variable[];
  mappings: CatalogMapping[];
  onUpdate: (partial: Partial<ResultComponent>) => void;
  onRemove: () => void;
}) {
  const { t, locale } = useLocale();
  const def = COMPONENT_TYPES.find((x) => x.type === c.type)!;
  const updateOptions = (partial: Partial<NonNullable<ResultComponent["options"]>>) =>
    onUpdate({ options: { ...c.options, ...partial } });

  // ── Static layout blocks: minimal config ──
  if (def.bindingKind === "static") {
    return (
      <div className="rounded-xl border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          <Param label={t("cm.resultView.component")}>
            <span className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[0.78rem]">
              <def.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {t(def.key)}
            </span>
          </Param>
          {c.type !== "divider" && (
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {c.type === "heading" ? t("cm.resultView.headingText") : t("cm.resultView.bodyText")}
              </label>
              <LocalizedInput
                value={c.content ?? { en: "", ru: "", kz: "" }}
                onChange={(v) => onUpdate({ content: v })}
                placeholder={c.type === "heading" ? t("cm.resultView.headingText") : t("cm.resultView.bodyText")}
              />
            </div>
          )}
          {c.type === "divider" && <span className="flex-1 text-[0.72rem] text-muted-foreground">{t("cm.resultView.descDivider")}</span>}
          <Button variant="ghost" size="icon-sm" onClick={onRemove} className="ml-auto text-muted-foreground hover:text-red-500 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Param label={t("cm.resultView.component")}>
          <span className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[0.78rem]">
            <def.icon className="h-3.5 w-3.5 text-muted-foreground" />
            {t(def.key)}
          </span>
        </Param>

        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("cm.resultView.title")}
          </label>
          <LocalizedInput value={c.title} onChange={(v) => onUpdate({ title: v })} placeholder={t("cm.resultView.titlePlaceholder")} />
        </div>

        {c.binding.kind === "mapping" && (
          <Param label={t("cm.resultView.fromMapping")}>
            <Select
              value={c.binding.mappingId ?? ""}
              onValueChange={(v) => onUpdate({ binding: { kind: "mapping", mappingId: v ?? undefined } })}
            >
              <SelectTrigger size="sm" className="w-52">
                <SelectValue>
                  {() => {
                    const m = mappings.find((x) => x.id === c.binding.mappingId);
                    const g = m && findGroup(m.catalogId, m.groupId);
                    return g ? localize(g.name, locale) : t("cm.resultView.noMapping");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {mappings.length === 0 ? (
                  <SelectItem value="" disabled>{t("cm.resultView.noMapping")}</SelectItem>
                ) : (
                  mappings.map((m) => {
                    const g = findGroup(m.catalogId, m.groupId);
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {g ? localize(g.name, locale) : m.id} · top {m.topN}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </Param>
        )}

        <Button variant="ghost" size="icon-sm" onClick={onRemove} className="ml-auto text-muted-foreground hover:text-red-500 hover:bg-red-50">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Variables + parameters */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        {c.binding.kind === "characteristics" && c.type !== "score_card" && (
          <div className="flex flex-col gap-1">
            <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("cm.resultView.variables")}
            </label>
            <div className="flex flex-wrap gap-1">
              {charVars.length === 0 && (
                <span className="text-[0.72rem] text-muted-foreground">{t("cm.resultView.noVars")}</span>
              )}
              {charVars.map((v) => {
                const selected = !c.variableNames?.length || c.variableNames.includes(v.name);
                return (
                  <button
                    key={v.name}
                    onClick={() => {
                      const cur = c.variableNames?.length ? c.variableNames : charVars.map((x) => x.name);
                      const next = cur.includes(v.name) ? cur.filter((n) => n !== v.name) : [...cur, v.name];
                      onUpdate({ variableNames: next.length === charVars.length ? [] : next });
                    }}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[0.7rem] transition-colors",
                      selected ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {localize(v.label, locale) || v.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {c.type === "score_card" && (
          <Param label={t("cm.resultView.variable")}>
            <Select
              value={c.binding.variableName ?? "__top__"}
              onValueChange={(v) =>
                onUpdate({
                  binding: v === "__top__" ? { kind: "characteristics" } : { kind: "variable", variableName: v ?? undefined },
                })
              }
            >
              <SelectTrigger size="sm" className="w-48">
                <SelectValue>
                  {() =>
                    c.binding.kind === "variable" && c.binding.variableName
                      ? localize(charVars.find((v) => v.name === c.binding.variableName)?.label ?? { en: c.binding.variableName, ru: "", kz: "" }, locale)
                      : t("cm.resultView.topAuto")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__top__">{t("cm.resultView.topAuto")}</SelectItem>
                {charVars.map((v) => (
                  <SelectItem key={v.name} value={v.name}>{localize(v.label, locale) || v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Param>
        )}

        {c.type === "matches_list" && (
          <Param label={t("cm.resultView.count")}>
            <Input
              type="number"
              min={1}
              max={50}
              value={c.options?.count ?? 5}
              onChange={(e) => updateOptions({ count: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })}
              className="h-8 w-20"
            />
          </Param>
        )}

        {c.type !== "score_card" && (
          <Param label={t("cm.resultView.sort")}>
            <Select
              value={c.options?.sort ?? "score_desc"}
              onValueChange={(v) => updateOptions({ sort: (v as "score_desc" | "score_asc" | "as_is") ?? "score_desc" })}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue>{() => t(`cm.resultView.sort.${c.options?.sort ?? "score_desc"}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_desc">{t("cm.resultView.sort.score_desc")}</SelectItem>
                <SelectItem value="score_asc">{t("cm.resultView.sort.score_asc")}</SelectItem>
                <SelectItem value="as_is">{t("cm.resultView.sort.as_is")}</SelectItem>
              </SelectContent>
            </Select>
          </Param>
        )}

        <button
          onClick={() => updateOptions({ showValues: c.options?.showValues === false })}
          className={cn(
            "h-8 self-end rounded-md border px-2.5 text-[0.72rem] font-medium transition-colors",
            c.options?.showValues !== false ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {t("cm.resultView.showValues")}
        </button>

        {(c.type === "characteristics_bar" || c.type === "characteristics_radar") && (
          <Param label={t("cm.resultView.maxScale")}>
            <Input
              type="number"
              min={0}
              value={c.options?.maxScale ?? 0}
              onChange={(e) => updateOptions({ maxScale: Math.max(0, parseInt(e.target.value) || 0) })}
              placeholder="auto"
              className="h-8 w-20"
            />
          </Param>
        )}
      </div>
    </div>
  );
}

// Small labeled wrapper for a parameter control.
function Param({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
