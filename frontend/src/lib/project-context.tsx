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
  organizationLimit: number;
  parameters: ProjectParameter[];
}

export const MAX_PARAMETERS = 10;

// Mock projects (would come from the backend later).
export const PROJECTS: Project[] = [
  {
    id: "spring-2026",
    name: l("Spring 2026", "Весна 2026", "Көктем 2026"),
    description: l("Spring intake assessments", "Весенние тестирования"),
    licenseLimit: 1000,
    organizationLimit: 20,
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
    parameters: [],
  },
  {
    id: "summer-camp",
    name: l("Summer Camp 2026", "Летний лагерь 2026"),
    description: l("Summer guidance camp", "Летний профориентационный лагерь"),
    licenseLimit: 300,
    organizationLimit: 3,
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

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [projectId, setProjectIdState] = useState<string>(PROJECTS[0].id);

  // Restore the last-selected project on mount.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && PROJECTS.some((p) => p.id === saved)) {
      setProjectIdState(saved);
    }
  }, []);

  const setProjectId = (id: string) => {
    setProjectIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const updateProject = (id: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const project = projects.find((p) => p.id === projectId) ?? projects[0];

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
