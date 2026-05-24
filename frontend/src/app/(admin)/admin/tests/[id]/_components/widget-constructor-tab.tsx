"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, GripVertical, RefreshCw, HelpCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { LocalizedInput } from "@/components/localized-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Widget, WidgetComponentType } from "../../../_components/mock-data";
import { widgetComponents } from "../../../_components/mock-data";
import type { Localized } from "@/lib/localized";
import { WidgetPreview, CustomHtmlPreview } from "./widget-preview";

interface Props {
  heading: string;
  subheading: string;
  widgets: Widget[];
  onChange: (widgets: Widget[]) => void;
  defaultSql?: string;
}

// ── Helper: generate mock rows from SQL columns ─────────────────

const SAMPLE_LABELS = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising"];

function generateMockRows(sql: string | undefined): Record<string, string | number>[] {
  if (!sql || !sql.match(/SELECT\s+.+\s+FROM/i)) return [];

  return Array.from({ length: 5 }, (_, i) => ({
    label: SAMPLE_LABELS[i],
    value: Math.round(Math.random() * 100 * 10) / 10,
  }));
}

// ── SQL Example Output Table ────────────────────────────────────

function SqlExampleTable({ rows }: { rows: Record<string, string | number>[] }) {
  if (rows.length === 0) {
    return (
      <span className="text-[0.7rem] text-muted-foreground italic">
        Write a SELECT query to see example output
      </span>
    );
  }
  const cols = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.7rem]">
        <thead>
          <tr className="border-b">
            {cols.map((col) => (
              <th key={col} className="text-left py-1.5 px-2 text-muted-foreground font-medium font-mono">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border">
              {cols.map((col) => (
                <td key={col} className="py-1 px-2 text-foreground font-mono">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Single Widget Card ──────────────────────────────────────────

function WidgetCard({
  widget,
  index,
  previewKey,
  onTitleChange,
  onSqlChange,
  onParamChange,
  onDelete,
  onRefresh,
}: {
  widget: Widget;
  index: number;
  previewKey: number;
  onTitleChange: (index: number, title: Localized) => void;
  onSqlChange: (index: number, sql: string) => void;
  onParamChange: (index: number, key: string, value: string) => void;
  onDelete: (index: number) => void;
  onRefresh: () => void;
}) {
  const { t, locale } = useLocale();
  const def = widgetComponents.find((c) => c.type === widget.componentType);
  const isCustomHtml = widget.componentType === "custom_html";
  const mockRows = useMemo(
    () => generateMockRows(widget.sql),
    [widget.sql, previewKey]
  );

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
        <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
          {def ? localize(def.name, locale) : widget.componentType}
        </span>
        <LocalizedInput
          value={widget.title}
          onChange={(v) => onTitleChange(index, v)}
          placeholder={t("cm.widgets.titlePlaceholder")}
          className="flex-1 font-medium"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(index)}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Body: Left (SQL + example + HTML editor) | Right (preview) */}
      <div className="grid grid-cols-[1fr_380px] divide-x">
        {/* Left column */}
        <div className="divide-y">
          {/* SQL editor */}
          <div className="px-4 py-3">
            <label className="block text-[0.72rem] font-medium text-muted-foreground mb-1">
              {t("cm.widgets.sql")}
            </label>
            <Textarea
              value={widget.sql}
              onChange={(e) => onSqlChange(index, e.target.value)}
              rows={3}
              spellCheck={false}
              className="text-[0.75rem] font-mono text-gray-100 placeholder:text-gray-500 bg-gray-950 border-gray-700 focus-visible:border-teal-400 resize-y leading-relaxed"
            />
          </div>

          {/* Example output */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[0.72rem] font-medium text-muted-foreground">
                {t("cm.widgets.exampleOutput")}
              </label>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onRefresh}
                className="text-muted-foreground hover:text-teal-500"
                title={t("cm.widgets.refreshPreview")}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <div className="bg-muted rounded-lg border p-2 max-h-[140px] overflow-auto">
              <SqlExampleTable rows={mockRows} />
            </div>
          </div>

          {/* HTML/CSS/JS editor (custom_html only) */}
          {isCustomHtml && (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[0.72rem] font-medium text-muted-foreground">
                  {t("cm.customHtml.htmlLabel")}
                </label>
                <span className="text-[0.65rem] text-muted-foreground font-mono">
                  {t("cm.customHtml.rowsHint")}
                </span>
              </div>
              <Textarea
                value={widget.params.find((p) => p.key === "html")?.value ?? ""}
                onChange={(e) => onParamChange(index, "html", e.target.value)}
                placeholder={'<div id="chart"></div>\n<style>.bar { height: 20px; background: teal; }</style>\n<script>\n  const rows = window.__rows__;\n  // render with rows data...\n</script>'}
                rows={10}
                className="text-[0.75rem] font-mono text-gray-100 placeholder:text-gray-500 bg-gray-950 border-gray-700 focus-visible:border-teal-400 resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Right column: Preview */}
        <div className="px-3 py-3 bg-muted/30">
          <span className="block text-[0.68rem] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {t("cm.widgets.preview")}
          </span>
          {isCustomHtml ? (
            <CustomHtmlPreview
              key={`${widget.id}-${previewKey}`}
              params={widget.params}
              rows={mockRows}
            />
          ) : (
            <WidgetPreview
              key={`${widget.id}-${previewKey}`}
              componentType={widget.componentType}
              title={widget.title}
              rows={mockRows}
              params={widget.params}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

function SqlVarsTooltip() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const vars = [
    { name: ":attempt_id", desc: t("cm.widgets.varAttemptId") },
    { name: ":user_id", desc: t("cm.widgets.varUserId") },
    { name: ":organization_id", desc: t("cm.widgets.varOrgId") },
    { name: ":region_id", desc: t("cm.widgets.varRegionId") },
  ];

  return (
    <div ref={ref} className="relative inline-flex">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        className="rounded-full text-muted-foreground hover:text-teal-500 hover:bg-primary/10"
        title={t("cm.widgets.sqlVars")}
      >
        <HelpCircle className="w-4 h-4" />
      </Button>
      {open && (
        <div className="absolute z-20 top-full right-0 mt-1 w-72 bg-popover border rounded-xl shadow-lg p-3">
          <p className="text-[0.72rem] font-medium text-foreground mb-2">{t("cm.widgets.sqlVars")}</p>
          <div className="space-y-1.5">
            {vars.map((v) => (
              <div key={v.name} className="flex items-baseline gap-2">
                <code className="text-[0.68rem] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                  {v.name}
                </code>
                <span className="text-[0.68rem] text-muted-foreground">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_TEST_SQL = "SELECT name, score FROM characteristic_scores WHERE attempt_id = :attempt_id ORDER BY score DESC";

export function WidgetConstructorTab({ heading, subheading, widgets, onChange, defaultSql }: Props) {
  const { t, locale } = useLocale();
  const [addOpen, setAddOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const handleAdd = (componentType: WidgetComponentType) => {
    const def = widgetComponents.find((c) => c.type === componentType);
    if (!def) return;
    const newWidget: Widget = {
      id: `w${Date.now()}`,
      componentType,
      title: { en: "", ru: "", kz: "" },
      sql: defaultSql ?? DEFAULT_TEST_SQL,
      params: def.params.map((p) => ({ key: p.key, value: "" })),
    };
    onChange([...widgets, newWidget]);
    setAddOpen(false);
  };

  const handleDelete = (index: number) => {
    onChange(widgets.filter((_, i) => i !== index));
  };

  const handleTitleChange = (index: number, title: Localized) => {
    onChange(widgets.map((w, i) => (i === index ? { ...w, title } : w)));
  };

  const handleSqlChange = (index: number, sql: string) => {
    onChange(widgets.map((w, i) => (i === index ? { ...w, sql } : w)));
  };

  const handleParamChange = (widgetIdx: number, paramKey: string, value: string) => {
    onChange(
      widgets.map((w, i) =>
        i === widgetIdx
          ? {
              ...w,
              params: w.params.map((p) =>
                p.key === paramKey ? { ...p, value } : p
              ),
            }
          : w
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div>
            <h3 className="text-[0.88rem] font-semibold text-foreground">{heading}</h3>
            <p className="text-[0.75rem] text-muted-foreground mt-0.5">{subheading}</p>
          </div>
          <SqlVarsTooltip />
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddOpen(!addOpen)}
            className="text-primary hover:text-teal-700"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("cm.widgets.addWidget")}
          </Button>
          {addOpen && (
            <div className="absolute z-10 top-full right-0 mt-1 w-72 bg-popover border rounded-xl shadow-lg py-1 max-h-80 overflow-y-auto">
              {widgetComponents.map((comp) => (
                <button
                  key={comp.type}
                  onClick={() => handleAdd(comp.type)}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors"
                >
                  <div className="text-[0.78rem] font-medium text-foreground">
                    {localize(comp.name, locale)}
                  </div>
                  <div className="text-[0.68rem] text-muted-foreground mt-0.5">
                    {localize(comp.description, locale)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {widgets.length > 0 ? (
        <div className="space-y-3">
          {widgets.map((widget, wi) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              index={wi}
              previewKey={previewKey}
              onTitleChange={handleTitleChange}
              onSqlChange={handleSqlChange}
              onParamChange={handleParamChange}
              onDelete={handleDelete}
              onRefresh={() => setPreviewKey((k) => k + 1)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[0.78rem] text-muted-foreground border border-dashed rounded-xl">
          {t("cm.widgets.noWidgets")}
        </div>
      )}
    </div>
  );
}
