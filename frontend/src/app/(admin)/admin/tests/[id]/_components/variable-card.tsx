import { Trash2 } from "lucide-react";
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
      <Input
        type="text"
        value={variable.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Description..."
        className="w-full"
      />
      {variable.source && (
        <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-primary">
          from catalog
        </span>
      )}
    </div>
  );
}
