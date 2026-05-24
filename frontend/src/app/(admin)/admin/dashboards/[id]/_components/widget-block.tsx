import { GripVertical, Trash2 } from "lucide-react";
import { SqlEditor } from "@/components/sql-editor";
import { Button } from "@/components/ui/button";
import { LocalizedInput } from "@/components/localized-input";
import { ChartTypePicker } from "../../../_components/chart-type-picker";
import { ChartPreview } from "../../../_components/chart-preview";
import type { VisualizationType } from "../../../_components/mock-data";
import type { Localized } from "@/lib/localized";

interface Props {
  title: Localized;
  type: VisualizationType;
  sql: string;
  onTitleChange: (v: Localized) => void;
  onTypeChange: (v: VisualizationType) => void;
  onSqlChange: (v: string) => void;
  onDelete: () => void;
}

export function WidgetBlock({
  title,
  type,
  sql,
  onTitleChange,
  onTypeChange,
  onSqlChange,
  onDelete,
}: Props) {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
        <LocalizedInput
          value={title}
          onChange={onTitleChange}
          placeholder="Widget title..."
          className="flex-1 text-[0.85rem] font-medium"
        />
        <ChartTypePicker value={type} onChange={onTypeChange} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* SQL editor */}
      <div className="p-4">
        <SqlEditor
          value={sql}
          onChange={onSqlChange}
          placeholder="SELECT label, value FROM ..."
          height="140px"
        />
      </div>

      {/* Preview */}
      <div className="px-4 pb-4">
        <ChartPreview type={type} />
      </div>
    </div>
  );
}
