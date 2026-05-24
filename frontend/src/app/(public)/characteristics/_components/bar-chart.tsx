"use client";

import { Info } from "lucide-react";
import type { CharacteristicItem } from "./mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

interface Props {
  item: CharacteristicItem;
  index: number;
}

export function BarChart({ item, index }: Props) {
  const { locale } = useLocale();

  return (
    <div
      className="animate-fade-up flex items-center gap-3"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Label + tooltip */}
      <div className="group/info relative w-[120px] md:w-[140px] shrink-0 text-right">
        <span className="text-[0.82rem] font-medium text-gray-700">
          {localize(item.label, locale)}
        </span>
        <span className="relative ml-1 inline-flex cursor-default">
          <Info className="h-3.5 w-3.5 text-gray-300 hover:text-gray-500 transition-colors" />
          <span className="pointer-events-none invisible group-hover/info:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-[0.75rem] leading-relaxed text-white shadow-lg z-20">
            {localize(item.desc, locale)}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </span>
        </span>
      </div>

      {/* Bar track + fill */}
      <div className="flex-1 h-7 rounded-md bg-blue-50 overflow-hidden">
        <div
          className="animate-bar-fill h-full rounded-md bg-gradient-to-r from-blue-500 to-blue-600"
          style={{
            width: `${item.value}%`,
            animationDelay: `${index * 80 + 200}ms`,
          }}
        />
      </div>

      {/* Value */}
      <span className="w-[40px] shrink-0 text-right text-[0.82rem] font-semibold text-gray-700">
        {item.value}%
      </span>
    </div>
  );
}
