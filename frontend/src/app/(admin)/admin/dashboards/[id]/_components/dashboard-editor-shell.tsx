"use client";

import { useState, useCallback } from "react";
import { DashboardHeader } from "./dashboard-header";
import { WidgetList } from "./widget-list";
import type { ContentDashboard, DashboardWidget, VisualizationType } from "../../../_components/mock-data";

interface Props {
  initialData: ContentDashboard;
}

export function DashboardEditorShell({ initialData }: Props) {
  const [name, setName] = useState(initialData.name);
  const [status, setStatus] = useState(initialData.status);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialData.widgets);

  const handleWidgetUpdate = useCallback(
    (index: number, partial: Partial<DashboardWidget>) => {
      setWidgets((prev) =>
        prev.map((w, i) => (i === index ? { ...w, ...partial } : w))
      );
    },
    []
  );

  const handleWidgetDelete = useCallback((index: number) => {
    setWidgets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleWidgetAdd = useCallback(() => {
    const newWidget: DashboardWidget = {
      id: `w${Date.now()}`,
      title: { en: "", ru: "", kk: "" },
      type: "bar" as VisualizationType,
      sql: "",
    };
    setWidgets((prev) => [...prev, newWidget]);
  }, []);

  return (
    <>
      <DashboardHeader
        name={name}
        status={status}
        onNameChange={setName}
        onStatusChange={setStatus}
      />

      <WidgetList
        widgets={widgets}
        onUpdate={handleWidgetUpdate}
        onDelete={handleWidgetDelete}
        onAdd={handleWidgetAdd}
      />
    </>
  );
}
