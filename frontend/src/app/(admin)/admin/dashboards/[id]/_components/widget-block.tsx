import { GripVertical, Trash2 } from "lucide-react";
import { SqlEditor } from "@/components/sql-editor";
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" />
        <LocalizedInput
          value={title}
          onChange={onTitleChange}
          placeholder="Widget title..."
          className="flex-1 text-[0.85rem] font-medium text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
        />
        <ChartTypePicker value={type} onChange={onTypeChange} />
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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
