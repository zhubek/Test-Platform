import { Trash2 } from "lucide-react";
import { LocalizedInput } from "@/components/localized-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Variable } from "../../../_components/mock-data";

interface Props {
  variable: Variable;
  onChange: (partial: Partial<Variable>) => void;
  onDelete: () => void;
}

export function VariableCard({ variable, onChange, onDelete }: Props) {
  return (
    <div className="bg-card rounded-lg border shadow-sm p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={variable.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="variable_name"
          className="flex-1 font-mono"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <LocalizedInput
        value={variable.description}
        onChange={(v) => onChange({ description: v })}
        placeholder="Description..."
        className="w-full"
      />
    </div>
  );
}
