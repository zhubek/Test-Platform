"use client";

import { useState, useRef, useEffect } from "react";
import { BarChart3, PieChart, BarChart, Table, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { VisualizationType } from "../_components/mock-data";

const optionDefs: { value: VisualizationType; labelKey: string; icon: typeof BarChart3 }[] = [
  { value: "bar", labelKey: "cm.chartType.bar", icon: BarChart3 },
  { value: "pie", labelKey: "cm.chartType.pie", icon: PieChart },
  { value: "histogram", labelKey: "cm.chartType.histogram", icon: BarChart },
  { value: "table", labelKey: "cm.chartType.table", icon: Table },
];

interface Props {
  value: VisualizationType;
  onChange: (value: VisualizationType) => void;
}

export function ChartTypePicker({ value, onChange }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = optionDefs.find((o) => o.value === value)!;
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[0.78rem] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <CurrentIcon className="w-3.5 h-3.5 text-gray-500" />
        {t(current.labelKey)}
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 min-w-[160px] bg-white rounded-xl border border-black/[0.04] shadow-xl py-1.5 z-20 animate-slide-down">
          {optionDefs.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center gap-2 px-3 py-2 text-[0.8rem] transition-colors " +
                  (opt.value === value
                    ? "bg-teal-50 text-teal-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50")
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
