"use client";

import { useSearchParams } from "next/navigation";
import type { MockMode } from "./mock-data";

const MODES: { key: MockMode; label: string }[] = [
  { key: "full", label: "All Tests" },
  { key: "partial", label: "Partial" },
  { key: "none", label: "No Tests" },
];

export function ModeSwitcher() {
  const searchParams = useSearchParams();
  const current = (searchParams.get("mode") as MockMode) || "full";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full bg-gray-900/90 backdrop-blur-sm px-1.5 py-1.5 shadow-xl">
      {MODES.map((m) => (
        <a
          key={m.key}
          href={`/professions?mode=${m.key}`}
          className={
            "rounded-full px-3 py-1 text-[0.72rem] font-medium transition-all duration-200 " +
            (current === m.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-200")
          }
        >
          {m.label}
        </a>
      ))}
    </div>
  );
}
