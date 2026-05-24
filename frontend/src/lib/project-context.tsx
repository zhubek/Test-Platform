"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// A license-redemption parameter: a field the student fills in when
// redeeming a license. Single- or multiple-choice, with options.
export interface ProjectParameter {
  id: string;
  label: string;
  type: "single" | "multiple";
  options: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  licenseLimit: number;
  organizationLimit: number;
  parameters: ProjectParameter[];
}

export const MAX_PARAMETERS = 10;

// Mock projects (would come from the backend later).
export const PROJECTS: Project[] = [
  {
    id: "spring-2026",
    name: "Spring 2026",
    description: "Spring intake assessments",
    licenseLimit: 1000,
    organizationLimit: 20,
    parameters: [
      { id: "p1", label: "Region", type: "single", options: ["Almaty", "Astana", "Shymkent", "Other"] },
      { id: "p2", label: "Interests", type: "multiple", options: ["STEM", "Arts", "Sports", "Languages"] },
    ],
  },
  {
    id: "pilot",
    name: "Pilot Program",
    description: "Early-access pilot cohort",
    licenseLimit: 200,
    organizationLimit: 5,
    parameters: [
      { id: "p1", label: "Grade", type: "single", options: ["9", "10", "11"] },
    ],
  },
  {
    id: "region-x",
    name: "Region X",
    description: "Regional rollout",
    licenseLimit: 500,
    organizationLimit: 10,
    parameters: [],
  },
  {
    id: "summer-camp",
    name: "Summer Camp 2026",
    description: "Summer guidance camp",
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
