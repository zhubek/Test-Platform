"use client";

import { useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { tagColor } from "@/lib/tag-color";
import { cn } from "@/lib/utils";
import { availableVisibilityTags } from "../../../_components/mock-data";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function VisibilityTagsField({ value, onChange }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  const add = (tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) {
      setInput("");
      return;
    }
    onChange([...value, t]);
    setInput("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  // Existing tags not yet selected, filtered by what's typed.
  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    return availableVisibilityTags
      .filter((t) => !value.includes(t))
      .filter((t) => (q ? t.toLowerCase().includes(q) : true));
  }, [input, value]);

  const canCreate =
    input.trim() !== "" &&
    !availableVisibilityTags.includes(input.trim()) &&
    !value.includes(input.trim());

  return (
    <div className="relative max-w-md">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-medium",
              tagColor(tag),
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="opacity-60 hover:opacity-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              add(input);
            }
            if (e.key === "Backspace" && !input && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? "Add visibility tags…" : ""}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && (suggestions.length > 0 || canCreate) && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-popover py-1 shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-muted"
            >
              {s}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(input);
              }}
              className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm text-primary hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              Create &ldquo;{input.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
