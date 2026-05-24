"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Save, GripVertical } from "lucide-react";
import {
  useProject,
  MAX_PARAMETERS,
  type ProjectParameter,
} from "@/lib/project-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

let pid = 0;
const newParamId = () => `np-${Date.now()}-${++pid}`;

export default function ParametersPage() {
  const { project, updateProject } = useProject();

  // Local editable copy, reset when the active project changes.
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [licenseLimit, setLicenseLimit] = useState(project.licenseLimit);
  const [orgLimit, setOrgLimit] = useState(project.organizationLimit);
  const [params, setParams] = useState<ProjectParameter[]>(project.parameters);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? "");
    setLicenseLimit(project.licenseLimit);
    setOrgLimit(project.organizationLimit);
    setParams(project.parameters);
  }, [project]);

  const addParam = () => {
    if (params.length >= MAX_PARAMETERS) return;
    setParams((p) => [
      ...p,
      { id: newParamId(), label: "", type: "single", options: [""] },
    ]);
  };

  const updateParam = (id: string, patch: Partial<ProjectParameter>) =>
    setParams((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeParam = (id: string) =>
    setParams((p) => p.filter((x) => x.id !== id));

  const addOption = (id: string) =>
    setParams((p) =>
      p.map((x) => (x.id === id ? { ...x, options: [...x.options, ""] } : x)),
    );

  const updateOption = (id: string, idx: number, value: string) =>
    setParams((p) =>
      p.map((x) =>
        x.id === id
          ? { ...x, options: x.options.map((o, i) => (i === idx ? value : o)) }
          : x,
      ),
    );

  const removeOption = (id: string, idx: number) =>
    setParams((p) =>
      p.map((x) =>
        x.id === id ? { ...x, options: x.options.filter((_, i) => i !== idx) } : x,
      ),
    );

  const save = () => {
    updateProject(project.id, {
      name,
      description,
      licenseLimit,
      organizationLimit: orgLimit,
      parameters: params
        .map((p) => ({ ...p, options: p.options.filter((o) => o.trim() !== "") }))
        .filter((p) => p.label.trim() !== ""),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project parameters</h1>
          <p className="text-sm text-muted-foreground">
            Settings for <span className="font-medium text-foreground">{project.name}</span>.
          </p>
        </div>
        <Button onClick={save}>
          <Save className="mr-1 h-4 w-4" />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Project details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Project name
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-md" />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="max-w-md"
              />
            </div>
            <div className="flex flex-wrap gap-5">
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  License limit
                </label>
                <Input
                  type="number"
                  min={0}
                  value={licenseLimit}
                  onChange={(e) => setLicenseLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Organization limit
                </label>
                <Input
                  type="number"
                  min={0}
                  value={orgLimit}
                  onChange={(e) => setOrgLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Redemption parameters</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Asked when a student redeems a license. Up to {MAX_PARAMETERS}.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addParam}
              disabled={params.length >= MAX_PARAMETERS}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add parameter ({params.length}/{MAX_PARAMETERS})
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No parameters yet.
              </div>
            ) : (
              params.map((p, pIdx) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{pIdx + 1}
                    </span>
                    <Input
                      value={p.label}
                      onChange={(e) => updateParam(p.id, { label: e.target.value })}
                      placeholder="Parameter name (e.g. Region)"
                      className="flex-1"
                    />
                    <Select
                      value={p.type}
                      onValueChange={(v) =>
                        updateParam(p.id, { type: (v as "single" | "multiple") ?? "single" })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single choice</SelectItem>
                        <SelectItem value="multiple">Multiple choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeParam(p.id)}
                      title="Remove parameter"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Options */}
                  <div className="space-y-1.5 pl-6">
                    {p.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 border border-muted-foreground/40",
                            p.type === "single" ? "rounded-full" : "rounded-[3px]",
                          )}
                        />
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(p.id, oIdx, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                          className="h-8 max-w-xs"
                        />
                        <button
                          onClick={() => removeOption(p.id, oIdx)}
                          className="text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(p.id)}
                      className="ml-5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Add option
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
