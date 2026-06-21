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
import { fetchProjects } from "./backend";
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

// Mock projects (would come from the backend later).
export const PROJECTS: Project[] = [
  {
    id: "spring-2026",
    name: l("Spring 2026", "Весна 2026", "Көктем 2026"),
    description: l("Spring intake assessments", "Весенние тестирования"),
    licenseLimit: 1000,
    organizationLimit: 20,
    languages: ["en", "ru", "kk"],
    defaultLanguage: "en",
    parameters: [
      {
        id: "p1",
        label: l("Region", "Регион", "Аймақ"),
        type: "single",
        options: [l("Almaty", "Алматы"), l("Astana", "Астана"), l("Shymkent", "Шымкент"), l("Other", "Другое")],
      },
      {
        id: "p2",
        label: l("Interests", "Интересы", "Қызығушылықтар"),
        type: "multiple",
        options: [l("STEM"), l("Arts", "Искусство"), l("Sports", "Спорт"), l("Languages", "Языки")],
      },
    ],
  },
  {
    id: "pilot",
    name: l("Pilot Program", "Пилотная программа"),
    description: l("Early-access pilot cohort", "Пилотная группа раннего доступа"),
    licenseLimit: 200,
    organizationLimit: 5,
    languages: ["en", "ru", "kk"],
    defaultLanguage: "en",
    parameters: [
      { id: "p1", label: l("Grade", "Класс", "Сынып"), type: "single", options: [l("9"), l("10"), l("11")] },
    ],
  },
  {
    id: "region-x",
    name: l("Region X", "Регион X"),
    description: l("Regional rollout", "Региональное внедрение"),
    licenseLimit: 500,
    organizationLimit: 10,
    languages: ["en", "ru", "kk"],
    defaultLanguage: "en",
    parameters: [],
  },
  {
    id: "summer-camp",
    name: l("Summer Camp 2026", "Летний лагерь 2026"),
    description: l("Summer guidance camp", "Летний профориентационный лагерь"),
    licenseLimit: 300,
    organizationLimit: 3,
    languages: ["en", "ru", "kk"],
    defaultLanguage: "en",
    parameters: [],
  },
];

const STORAGE_KEY = "tp-active-project";

interface ProjectContextValue {
  projects: Project[];
  project: Project;
  setProjectId: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
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

  // Load real projects from the backend, restoring the last-selected one.
  // Falls back to the mock PROJECTS only if the backend is unreachable/empty.
  useEffect(() => {
    let cancelled = false;
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const pick = (list: Project[]) =>
      saved && list.some((p) => p.id === saved) ? saved : list[0].id;
    fetchProjects()
      .then((real) => {
        if (cancelled) return;
        const list = real.length > 0 ? real : PROJECTS;
        const initial = pick(list);
        setProjects(list);
        // Set the ambient scope before the id state so library reads (blocks,
        // catalog groups) load already scoped to the active project.
        setActiveProjectScope(initial);
        setProjectIdState(initial);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Backend unavailable — using mock projects.", err);
        setProjects(PROJECTS);
        setProjectIdState(pick(PROJECTS));
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

  const project = projects.find((p) => p.id === projectId) ?? projects[0] ?? PLACEHOLDER;

  return (
    <ProjectContext.Provider value={{ projects, project, setProjectId, updateProject }}>
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
