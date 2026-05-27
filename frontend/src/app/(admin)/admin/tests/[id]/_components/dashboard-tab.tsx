"use client";

import { useState } from "react";
import {
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, X, GripVertical, Code2, Copy, Check, Lock,
  BarChart3, PieChart, Radar, Table, Trophy, AlignLeft, Code,
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
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LocalizedInput } from "@/components/localized-input";
import { cn } from "@/lib/utils";
import { WidgetPreview } from "./widget-preview";
import { buildDashboardJson, DASHBOARD_SCOPE_SUFFIX } from "@/lib/dashboard-json";
import type { DashboardPage, DashboardBlock, WidgetComponentType } from "../../../_components/mock-data";

interface Props {
  pages: DashboardPage[];
  onChange: (pages: DashboardPage[]) => void;
}

const CHART_TYPES: { type: WidgetComponentType; icon: typeof BarChart3; key: string; descKey: string }[] = [
  { type: "bar_chart", icon: BarChart3, key: "cm.dashboard.typeBar", descKey: "cm.dashboard.descBar" },
  { type: "pie_chart", icon: PieChart, key: "cm.dashboard.typePie", descKey: "cm.dashboard.descPie" },
  { type: "radar_chart", icon: Radar, key: "cm.dashboard.typeRadar", descKey: "cm.dashboard.descRadar" },
  { type: "score_table", icon: Table, key: "cm.dashboard.typeTable", descKey: "cm.dashboard.descTable" },
  { type: "stat_card", icon: Trophy, key: "cm.dashboard.typeStat", descKey: "cm.dashboard.descStat" },
  { type: "summary_text", icon: AlignLeft, key: "cm.dashboard.typeSummary", descKey: "cm.dashboard.descSummary" },
  { type: "custom_html", icon: Code, key: "cm.dashboard.typeHtml", descKey: "cm.dashboard.descHtml" },
];

const DEFAULT_SQL = "SELECT name, COUNT(*) AS value\nFROM characteristic_scores\nGROUP BY name";
const SAMPLE_LABELS = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"];

function mockRows(sql: string): Record<string, string | number>[] {
  if (!sql || !/SELECT[\s\S]+FROM/i.test(sql)) return [];
  return SAMPLE_LABELS.map((label, i) => ({ label, value: Math.round(40 + ((i * 53) % 60)) }));
}

export function DashboardTab({ pages, onChange }: Props) {
  const { t, locale } = useLocale();
  const [active, setActive] = useState(0);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [pickerPage, setPickerPage] = useState<number | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const json = JSON.stringify(buildDashboardJson(pages), null, 2);

  const activePage = pages[Math.min(active, Math.max(0, pages.length - 1))];

  // ── Page handlers ──
  const addPage = () => {
    onChange([...pages, { id: `dp_${Date.now()}`, title: { en: "", ru: "", kz: "" }, widgets: [] }]);
    setActive(pages.length);
  };
  const updatePage = (pi: number, partial: Partial<DashboardPage>) =>
    onChange(pages.map((p, i) => (i === pi ? { ...p, ...partial } : p)));
  const deletePage = (pi: number) => {
    onChange(pages.filter((_, i) => i !== pi));
    setActive((a) => Math.max(0, Math.min(a, pages.length - 2)));
  };

  // ── Widget handlers ──
  const setWidgets = (pi: number, widgets: DashboardBlock[]) => updatePage(pi, { widgets });
  const addWidget = (pi: number, type: WidgetComponentType) =>
    setWidgets(pi, [
      ...pages[pi].widgets,
      { id: `dw_${Date.now()}`, componentType: type, title: { en: "", ru: "", kz: "" }, sql: DEFAULT_SQL },
    ]);
  const updateWidget = (pi: number, id: string, partial: Partial<DashboardBlock>) =>
    setWidgets(pi, pages[pi].widgets.map((w) => (w.id === id ? { ...w, ...partial } : w)));
  const removeWidget = (pi: number, id: string) =>
    setWidgets(pi, pages[pi].widgets.filter((w) => w.id !== id));

  // ── Drag ──
  const onPagesDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const from = pages.findIndex((p) => `dp:${p.id}` === a.id);
    const to = pages.findIndex((p) => `dp:${p.id}` === over.id);
    if (from !== -1 && to !== -1) {
      onChange(arrayMove(pages, from, to));
      setActive(to);
    }
  };
  const onWidgetsDragEnd = (pi: number) => (e: DragEndEvent) => {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const ws = pages[pi].widgets;
    const from = ws.findIndex((w) => `dw:${w.id}` === a.id);
    const to = ws.findIndex((w) => `dw:${w.id}` === over.id);
    if (from !== -1 && to !== -1) updatePage(pi, { widgets: arrayMove(ws, from, to) });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── Left: constructor ── */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="text-sm font-semibold">
            {showJson ? t("cm.dashboard.jsonHeading") : t("cm.dashboard.heading")}
          </span>
          {!showJson && (
            <span className="text-[0.7rem] text-muted-foreground">
              {pages.length} page{pages.length !== 1 && "s"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {showJson ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(json);
                    setJsonCopied(true);
                    setTimeout(() => setJsonCopied(false), 1500);
                  }}
                >
                  {jsonCopied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                  {jsonCopied ? t("common.copied") : t("common.copy")}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowJson(false)} title={t("cm.dashboard.closeJson")}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={addPage} className="text-primary hover:text-teal-700">
                  <Plus className="h-3.5 w-3.5" /> {t("cm.dashboard.addPage")}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowJson(true)} title={t("cm.dashboard.viewJson")} className="text-muted-foreground hover:text-foreground">
                  <Code2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {showJson ? (
          <pre className="max-h-[72vh] overflow-auto bg-muted/20 p-4 font-mono text-[0.72rem] leading-relaxed text-foreground">
            {json}
          </pre>
        ) : (
          <div className="max-h-[72vh] space-y-3 overflow-auto p-3">
            {pages.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-[0.78rem] text-muted-foreground">
                {t("cm.dashboard.empty")}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onPagesDragEnd}>
                <SortableContext items={pages.map((p) => `dp:${p.id}`)} strategy={verticalListSortingStrategy}>
                  {pages.map((page, pi) => (
                    <SortableCard key={page.id} id={`dp:${page.id}`} isActive={pi === active}>
                      {(pageHandle) => (
                        <>
                          <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
                            {pageHandle}
                            {editingTitle === pi ? (
                              <LocalizedInput
                                value={page.title}
                                onChange={(v) => updatePage(pi, { title: v })}
                                placeholder={t("cm.dashboard.pageTitle")}
                                className="flex-1"
                              />
                            ) : (
                              <button onClick={() => setActive(pi)} className="flex-1 text-left text-sm font-semibold">
                                <span className="text-muted-foreground">{pi + 1}. </span>
                                {localize(page.title, locale) || `${t("cm.dashboard.page")} ${pi + 1}`}
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">({page.widgets.length})</span>
                              </button>
                            )}
                            <Button variant="ghost" size="icon-xs" onClick={() => setEditingTitle(editingTitle === pi ? null : pi)} title={t("cm.dashboard.renamePage")}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => deletePage(pi)} className="text-muted-foreground hover:text-red-500" title={t("cm.dashboard.deletePage")}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="space-y-3 p-2.5">
                            {page.widgets.length === 0 ? (
                              <p className="py-3 text-center text-[0.72rem] text-muted-foreground">{t("cm.dashboard.pageEmpty")}</p>
                            ) : (
                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onWidgetsDragEnd(pi)}>
                                <SortableContext items={page.widgets.map((w) => `dw:${w.id}`)} strategy={verticalListSortingStrategy}>
                                  <div className="space-y-3">
                                    {page.widgets.map((w) => (
                                      <SortableCard key={w.id} id={`dw:${w.id}`} bare>
                                        {(handle) => (
                                          <WidgetConfig
                                            widget={w}
                                            onUpdate={(p) => updateWidget(pi, w.id, p)}
                                            onRemove={() => removeWidget(pi, w.id)}
                                            handle={handle}
                                          />
                                        )}
                                      </SortableCard>
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setPickerPage(pi)} className="w-full border-dashed text-muted-foreground hover:border-teal-300 hover:text-primary">
                              <Plus className="h-3.5 w-3.5" /> {t("cm.dashboard.addBlock")}
                            </Button>
                          </div>
                        </>
                      )}
                    </SortableCard>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}
      </div>

      {/* ── Right: live preview ── */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">{t("cm.dashboard.preview")}</div>
        <div className="max-h-[72vh] overflow-auto p-5">
          {pages.length === 0 || !activePage ? (
            <p className="py-10 text-center text-[0.78rem] text-muted-foreground">{t("cm.dashboard.previewEmpty")}</p>
          ) : (
            <>
              {pages.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {pages.map((p, i) => (
                    <button key={p.id} onClick={() => setActive(i)} className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition-colors", i === active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {i + 1}. {localize(p.title, locale) || `${t("cm.dashboard.page")} ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}
              <h2 className="mb-4 text-lg font-bold tracking-tight">
                {localize(activePage.title, locale) || `${t("cm.dashboard.page")} ${active + 1}`}
              </h2>
              {activePage.widgets.length === 0 ? (
                <p className="py-10 text-center text-[0.78rem] text-muted-foreground">{t("cm.dashboard.pageEmpty")}</p>
              ) : (
                <div className="space-y-4">
                  {activePage.widgets.map((w) => (
                    <div key={w.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                      <WidgetPreview componentType={w.componentType} title={w.title} rows={mockRows(w.sql)} params={[]} />
                    </div>
                  ))}
                </div>
              )}
              {pages.length > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <Button variant="outline" size="sm" disabled={active === 0} onClick={() => setActive(active - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> {t("cm.dashboard.prev")}
                  </Button>
                  <span className="text-xs text-muted-foreground">{active + 1} / {pages.length}</span>
                  <Button variant="outline" size="sm" disabled={active === pages.length - 1} onClick={() => setActive(active + 1)}>
                    {t("cm.dashboard.next")} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {pickerPage !== null && (
        <BlockPicker
          onCancel={() => setPickerPage(null)}
          onPick={(type) => {
            addWidget(pickerPage, type);
            setPickerPage(null);
          }}
        />
      )}
    </div>
  );
}

// ── Widget config (chart type + title + SQL + read-only scope suffix) ──
function WidgetConfig({
  widget: w,
  onUpdate,
  onRemove,
  handle,
}: {
  widget: DashboardBlock;
  onUpdate: (partial: Partial<DashboardBlock>) => void;
  onRemove: () => void;
  handle?: React.ReactNode;
}) {
  const { t } = useLocale();
  const def = CHART_TYPES.find((c) => c.type === w.componentType)!;
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        {handle && <div className="flex h-8 items-center">{handle}</div>}
        <div className="flex flex-col gap-1">
          <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">{t("cm.dashboard.chart")}</label>
          <span className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[0.78rem]">
            <def.icon className="h-3.5 w-3.5 text-muted-foreground" />
            {t(def.key)}
          </span>
        </div>
        <LocalizedInput
          label={t("cm.dashboard.title")}
          value={w.title}
          onChange={(v) => onUpdate({ title: v })}
          placeholder={t("cm.dashboard.titlePlaceholder")}
          className="flex-1"
        />
        <Button variant="ghost" size="icon-sm" onClick={onRemove} className="ml-auto text-muted-foreground hover:text-red-500 hover:bg-red-50">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* SQL editor + read-only appended scope suffix */}
      <label className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">{t("cm.dashboard.sql")}</label>
      <Textarea
        value={w.sql}
        onChange={(e) => onUpdate({ sql: e.target.value })}
        rows={3}
        spellCheck={false}
        className="resize-y bg-gray-950 font-mono text-[0.75rem] leading-relaxed text-gray-100 placeholder:text-gray-500"
      />
      <div className="mt-1 flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[0.7rem] text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" />
        <span className="truncate">{DASHBOARD_SCOPE_SUFFIX}</span>
        <span className="ml-auto shrink-0 text-[0.6rem] uppercase tracking-wider opacity-60">{t("cm.dashboard.autoAppended")}</span>
      </div>
    </div>
  );
}

// ── Add-block (chart) picker modal ──
function BlockPicker({ onCancel, onPick }: { onCancel: () => void; onPick: (type: WidgetComponentType) => void }) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative mx-4 max-h-[85vh] w-full max-w-xl space-y-3 overflow-auto rounded-xl bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-[0.9rem] font-semibold">{t("cm.dashboard.addBlock")}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CHART_TYPES.map((b) => (
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
    </div>
  );
}

// ── Sortable card wrapper (page or widget) with injected drag handle ──
function SortableCard({
  id,
  isActive,
  bare,
  children,
}: {
  id: string;
  isActive?: boolean;
  bare?: boolean;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const handle = (
    <button
      {...attributes}
      {...listeners}
      className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      title="Drag to reorder"
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(!bare && "rounded-lg border", !bare && (isActive ? "border-primary/40" : "border-border"), isDragging && "opacity-50")}
    >
      {children(handle)}
    </div>
  );
}
