"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Project {
  id: string;
  name: string;
  description?: string;
}

// Mock projects (would come from the backend later).
export const PROJECTS: Project[] = [
  { id: "spring-2026", name: "Spring 2026", description: "Spring intake assessments" },
  { id: "pilot", name: "Pilot Program", description: "Early-access pilot cohort" },
  { id: "region-x", name: "Region X", description: "Regional rollout" },
  { id: "summer-camp", name: "Summer Camp 2026", description: "Summer guidance camp" },
];

const STORAGE_KEY = "tp-active-project";

interface ProjectContextValue {
  projects: Project[];
  project: Project;
  setProjectId: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
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

  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];

  return (
    <ProjectContext.Provider value={{ projects: PROJECTS, project, setProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
