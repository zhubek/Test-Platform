export type LicenseState = "unredeemed" | "redeemed" | "expired";

export interface OrgLicense {
  id: string;
  code: string;
  name: string; // student name, filled at redemption
  grade: string; // e.g. "9B"
  state: LicenseState;
  accessibleTestIds: number[]; // test ids this license can take
  tags: string[];
}

// Catalog of tests an org-admin can grant. Mirrors the published tests
// in @/lib/api (ids 1-3 published, 4-5 draft) — admins only grant published.
export const availableTests: { id: number; name: string }[] = [
  { id: 1, name: "Holland Career Test" },
  { id: 2, name: "Big Five Personality" },
  { id: 3, name: "Emotional Intelligence" },
];

let n = 0;
const id = () => `lic-${++n}`;

export const orgLicenses: OrgLicense[] = [
  { id: id(), code: "PW-7K2M-X9", name: "Aibek Nurlanov", grade: "9A", state: "redeemed", accessibleTestIds: [1, 2, 3], tags: ["9A", "priority"] },
  { id: id(), code: "PW-3F8N-Q2", name: "Dana Serikova", grade: "9A", state: "redeemed", accessibleTestIds: [1, 2], tags: ["9A"] },
  { id: id(), code: "PW-1D5R-T7", name: "Yerlan Akhmetov", grade: "9A", state: "redeemed", accessibleTestIds: [1], tags: ["9A"] },
  { id: id(), code: "PW-9P4L-M3", name: "", grade: "9B", state: "unredeemed", accessibleTestIds: [1, 2, 3], tags: ["9B"] },
  { id: id(), code: "PW-6T1V-K8", name: "Madina Bekova", grade: "9B", state: "redeemed", accessibleTestIds: [1, 3], tags: ["9B"] },
  { id: id(), code: "PW-2H7W-R5", name: "", grade: "9B", state: "unredeemed", accessibleTestIds: [1, 2], tags: ["9B"] },
  { id: id(), code: "PW-8C3Y-N1", name: "Alikhan Tulegenov", grade: "10A", state: "redeemed", accessibleTestIds: [1, 2, 3], tags: ["10A", "priority"] },
  { id: id(), code: "PW-5B9Z-J4", name: "Aru Zhumabek", grade: "10A", state: "redeemed", accessibleTestIds: [2, 3], tags: ["10A"] },
  { id: id(), code: "PW-4G6X-P2", name: "", grade: "10A", state: "unredeemed", accessibleTestIds: [1], tags: ["10A"] },
  { id: id(), code: "PW-0M8Q-W7", name: "Timur Iskakov", grade: "10B", state: "expired", accessibleTestIds: [1, 2], tags: ["10B"] },
  { id: id(), code: "PW-7N2D-L9", name: "Saule Amirova", grade: "10B", state: "redeemed", accessibleTestIds: [1, 2, 3], tags: ["10B"] },
  { id: id(), code: "PW-3R5F-T6", name: "", grade: "10B", state: "unredeemed", accessibleTestIds: [], tags: [] },
];
