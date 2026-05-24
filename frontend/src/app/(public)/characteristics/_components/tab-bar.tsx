import type { CategoryKey } from "./mock-data";

interface Tab {
  key: CategoryKey;
  label: string;
  disabled: boolean;
}

interface Props {
  tabs: Tab[];
  active: CategoryKey;
  onSelect: (key: CategoryKey) => void;
}

export function TabBar({ tabs, active, onSelect }: Props) {
  return (
    <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onSelect(tab.key)}
          className={
            "relative shrink-0 px-5 py-2.5 text-[0.84rem] font-medium transition-all duration-200 border-b-2 -mb-px " +
            (tab.disabled
              ? "text-gray-300 cursor-default border-transparent"
              : active === tab.key
                ? "text-gray-900 border-gray-900"
                : "text-gray-400 border-transparent hover:text-gray-600")
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
