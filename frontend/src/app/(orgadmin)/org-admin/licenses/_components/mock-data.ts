export type LicenseState = "unredeemed" | "redeemed" | "expired";
export type TestProgress = "assigned" | "completed";

export interface LicenseTest {
  testId: number;
  status: TestProgress;
}

export interface OrgLicense {
  id: string;
  code: string;
  name: string; // student name, filled at redemption
  grade: string; // e.g. "9B"
  state: LicenseState;
  tests: LicenseTest[]; // accessible tests + per-test progress
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

const T = (testId: number, status: TestProgress): LicenseTest => ({ testId, status });

// ── Results (for the drawer) ─────────────────────────────────────────────

export interface ScoreEntry {
  label: string;
  value: number; // 0–100
}

export interface AttemptResult {
  date: string;
  summary: string;
  scores: ScoreEntry[];
}

// licenseId → testId → attempts (most recent first)
export const licenseResults: Record<string, Record<number, AttemptResult[]>> = {
  "lic-1": {
    1: [
      {
        date: "Feb 4, 2026",
        summary:
          "Aibek shows a strong Investigative–Artistic profile — analytical and curious, with a creative streak. Well-suited to research, design, and problem-solving roles.",
        scores: [
          { label: "Investigative", value: 87 },
          { label: "Artistic", value: 78 },
          { label: "Social", value: 64 },
          { label: "Enterprising", value: 45 },
          { label: "Realistic", value: 38 },
          { label: "Conventional", value: 31 },
        ],
      },
      {
        date: "Nov 12, 2025",
        summary:
          "Initial assessment showed emerging Investigative tendencies with balanced secondary traits.",
        scores: [
          { label: "Investigative", value: 72 },
          { label: "Social", value: 66 },
          { label: "Artistic", value: 61 },
          { label: "Enterprising", value: 48 },
          { label: "Realistic", value: 40 },
          { label: "Conventional", value: 35 },
        ],
      },
    ],
    2: [
      {
        date: "Feb 6, 2026",
        summary:
          "Very high Openness and Conscientiousness — intellectually curious and self-disciplined.",
        scores: [
          { label: "Openness", value: 88 },
          { label: "Conscientiousness", value: 81 },
          { label: "Agreeableness", value: 70 },
          { label: "Extraversion", value: 58 },
        ],
      },
    ],
  },
  "lic-2": {
    1: [
      {
        date: "Feb 2, 2026",
        summary:
          "Dana presents a Social–Artistic profile, drawn to helping others and creative expression.",
        scores: [
          { label: "Social", value: 84 },
          { label: "Artistic", value: 76 },
          { label: "Investigative", value: 60 },
          { label: "Enterprising", value: 52 },
          { label: "Conventional", value: 34 },
          { label: "Realistic", value: 28 },
        ],
      },
    ],
  },
  "lic-5": {
    1: [
      {
        date: "Jan 29, 2026",
        summary:
          "Madina shows a balanced Social–Conventional profile, suited to structured, people-facing roles.",
        scores: [
          { label: "Social", value: 80 },
          { label: "Conventional", value: 72 },
          { label: "Investigative", value: 64 },
          { label: "Enterprising", value: 55 },
          { label: "Realistic", value: 40 },
          { label: "Artistic", value: 33 },
        ],
      },
    ],
    3: [
      {
        date: "Feb 1, 2026",
        summary:
          "Strong self-awareness and steady self-regulation under pressure.",
        scores: [
          { label: "Self-awareness", value: 82 },
          { label: "Self-regulation", value: 74 },
        ],
      },
    ],
  },
  "lic-7": {
    1: [
      {
        date: "Feb 8, 2026",
        summary:
          "Alikhan shows a clear Enterprising–Social profile — natural at leadership, persuasion, and team settings.",
        scores: [
          { label: "Enterprising", value: 89 },
          { label: "Social", value: 79 },
          { label: "Artistic", value: 66 },
          { label: "Investigative", value: 44 },
          { label: "Conventional", value: 36 },
          { label: "Realistic", value: 30 },
        ],
      },
    ],
    2: [
      {
        date: "Feb 9, 2026",
        summary: "High Extraversion and Agreeableness; low emotional volatility.",
        scores: [
          { label: "Extraversion", value: 90 },
          { label: "Agreeableness", value: 83 },
          { label: "Openness", value: 64 },
          { label: "Conscientiousness", value: 60 },
        ],
      },
    ],
    3: [
      {
        date: "Feb 10, 2026",
        summary: "Well-developed emotional intelligence across both dimensions.",
        scores: [
          { label: "Self-awareness", value: 85 },
          { label: "Self-regulation", value: 80 },
        ],
      },
    ],
  },
};

export const orgLicenses: OrgLicense[] = [
  { id: id(), code: "PW-7K2M-X9", name: "Aibek Nurlanov", grade: "9A", state: "redeemed", tests: [T(1, "completed"), T(2, "completed"), T(3, "assigned")] },
  { id: id(), code: "PW-3F8N-Q2", name: "Dana Serikova", grade: "9A", state: "redeemed", tests: [T(1, "completed"), T(2, "assigned")] },
  { id: id(), code: "PW-1D5R-T7", name: "Yerlan Akhmetov", grade: "9A", state: "redeemed", tests: [T(1, "completed")] },
  { id: id(), code: "PW-9P4L-M3", name: "", grade: "9B", state: "unredeemed", tests: [T(1, "assigned"), T(2, "assigned"), T(3, "assigned")] },
  { id: id(), code: "PW-6T1V-K8", name: "Madina Bekova", grade: "9B", state: "redeemed", tests: [T(1, "completed"), T(3, "completed")] },
  { id: id(), code: "PW-2H7W-R5", name: "", grade: "9B", state: "unredeemed", tests: [T(1, "assigned"), T(2, "assigned")] },
  { id: id(), code: "PW-8C3Y-N1", name: "Alikhan Tulegenov", grade: "10A", state: "redeemed", tests: [T(1, "completed"), T(2, "completed"), T(3, "completed")] },
  { id: id(), code: "PW-5B9Z-J4", name: "Aru Zhumabek", grade: "10A", state: "redeemed", tests: [T(2, "completed"), T(3, "assigned")] },
  { id: id(), code: "PW-4G6X-P2", name: "", grade: "10A", state: "unredeemed", tests: [T(1, "assigned")] },
  { id: id(), code: "PW-0M8Q-W7", name: "Timur Iskakov", grade: "10B", state: "expired", tests: [T(1, "completed"), T(2, "assigned")] },
  { id: id(), code: "PW-7N2D-L9", name: "Saule Amirova", grade: "10B", state: "redeemed", tests: [T(1, "completed"), T(2, "completed"), T(3, "assigned")] },
  { id: id(), code: "PW-3R5F-T6", name: "", grade: "10B", state: "unredeemed", tests: [] },
];
