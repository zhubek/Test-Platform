export interface AdminOrg {
  id: string;
  projectId: string;
  name: string;
  city: string;
  licensesTotal: number;
  licensesRedeemed: number;
  state: "active" | "inactive";
}

export const adminOrgs: AdminOrg[] = [
  { id: "org-1", projectId: "spring-2026", name: "Almaty School #12", city: "Almaty", licensesTotal: 120, licensesRedeemed: 98, state: "active" },
  { id: "org-2", projectId: "spring-2026", name: "Nazarbayev Intellectual School", city: "Astana", licensesTotal: 200, licensesRedeemed: 176, state: "active" },
  { id: "org-3", projectId: "spring-2026", name: "Lyceum #8", city: "Shymkent", licensesTotal: 80, licensesRedeemed: 41, state: "active" },
  { id: "org-4", projectId: "pilot", name: "Pilot Gymnasium", city: "Karaganda", licensesTotal: 50, licensesRedeemed: 50, state: "active" },
  { id: "org-5", projectId: "pilot", name: "Tech Academy", city: "Almaty", licensesTotal: 60, licensesRedeemed: 12, state: "inactive" },
  { id: "org-6", projectId: "region-x", name: "Regional College", city: "Aktobe", licensesTotal: 150, licensesRedeemed: 120, state: "active" },
  { id: "org-7", projectId: "region-x", name: "District School #3", city: "Atyrau", licensesTotal: 90, licensesRedeemed: 67, state: "active" },
  { id: "org-8", projectId: "summer-camp", name: "Summer Camp HQ", city: "Almaty", licensesTotal: 300, licensesRedeemed: 245, state: "active" },
];
