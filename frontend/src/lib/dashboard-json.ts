import type { DashboardPage } from "@/app/(admin)/admin/_components/mock-data";

// Read-only snapshot of the dashboard configuration: pages + their widgets.
export interface DashboardJson {
  pages: DashboardPage[];
}

export function buildDashboardJson(pages: DashboardPage[]): DashboardJson {
  return { pages };
}

// The scoping WHERE clause appended automatically to every dashboard widget's
// SQL — dashboards aggregate per organization (read-only; authors don't write it).
export const DASHBOARD_SCOPE_SUFFIX = "WHERE organization_id = :organization_id";
