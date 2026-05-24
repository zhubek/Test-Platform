"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { mockScenarios, type MockMode } from "./mock-data";

const modes = Object.entries(mockScenarios) as [MockMode, (typeof mockScenarios)[MockMode]][];

export function ModeSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("mode") as MockMode) || "full";

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gray-900/90 backdrop-blur-xl p-1 shadow-2xl shadow-black/20">
      {modes.map(([key, scenario]) => (
        <button
          key={key}
          onClick={() => router.push(`/characteristics?mode=${key}`)}
          title={scenario.description}
          className={
            "rounded-full px-3.5 py-1.5 text-[0.72rem] font-medium transition-all duration-200 " +
            (current === key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-white")
          }
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
}
