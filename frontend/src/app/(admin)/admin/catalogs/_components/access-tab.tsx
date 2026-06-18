"use client";

// Standard "Access" tab on every catalog detail page: pick which users may edit
// this item. Stored on the item as a list of user ids (params.access).

import { Check } from "lucide-react";
import { USERS } from "@/lib/users";
import { cn } from "@/lib/utils";

interface Props {
  editors: number[];
  onChange: (ids: number[]) => void;
}

export function AccessTab({ editors, onChange }: Props) {
  const toggle = (id: number) =>
    onChange(editors.includes(id) ? editors.filter((x) => x !== id) : [...editors, id]);

  return (
    <div className="max-w-2xl">
      <p className="mb-5 text-[0.78rem] text-gray-500">
        Choose which users are allowed to edit this item.
      </p>
      <div className="space-y-2">
        {USERS.map((u) => {
          const on = editors.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                on ? "border-teal-300 bg-teal-50/50" : "border-gray-200 hover:bg-gray-50",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  on ? "border-teal-500 bg-teal-500 text-white" : "border-gray-300",
                )}
              >
                {on && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900">{u.login}</span>
                <span className="block truncate text-xs text-gray-400">
                  {u.email ? `${u.email} · ` : ""}
                  {u.role}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
