"use client";

import { useState } from "react";
import {
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, X, GripVertical,
  BarChart3, Radar, PieChart, Table, LayoutGrid, AlignLeft,
  Trophy, Gauge as GaugeIcon, ListOrdered, Award, Heading, Type, Minus,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { findGroup, catalogFields } from "@/lib/catalog-characteristics";
import { ResultComponentView, type ResultDatum } from "./result-component";
import { VariableSelect, VariableMultiSelect } from "./variable-select";
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
  // config group drives how the block is configured & previewed:
  //  text    → a {var} template; single → one numeric var; multi → many numeric vars;
  //  catalog → a mapping + a catalog parameter; divider → nothing.
  group: "text" | "single" | "multi" | "catalog" | "divider";
}

const COMPONENT_TYPES: BlockDef[] = [
  // Text (template with {var})
  { type: "heading", icon: Heading, key: "cm.resultView.typeHeading", descKey: "cm.resultView.descHeading", group: "text" },
  { type: "text", icon: Type, key: "cm.resultView.typeText", descKey: "cm.resultView.descText", group: "text" },
  { type: "summary_text", icon: AlignLeft, key: "cm.resultView.typeSummary", descKey: "cm.resultView.descSummary", group: "text" },
  // Single numeric variable
  { type: "score_card", icon: Trophy, key: "cm.resultView.typeCard", descKey: "cm.resultView.descCard", group: "single" },
  { type: "gauge", icon: GaugeIcon, key: "cm.resultView.typeGauge", descKey: "cm.resultView.descGauge", group: "single" },
  // Multiple numeric variables (charts)
  { type: "characteristics_bar", icon: BarChart3, key: "cm.resultView.typeBar", descKey: "cm.resultView.descBar", group: "multi" },
  { type: "characteristics_radar", icon: Radar, key: "cm.resultView.typeRadar", descKey: "cm.resultView.descRadar", group: "multi" },
  { type: "characteristics_pie", icon: PieChart, key: "cm.resultView.typePie", descKey: "cm.resultView.descPie", group: "multi" },
  { type: "score_table", icon: Table, key: "cm.resultView.typeTable", descKey: "cm.resultView.descTable", group: "multi" },
  { type: "stat_grid", icon: LayoutGrid, key: "cm.resultView.typeStatGrid", descKey: "cm.resultView.descStatGrid", group: "multi" },
  // Catalog matching
  { type: "matches_list", icon: ListOrdered, key: "cm.resultView.typeMatches", descKey: "cm.resultView.descMatches", group: "catalog" },
  { type: "match_detail", icon: Award, key: "cm.resultView.typeMatchDetail", descKey: "cm.resultView.descMatchDetail", group: "catalog" },
  // Divider (no config)
  { type: "divider", icon: Minus, key: "cm.resultView.typeDivider", descKey: "cm.resultView.descDivider", group: "divider" },
];

const BLOCK_GROUPS: { id: BlockDef["group"]; key: string }[] = [
  { id: "text", key: "cm.resultView.groupText" },
  { id: "single", key: "cm.resultView.groupSingle" },
  { id: "multi", key: "cm.resultView.groupMulti" },
  { id: "catalog", key: "cm.resultView.groupMapping" },
  { id: "divider", key: "cm.resultView.groupLayout" },
];

export function ResultViewTab({ pages, variables, mappings, onChange }: Props) {
  const { t, locale } = useLocale();
  const charVars = variables.filter((v) => v.kind === "characteristic");
  const [active, setActive] = useState(0);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);

  const activePage = pages[Math.min(active, Math.max(0, pages.length - 1))];
  // Which page's "Add block" modal is open (null = closed).
  const [pickerPage, setPickerPage] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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

  // Drag handlers: page ids are "rp:<id>", block ids are "rc:<id>".
  const onPagesDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const from = pages.findIndex((p) => `rp:${p.id}` === a.id);
    const to = pages.findIndex((p) => `rp:${p.id}` === over.id);
    if (from !== -1 && to !== -1) {
      onChange(arrayMove(pages, from, to));
      setActive(to);
    }
  };
  const onBlocksDragEnd = (pi: number) => (e: DragEndEvent) => {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const comps = pages[pi].components;
    const from = comps.findIndex((c) => `rc:${c.id}` === a.id);
    const to = comps.findIndex((c) => `rc:${c.id}` === over.id);
    if (from !== -1 && to !== -1) updatePage(pi, { components: arrayMove(comps, from, to) });
  };

  // ── Component handlers (within the active page) ─────────────────
  const setComponents = (pi: number, components: ResultComponent[]) => updatePage(pi, { components });
  const addComponent = (pi: number, type: ResultComponentType) => {
    const def = COMPONENT_TYPES.find((c) => c.type === type)!;
    const binding: ResultComponent["binding"] =
      def.group === "catalog" ? { kind: "mapping", mappingId: mappings[0]?.id } : { kind: "characteristics" };
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
        ...(def.group === "text" ? { content: { en: "", ru: "", kz: "" } } : {}),
        ...(def.group === "catalog" ? { catalogFieldId: "name" } : {}),
      },
    ]);
  };
  const updateComponent = (pi: number, id: string, partial: Partial<ResultComponent>) =>
    setComponents(pi, pages[pi].components.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  const removeComponent = (pi: number, id: string) =>
    setComponents(pi, pages[pi].components.filter((c) => c.id !== id));

  // Fabricated sample score for a variable (stable per name), for previews.
  const sampleScore = (i: number) => 30 + ((i * 37) % 60);

  // Sample data for a component, honoring its variable selection / catalog param.
  const sampleData = (c: ResultComponent): ResultDatum[] => {
    if (c.binding.kind === "mapping") {
      const m = mappings.find((x) => x.id === c.binding.mappingId);
      const group = m && findGroup(m.catalogId, m.groupId);
      const items = (group?.items ?? []).slice(0, c.options?.count ?? m?.topN ?? 5);
      const fieldId = c.catalogFieldId ?? "name";
      return items.map((it, i) => {
        const score = 95 - i * 11;
        let label: string;
        if (fieldId === "name") label = localize(it.name, locale);
        else if (fieldId === "description") label = it.description ? localize(it.description, locale) : "—";
        else if (fieldId === "score") label = String(score);
        else {
          const f = it.fields?.[fieldId];
          label = f == null ? "—" : typeof f === "number" ? String(f) : localize(f, locale);
        }
        return { label, value: score };
      });
    }
    // single var → just that one; multi → picked subset (or all)
    let picked = charVars;
    if (c.binding.kind === "variable" && c.binding.variableName) {
      picked = charVars.filter((v) => v.name === c.binding.variableName);
    } else if (c.variableNames?.length) {
      // preserve the author's manual order
      const byName = new Map(charVars.map((v) => [v.name, v]));
      picked = c.variableNames.map((n) => byName.get(n)).filter((v): v is (typeof charVars)[number] => !!v);
    }
    return picked.map((v) => ({ label: localize(v.label, locale) || v.name, value: sampleScore(charVars.indexOf(v)) }));
  };

  // Resolved-variable map for text templates: {var} → label-if-translated-else-number.
  const sampleVars = (): Record<string, { value: number; label?: string }> => {
    const map: Record<string, { value: number; label?: string }> = {};
    charVars.forEach((v, i) => {
      const score = sampleScore(i);
      const tr = v.valueTranslations?.find((t) => t.value === score);
      map[v.name] = { value: score, label: tr ? localize(tr.label, locale) : undefined };
    });
    return map;
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onPagesDragEnd}>
            <SortableContext items={pages.map((p) => `rp:${p.id}`)} strategy={verticalListSortingStrategy}>
            {pages.map((page, pi) => (
              <SortablePageCard
                key={page.id}
                id={`rp:${page.id}`}
                isActive={pi === active}
              >
                {(pageHandle) => (
                <>
                {/* Page header */}
                <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
                  {pageHandle}
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
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onBlocksDragEnd(pi)}>
                      <SortableContext items={page.components.map((c) => `rc:${c.id}`)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {page.components.map((c) => (
                            <SortableBlock key={c.id} id={`rc:${c.id}`}>
                              {(blockHandle) => (
                                <ComponentConfig
                                  component={c}
                                  charVars={charVars}
                                  mappings={mappings}
                                  onUpdate={(partial) => updateComponent(pi, c.id, partial)}
                                  onRemove={() => removeComponent(pi, c.id)}
                                  handle={blockHandle}
                                />
                              )}
                            </SortableBlock>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
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
                </>
                )}
              </SortablePageCard>
            ))}
            </SortableContext>
            </DndContext>
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
                        vars={sampleVars()}
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
  handle,
}: {
  component: ResultComponent;
  charVars: Variable[];
  mappings: CatalogMapping[];
  onUpdate: (partial: Partial<ResultComponent>) => void;
  onRemove: () => void;
  handle?: React.ReactNode;
}) {
  const { t, locale } = useLocale();
  const def = COMPONENT_TYPES.find((x) => x.type === c.type)!;
  const updateOptions = (partial: Partial<NonNullable<ResultComponent["options"]>>) =>
    onUpdate({ options: { ...c.options, ...partial } });

  const header = (
    <div className="mb-3 flex flex-wrap items-end gap-3">
      {handle && <div className="flex h-8 items-center">{handle}</div>}
      <Param label={t("cm.resultView.component")}>
        <span className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[0.78rem]">
          <def.icon className="h-3.5 w-3.5 text-muted-foreground" />
          {t(def.key)}
        </span>
      </Param>
      {def.group !== "text" && def.group !== "divider" && (
        <LocalizedInput
          label={t("cm.resultView.title")}
          value={c.title}
          onChange={(v) => onUpdate({ title: v })}
          placeholder={t("cm.resultView.titlePlaceholder")}
          className="flex-1"
        />
      )}
      <Button variant="ghost" size="icon-sm" onClick={onRemove} className="ml-auto text-muted-foreground hover:text-red-500 hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // ── Divider: just the header ──
  if (def.group === "divider") {
    return (
      <div className="rounded-xl border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          {handle && <div className="flex h-8 items-center">{handle}</div>}
          <Param label={t("cm.resultView.component")}>
            <span className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[0.78rem]">
              <def.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {t(def.key)}
            </span>
          </Param>
          <span className="flex-1 text-[0.72rem] text-muted-foreground">{t("cm.resultView.descDivider")}</span>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} className="ml-auto text-muted-foreground hover:text-red-500 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Text: a {var} template ──
  if (def.group === "text") {
    return (
      <div className="rounded-xl border bg-muted/30 p-3">
        {header}
        <LocalizedInput
          label={c.type === "heading" ? t("cm.resultView.headingText") : t("cm.resultView.template")}
          value={c.content ?? { en: "", ru: "", kz: "" }}
          onChange={(v) => onUpdate({ content: v })}
          placeholder={t("cm.resultView.templatePlaceholder")}
        />
        <p className="mt-1 text-[0.66rem] text-muted-foreground">
          {t("cm.resultView.templateHint")} — {charVars.slice(0, 4).map((v) => `{${v.name}}`).join(" ")}
        </p>
      </div>
    );
  }

  // ── Catalog matching: mapping + which parameter ──
  if (def.group === "catalog") {
    const fields = c.binding.mappingId
      ? (() => {
          const m = mappings.find((x) => x.id === c.binding.mappingId);
          return m ? catalogFields(m.catalogId) : [];
        })()
      : [];
    return (
      <div className="rounded-xl border bg-muted/30 p-3">
        {header}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <Param label={t("cm.resultView.fromMapping")}>
            <Select
              value={c.binding.mappingId ?? ""}
              onValueChange={(v) => onUpdate({ binding: { kind: "mapping", mappingId: v ?? undefined } })}
            >
              <SelectTrigger size="sm" className="w-48">
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

          <Param label={t("cm.resultView.parameter")}>
            <Select value={c.catalogFieldId ?? "name"} onValueChange={(v) => onUpdate({ catalogFieldId: v ?? "name" })}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue>
                  {() => localize(fields.find((f) => f.id === (c.catalogFieldId ?? "name"))?.label ?? { en: "Name", ru: "", kz: "" }, locale)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{localize(f.label, locale)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Param>

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
        </div>
      </div>
    );
  }

  // ── Single numeric variable ──
  if (def.group === "single") {
    return (
      <div className="rounded-xl border bg-muted/30 p-3">
        {header}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <Param label={t("cm.resultView.variable")}>
            <VariableSelect
              variables={charVars}
              numericOnly
              value={c.binding.kind === "variable" ? c.binding.variableName : undefined}
              onChange={(name) =>
                onUpdate({ binding: name ? { kind: "variable", variableName: name } : { kind: "characteristics" } })
              }
              placeholder={t("cm.resultView.topAuto")}
            />
          </Param>
          {c.type === "gauge" && (
            <Param label={t("cm.resultView.maxScale")}>
              <Input
                type="number"
                min={0}
                value={c.options?.maxScale ?? 0}
                onChange={(e) => updateOptions({ maxScale: Math.max(0, parseInt(e.target.value) || 0) })}
                placeholder="100"
                className="h-8 w-20"
              />
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
        </div>
      </div>
    );
  }

  // ── Multi numeric variables (charts) ──
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      {header}
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("cm.resultView.variables")}
          </label>
          <VariableMultiSelect
            variables={charVars}
            numericOnly
            value={c.variableNames ?? []}
            onChange={(names) => onUpdate({ variableNames: names })}
            onReorder={() => updateOptions({ sort: "as_is" })}
          />
        </div>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
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
    </div>
  );
}

// Sortable page card — renders children with a drag handle injected into the header.
function SortablePageCard({
  id,
  isActive,
  children,
}: {
  id: string;
  isActive: boolean;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const handle = (
    <button
      {...attributes}
      {...listeners}
      className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      title="Drag to reorder page"
      aria-label="Drag to reorder page"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("rounded-lg border", isActive ? "border-primary/40" : "border-border", isDragging && "opacity-50")}
    >
      {children(handle)}
    </div>
  );
}

// Sortable block wrapper — injects a drag handle into the ComponentConfig header.
function SortableBlock({ id, children }: { id: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const handle = (
    <button
      {...attributes}
      {...listeners}
      className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      title="Drag to reorder block"
      aria-label="Drag to reorder block"
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      {children(handle)}
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
