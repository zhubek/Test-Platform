"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Save, GripVertical } from "lucide-react";
import {
  useProject,
  MAX_PARAMETERS,
  type ProjectParameter,
} from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import { localize, l, type Localized } from "@/lib/localized";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LocalizedInput } from "@/components/localized-input";
import { LocalizedTextarea } from "@/components/localized-textarea";
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
  const { locale } = useLocale();

  // Local editable copy, reset when the active project changes.
  const [name, setName] = useState<Localized>(project.name);
  const [description, setDescription] = useState<Localized>(project.description);
  const [licenseLimit, setLicenseLimit] = useState(project.licenseLimit);
  const [orgLimit, setOrgLimit] = useState(project.organizationLimit);
  const [params, setParams] = useState<ProjectParameter[]>(project.parameters);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description);
    setLicenseLimit(project.licenseLimit);
    setOrgLimit(project.organizationLimit);
    setParams(project.parameters);
  }, [project]);

  const addParam = () => {
    if (params.length >= MAX_PARAMETERS) return;
    setParams((p) => [
      ...p,
      { id: newParamId(), label: l(""), type: "single", options: [l("")] },
    ]);
  };

  const updateParam = (id: string, patch: Partial<ProjectParameter>) =>
    setParams((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeParam = (id: string) =>
    setParams((p) => p.filter((x) => x.id !== id));

  const addOption = (id: string) =>
    setParams((p) =>
      p.map((x) => (x.id === id ? { ...x, options: [...x.options, l("")] } : x)),
    );

  const updateOption = (id: string, idx: number, value: Localized) =>
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
        .map((p) => ({
          ...p,
          options: p.options.filter((o) => (o.en || o.ru || o.kz).trim() !== ""),
        }))
        .filter((p) => (p.label.en || p.label.ru || p.label.kz).trim() !== ""),
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
            Settings for{" "}
            <span className="font-medium text-foreground">{localize(project.name, locale)}</span>.
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
              <LocalizedInput value={name} onChange={setName} className="max-w-md" />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <LocalizedTextarea
                value={description}
                onChange={setDescription}
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
                    <div className="flex-1">
                      <LocalizedInput
                        value={p.label}
                        onChange={(v) => updateParam(p.id, { label: v })}
                        placeholder="Parameter name (e.g. Region)"
                        className="w-full"
                      />
                    </div>
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
                        <div className="max-w-xs flex-1">
                          <LocalizedInput
                            value={opt}
                            onChange={(v) => updateOption(p.id, oIdx, v)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="w-full"
                          />
                        </div>
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
