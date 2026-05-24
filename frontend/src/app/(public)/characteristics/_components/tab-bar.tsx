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
    <div className="flex gap-0 border-b mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onSelect(tab.key)}
          className={
            "relative shrink-0 px-5 py-2.5 text-[0.84rem] font-medium transition-all duration-200 border-b-2 -mb-px " +
            (tab.disabled
              ? "text-muted-foreground/50 cursor-default border-transparent"
              : active === tab.key
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground")
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
