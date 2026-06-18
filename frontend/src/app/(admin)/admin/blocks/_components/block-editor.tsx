"use client";

// The block authoring surface: write a component in HTML + Tailwind, declare
// its props (which become live controls), and preview it. Used by the block
// editor page; persists through the `onSave` callback.

import { useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Block, BlockProp } from "@/lib/backend";
import { type BlockResolver } from "@/lib/view-renderer";
import { ResolvedViewRenderer } from "@/lib/resolved-view";
import { CatalogRefControl } from "./catalog-ref-control";
import { JsonPropControl } from "./json-prop-control";
import { useContentLanguages } from "@/lib/project-context";
import type { Locale } from "@/lib/i18n";
import type { Localized } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PropType = BlockProp["type"];
type PropValue = string | number | boolean | string[] | unknown[] | Record<string, unknown>;

// Blocks are pure templates: props hold static sample values only. Data
// bindings (database queries / runtime context) belong to block *instances* —
// e.g. questions in the test builder — not to the block definitions here.
interface PropDef {
  id: string;
  name: string;
  type: PropType;
  value: PropValue;
}

const TYPES: PropType[] = ["text", "number", "boolean", "color", "list", "json", "ref"];

function defaultFor(type: PropType): PropValue {
  switch (type) {
    case "number": return 0;
    case "boolean": return false;
    case "color": return "#0d9488";
    case "list": return [];
    case "json": return [];
    case "ref": return { $catalog: "universities", ids: [] };
    case "text": return {}; // a Localized map (translated leaf)
    default: return "";
  }
}

// Controls start from the saved sample values (falling back to declared
// prop defaults for rows that predate sample_props).
function toDefs(props: BlockProp[], sampleProps?: Record<string, unknown> | null): PropDef[] {
  return props.map((p, i) => ({
    id: `p${i}`,
    name: p.name,
    type: p.type,
    value: (sampleProps && p.name in sampleProps ? sampleProps[p.name] : p.value) as PropValue,
  }));
}

export interface BlockEditorSave {
  name: string;
  description: string;
  html: string;
  props: BlockProp[];
  sampleProps: Record<string, unknown>;
}

export function BlockEditor({
  block,
  onSave,
  saving,
  resolveBlock,
}: {
  block: Block;
  onSave: (patch: BlockEditorSave) => void;
  saving?: boolean;
  resolveBlock?: BlockResolver;
}) {
  const [name, setName] = useState(block.name);
  const [description, setDescription] = useState(block.description ?? "");
  const [template, setTemplate] = useState(block.html);
  const [props, setProps] = useState<PropDef[]>(toDefs(block.props, block.sampleProps));
  const idRef = useRef(props.length + 100);

  const propsObject = useMemo(() => {
    const o: Record<string, unknown> = {};
    for (const p of props) if (p.name.trim()) o[p.name.trim()] = p.value;
    return o;
  }, [props]);

  const addProp = () =>
    setProps((ps) => [...ps, { id: `p${++idRef.current}`, name: "", type: "text", value: "" }]);
  const update = (id: string, patch: Partial<PropDef>) =>
    setProps((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => setProps((ps) => ps.filter((p) => p.id !== id));

  const named = props.filter((p) => p.name.trim());

  const save = () =>
    onSave({
      name: name.trim() || "Untitled block",
      description,
      html: template,
      props: named.map(({ name, type, value }) => ({ name: name.trim(), type, value })),
      // The control values are the block's sample data.
      sampleProps: propsObject,
    });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </span>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this block for?"
              className="h-9"
            />
          </label>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save block"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel title="Template (HTML + Tailwind)">
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              spellCheck={false}
              className="h-[42vh] w-full resize-none bg-gray-950 p-4 font-mono text-[0.78rem] leading-relaxed text-gray-100 outline-none"
            />
            <div className="border-t px-3 py-2 text-[0.66rem] text-muted-foreground">
              Bind a prop: <code className="font-mono">{"{{prop}}"}</code> · repeat a list:{" "}
              <code className="font-mono">data-each=&quot;listProp&quot;</code> with{" "}
              <code className="font-mono">{"{{item}}"}</code>
            </div>
          </Panel>

          <Panel title="Props">
            <div className="space-y-2 p-3">
              {props.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Input
                    value={p.name}
                    onChange={(e) => update(p.id, { name: e.target.value })}
                    placeholder="propName"
                    className="h-8 w-36 font-mono text-xs"
                  />
                  <Select
                    value={p.type}
                    onValueChange={(v) => update(p.id, { type: v as PropType, value: defaultFor(v as PropType) })}
                  >
                    <SelectTrigger size="sm" className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(p.id)}
                    className="ml-auto text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addProp} className="text-primary hover:text-teal-700">
                <Plus className="h-3.5 w-3.5" /> Add prop
              </Button>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Controls">
            <div className="space-y-3 p-4">
              {named.length === 0 ? (
                <p className="text-xs text-muted-foreground">Declare props on the left to get controls.</p>
              ) : (
                named.map((p) => (
                  <PropControl key={p.id} prop={p} onChange={(value) => update(p.id, { value: value as PropValue })} />
                ))
              )}
            </div>
          </Panel>

          <Panel title="Preview">
            <div className="p-6">
              <ResolvedViewRenderer template={template} props={propsObject} resolveBlock={resolveBlock} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// One typed control for a declared prop. Also reused by block *instances*
// (e.g. catalog pages) to edit per-instance prop values. `fixedRefCatalog`
// locks ref props to the catalog the block was designed for (instance editing).
// Coerce a stored text prop value (legacy plain string or a Localized map) to a map.
function asLocalizedMap(v: unknown): Localized {
  if (v && typeof v === "object" && !Array.isArray(v)) return { ...(v as Record<string, string>) };
  if (typeof v === "string") return v ? { en: v } : {};
  return {};
}

// A text prop is a translated leaf: one input with language chips driven by the
// current project's languages. Stores a Localized map keyed by language code.
function LocalizedPropInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const map = asLocalizedMap(value);
  const { codes, default: defaultLang } = useContentLanguages();
  const [lang, setLang] = useState<Locale>(defaultLang);
  const activeLang = codes.includes(lang) ? lang : codes[0];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-0.5">
        {codes.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase transition-colors",
              activeLang === code ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
          >
            {code}
            {code !== activeLang && !map[code] && (
              <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />
            )}
          </button>
        ))}
      </div>
      <Input
        value={map[activeLang] ?? ""}
        onChange={(e) => onChange({ ...map, [activeLang]: e.target.value })}
        className="h-8"
      />
    </div>
  );
}

export function PropControl({
  prop,
  onChange,
  fixedRefCatalog,
}: {
  prop: { name: string; type: PropType; value: unknown };
  onChange: (v: unknown) => void;
  fixedRefCatalog?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {prop.name}
      </label>
      {prop.type === "text" && (
        <LocalizedPropInput value={prop.value} onChange={onChange} />
      )}
      {prop.type === "number" && (
        <Input
          type="number"
          value={String(prop.value)}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="h-8 w-32"
        />
      )}
      {prop.type === "color" && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(prop.value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-gray-200"
          />
          <Input value={String(prop.value)} onChange={(e) => onChange(e.target.value)} className="h-8 w-28 font-mono text-xs" />
        </div>
      )}
      {prop.type === "boolean" && (
        <button
          type="button"
          onClick={() => onChange(!prop.value)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            prop.value ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {prop.value ? "true" : "false"}
        </button>
      )}
      {prop.type === "list" && (
        <Input
          value={(prop.value as string[]).join(", ")}
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="comma, separated, values"
          className="h-8"
        />
      )}
      {prop.type === "json" && <JsonPropControl value={prop.value} onChange={onChange} />}
      {prop.type === "ref" && (
        <CatalogRefControl value={prop.value} onChange={onChange} fixedCatalog={fixedRefCatalog} />
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-3 py-2 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}
