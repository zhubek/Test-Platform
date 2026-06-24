"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Localized } from "@/lib/localized";
import { l } from "@/lib/localized";
import type { Locale } from "./i18n";
import { fetchProjects, createProject } from "./backend";
import { setActiveProjectScope } from "./active-project";

// A license-redemption parameter: a field the student fills in when
// redeeming a license. Single- or multiple-choice, with localized options.
export interface ProjectParameter {
  id: string;
  label: Localized;
  type: "single" | "multiple";
  options: Localized[];
}

export interface Project {
  id: string;
  name: Localized;
  description: Localized;
  licenseLimit: number;
  // Latest date licenses in this project may expire (ISO date string, or null).
  expirationDate?: string | null;
  organizationLimit: number;
  parameters: ProjectParameter[];
  // Content languages assigned to this project (dynamic BCP-47 codes). Drives
  // every per-field language picker; only these chips are shown.
  languages: Locale[];
  // The source/fallback code — what `localize()` falls back to.
  defaultLanguage: Locale;
}

export const MAX_PARAMETERS = 10;

// Canonical ordering hint (EN first). Not an allow-list — projects may use any
// code from the global catalog.
export const ALL_LOCALES: Locale[] = ["en", "ru", "kk"];

// The content languages a project shows, default language first. Falls back to
// just the default (or "en") when none are assigned yet.
export function projectLanguages(p: Project): Locale[] {
  const def = p.defaultLanguage || "en";
  const set = p.languages.length > 0 ? p.languages : [def];
  // Keep the default first so editors open on the source language.
  return [def, ...set.filter((c) => c !== def)];
}

// The project's source/fallback language code.
export function projectDefaultLanguage(p: Project): Locale {
  return p.defaultLanguage || p.languages[0] || "en";
}

const STORAGE_KEY = "tp-active-project";

interface ProjectContextValue {
  projects: Project[];
  project: Project;
  setProjectId: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  /** Create a project on the backend, then select it. */
  addProject: (input: { name: string; description?: string; licenseLimit?: number }) => Promise<Project>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

// Shown while real projects are still loading, so consumers always have a
// project to render. Its empty id signals pages NOT to fetch project-scoped
// data yet (they guard on `project.id`).
const PLACEHOLDER: Project = {
  id: "",
  name: l("Loading…"),
  description: l(""),
  licenseLimit: 0,
  organizationLimit: 0,
  parameters: [],
  languages: ["en"],
  defaultLanguage: "en",
};

export function ProjectProvider({ children }: { children: ReactNode }) {
  // Start empty (no fake id) so pages don't fetch with a mock project id before
  // the real projects arrive.
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectIdState] = useState<string>("");

  // Load real projects from the backend, restoring the last-selected one. The
  // picker is purely backend-driven: an empty DB shows NO projects (so nothing
  // acts on a phantom id), and the user creates one with "New project".
  useEffect(() => {
    let cancelled = false;
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    fetchProjects()
      .then((real) => {
        if (cancelled) return;
        setProjects(real);
        const initial = saved && real.some((p) => p.id === saved) ? saved : real[0]?.id ?? "";
        // Set the ambient scope before the id state so library reads (blocks,
        // catalog groups) load already scoped to the active project.
        setActiveProjectScope(initial || undefined);
        setProjectIdState(initial);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load projects:", err);
        setProjects([]);
        setProjectIdState("");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setProjectId = (id: string) => {
    setActiveProjectScope(id); // before the state update, so refetches read the new scope
    setProjectIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const updateProject = (id: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addProject: ProjectContextValue["addProject"] = async (input) => {
    const created = await createProject(input);
    setProjects((prev) => [...prev, created]);
    setProjectId(created.id);
    return created;
  };

  const project = projects.find((p) => p.id === projectId) ?? projects[0] ?? PLACEHOLDER;

  return (
    <ProjectContext.Provider value={{ projects, project, setProjectId, updateProject, addProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

/**
 * The content-language codes to show in editors, and the default to open on —
 * driven by the project picked in the menu. Safe outside ProjectProvider (the
 * public site): falls back to the canonical en/ru/kk set.
 */
export function useContentLanguages(): { codes: Locale[]; default: Locale } {
  const ctx = useContext(ProjectContext);
  if (!ctx) return { codes: ALL_LOCALES, default: "en" };
  return { codes: projectLanguages(ctx.project), default: projectDefaultLanguage(ctx.project) };
}
