import { Trash2 } from "lucide-react";
import { LocalizedInput } from "@/components/localized-input";
import type { Variable } from "../../../_components/mock-data";

interface Props {
  variable: Variable;
  onChange: (partial: Partial<Variable>) => void;
  onDelete: () => void;
}

export function VariableCard({ variable, onChange, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={variable.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="variable_name"
          className="flex-1 text-[0.82rem] font-mono font-medium text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
        />
        <button
          onClick={onDelete}
          className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <LocalizedInput
        value={variable.description}
        onChange={(v) => onChange({ description: v })}
        placeholder="Description..."
        className="w-full text-[0.75rem] text-gray-500 placeholder:text-gray-300 bg-transparent outline-none"
      />
    </div>
  );
}
