// Entity functions + adapters that map the NestJS backend shapes onto the
// shapes the existing frontend components expect (Localized names, the
// AdminOrg/license view models, etc.).

import { apiFetch, apiFetchRaw } from "./api-client";
import { getActiveProjectId } from "./active-project";
import { l, type Localized } from "./localized";
import type { AdminOrg } from "@/app/(admin)/admin/organizations/_components/mock-data";
import type { Project } from "./project-context";

// ── Projects ───────────────────────────────────────────────────────────────

interface BeProject {
  id: string;
  name: string;
  description: string | null;
  licenseLimit: number;
  expirationDate: string | null;
  // From the project payload's include: the assigned languages + the default.
  languages?: { language: { id: string; name: string; label: string | null } }[];
  defaultLanguage?: { id: string; name: string; label: string | null } | null;
}

/** Backend strings → the FE's Localized Project (EN-only; RU/KZ fall back to EN). */
function adaptProject(p: BeProject): Project {
  const codes = (p.languages ?? []).map((pl) => pl.language.name);
  return {
    id: p.id,
    name: l(p.name),
    description: l(p.description ?? ""),
    licenseLimit: p.licenseLimit,
    expirationDate: p.expirationDate ?? null,
    organizationLimit: 0,
    parameters: [],
    languages: codes,
    defaultLanguage: p.defaultLanguage?.name ?? codes[0] ?? "en",
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const rows = await apiFetch<BeProject[]>("/projects");
  return rows.map(adaptProject);
}

// ── Project migration (export / import) — super-admin only ───────────────────

/** A project content snapshot (blocks, catalogs, tests). Opaque to the client. */
export type ProjectBundle = Record<string, unknown> & { project?: { name?: string } };

/** Download the full content snapshot of a project (preserve-IDs). */
export function exportProject(projectId: string): Promise<ProjectBundle> {
  return apiFetch<ProjectBundle>(`/projects/${projectId}/export`);
}

/**
 * Re-create a bundle's content in this instance; returns created counts.
 * - `targetProjectId` re-parents the content INTO that project.
 * - mode "merge" (default) preserves ids (idempotent — skips existing).
 * - mode "clone" regenerates all ids so it lands as a fresh copy (use when the
 *   source content already exists in this instance, e.g. project → project).
 */
export function importProject(
  bundle: ProjectBundle,
  targetProjectId?: string,
  mode: "merge" | "clone" = "merge",
): Promise<Record<string, number>> {
  const qs = new URLSearchParams();
  if (targetProjectId) qs.set("targetProjectId", targetProjectId);
  if (mode === "clone") qs.set("mode", "clone");
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<Record<string, number>>(`/migration/import${suffix}`, {
    method: "POST",
    body: JSON.stringify(bundle),
  });
}

/** Persist project settings (license limit, expiration). expirationDate: an ISO
 *  date string, or null to clear. */
export function updateProjectFields(
  id: string,
  patch: { licenseLimit?: number; expirationDate?: string | null },
): Promise<unknown> {
  return apiFetch(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

// ── Project admin (login + password sign-in to /admin) ───────────────────────

export interface ProjectAdmin {
  id: string;
  login: string;
  name: string | null;
  status: string;
}

export function fetchProjectAdmin(projectId: string): Promise<ProjectAdmin | null> {
  return apiFetch<ProjectAdmin | null>(`/projects/${projectId}/admin`);
}

/** Create/update the project's admin. `password` is required when none exists. */
export function setProjectAdmin(
  projectId: string,
  input: { login: string; name?: string; password?: string },
): Promise<ProjectAdmin> {
  return apiFetch<ProjectAdmin>(`/projects/${projectId}/admin`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// ── Languages (global catalog + per-project assignment) ──────────────────────

export interface BeLanguage {
  id: string;
  name: string; // BCP-47 code
  label: string | null;
}

/** The global language catalog — every language the platform knows about. */
export function fetchLanguages(): Promise<BeLanguage[]> {
  return apiFetch<BeLanguage[]>("/languages");
}

export function createLanguage(name: string, label?: string): Promise<BeLanguage> {
  return apiFetch<BeLanguage>("/languages", {
    method: "POST",
    body: JSON.stringify({ name, label }),
  });
}

export function assignProjectLanguage(projectId: string, languageId: string): Promise<unknown> {
  return apiFetch(`/projects/${projectId}/languages`, {
    method: "POST",
    body: JSON.stringify({ languageId }),
  });
}

export function unassignProjectLanguage(projectId: string, languageId: string): Promise<unknown> {
  return apiFetch(`/projects/${projectId}/languages/${languageId}`, { method: "DELETE" });
}

export function setProjectDefaultLanguage(projectId: string, languageId: string): Promise<unknown> {
  return apiFetch(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ defaultLanguageId: languageId }),
  });
}

// ── Users ──────────────────────────────────────────────────────────────────

interface BeUser {
  id: string;
  login: string;
  email: string | null;
  status: string;
  roles: { role: { name: string } }[];
  licenses: { licenseCode: string; state: string; project: { name: string } | null }[];
}

/** A license the user holds, with the project it belongs to. */
export interface UserLicense {
  code: string;
  state: string;
  project: string | null;
}

export interface UserListRow {
  id: string;
  login: string;
  email: string | null;
  role: string;
  /** Licenses the user holds (0..n), each with its project. */
  licenses: UserLicense[];
  status: string;
}

function adaptUser(u: BeUser): UserListRow {
  return {
    id: u.id,
    login: u.login,
    email: u.email,
    role: u.roles[0]?.role.name ?? "—",
    licenses: (u.licenses ?? []).map((l) => ({
      code: l.licenseCode,
      state: l.state,
      project: l.project?.name ?? null,
    })),
    status: u.status,
  };
}

/** Global list (super-admin sees everyone). */
export async function fetchUsers(): Promise<UserListRow[]> {
  return (await apiFetch<BeUser[]>("/users")).map(adaptUser);
}

/** Users belonging to a specific project (admin project-scoped view). */
export async function fetchUsersForProject(projectId: string): Promise<UserListRow[]> {
  return (await apiFetch<BeUser[]>(`/projects/${projectId}/users`)).map(adaptUser);
}

export interface CreateUserInput {
  login: string;
  email: string;
  password: string;
  name?: string;
  role: "SUPER_ADMIN" | "PROJECT_ADMIN";
  projectId?: string;
  projectRole?: "SUPER_ADMIN" | "PROJECT_ADMIN" | "ORG_ADMIN" | "LICENSE_HOLDER";
}

/** Create a staff user (active immediately, logs in with password). */
export function createUser(input: CreateUserInput) {
  return apiFetch("/users", { method: "POST", body: JSON.stringify(input) });
}

// ── Organizations ──────────────────────────────────────────────────────────

interface BeOrganization {
  id: string;
  projectId: string;
  name: string;
  description: string | null; // used as the org's city in the seed
  licenseCount: number;
  licenseUsed: number;
}

export async function fetchOrganizations(projectId: string): Promise<AdminOrg[]> {
  const rows = await apiFetch<BeOrganization[]>(`/projects/${projectId}/organizations`);
  return rows.map((o) => ({
    id: o.id,
    projectId: o.projectId,
    name: o.name,
    city: o.description ?? "",
    licensesTotal: o.licenseCount,
    licensesRedeemed: o.licenseUsed,
    state: "active",
  }));
}

// The org detail view model: raw backend fields, no AdminOrg adaptation.
export interface OrgDetail {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  code: string;
  licenseCount: number;
  licenseUsed: number;
  expirationDate: string | null;
  // The parent project's expiration cap — the org's own date may not exceed it.
  projectExpirationDate: string | null;
}

export function fetchOrganization(id: string): Promise<OrgDetail> {
  return apiFetch<OrgDetail>(`/organizations/${id}`);
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  adminLogin: string;
  adminName?: string;
}

/** Creates the org + its PENDING admin; returns the one-time activation code. */
export function createOrganization(
  projectId: string,
  input: CreateOrganizationInput,
): Promise<{ data: OrgDetail; code: string }> {
  return apiFetchRaw<{ data: OrgDetail; code: string }>(`/projects/${projectId}/organizations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganization(
  id: string,
  patch: { name?: string; description?: string; licenseCount?: number; expirationDate?: string | null },
): Promise<OrgDetail> {
  return apiFetch<OrgDetail>(`/organizations/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteOrganization(id: string) {
  return apiFetch(`/organizations/${id}`, { method: "DELETE" });
}

/** New activation code; the org admin is reset to PENDING (password restore). */
export function resetOrgCode(id: string): Promise<{ code: string }> {
  return apiFetch<{ code: string }>(`/organizations/${id}/reset-code`, { method: "POST" });
}

export interface OrgAdmin {
  id: string;
  login: string;
  name: string | null;
  status: string;
}

export function fetchOrgAdmin(orgId: string): Promise<OrgAdmin | null> {
  return apiFetch<OrgAdmin | null>(`/organizations/${orgId}/admin`);
}

export function setOrgAdmin(orgId: string, input: { login: string; name?: string }): Promise<OrgAdmin> {
  return apiFetch<OrgAdmin>(`/organizations/${orgId}/admin`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// ── Licenses (admin, project-wide) ──────────────────────────────────────────

export type AdminLicenseState = "unredeemed" | "redeemed" | "expired" | "revoked";

export interface AdminLicenseRow {
  id: string;
  code: string;
  login: string;
  name: string;
  state: AdminLicenseState;
}

interface BeLicense {
  id: string;
  licenseCode: string;
  state: "ISSUED" | "ACTIVE" | "EXPIRED" | "REVOKED";
  holder: { login: string; name: string | null } | null;
}

const LICENSE_STATE: Record<BeLicense["state"], AdminLicenseState> = {
  ISSUED: "unredeemed",
  ACTIVE: "redeemed",
  EXPIRED: "expired",
  REVOKED: "revoked",
};

export async function fetchProjectLicenses(projectId: string): Promise<AdminLicenseRow[]> {
  const rows = await apiFetch<BeLicense[]>(`/projects/${projectId}/licenses`);
  return rows.map((li) => ({
    id: li.id,
    code: li.licenseCode,
    login: li.holder?.login ?? "",
    name: li.holder?.name ?? "",
    state: LICENSE_STATE[li.state] ?? "unredeemed",
  }));
}

// ── Licenses (org-scoped management) ────────────────────────────────────────

export interface OrgLicense {
  id: string;
  licenseCode: string;
  state: "ISSUED" | "ACTIVE" | "EXPIRED" | "REVOKED";
  issuedDate: string;
  expirationDate: string | null;
  holder: { id: string; login: string; name: string | null; status: string } | null;
}

export function fetchOrgLicenses(orgId: string): Promise<OrgLicense[]> {
  return apiFetch<OrgLicense[]>(`/organizations/${orgId}/licenses`);
}

/** Bulk-generate licenses; the backend enforces the org's license limit + the
 *  expiration cap. expirationDate is required (ISO date string). */
export function generateLicenses(
  orgId: string,
  input: { count: number; expirationDate: string },
): Promise<{ data: OrgLicense[]; codes: string[] }> {
  return apiFetchRaw<{ data: OrgLicense[]; codes: string[] }>(
    `/organizations/${orgId}/licenses/generate`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

/** Create a single license for a named holder. */
export function createLicense(
  orgId: string,
  input: { holderLogin: string; holderName?: string; expirationDate?: string },
): Promise<{ data: OrgLicense; code: string }> {
  return apiFetchRaw<{ data: OrgLicense; code: string }>(`/organizations/${orgId}/licenses`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type LicenseAction = "revoke" | "expire" | "renew";

export function licenseAction(id: string, action: LicenseAction): Promise<OrgLicense> {
  return apiFetch<OrgLicense>(`/licenses/${id}/${action}`, { method: "POST" });
}

/** New activation code; holder reset to PENDING (password restore). */
export function resetLicenseCode(id: string): Promise<{ code: string }> {
  return apiFetch<{ code: string }>(`/licenses/${id}/reset-code`, { method: "POST" });
}

export function deleteLicense(id: string) {
  return apiFetch(`/licenses/${id}`, { method: "DELETE" });
}

// ── Org attempts (org-admin results view) ───────────────────────────────────

export interface OrgAttempt {
  id: string;
  state: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  startTime: string | null;
  endTime: string | null;
  updatedTime: string;
  license: { id: string; licenseCode: string; holder: { login: string; name: string | null } | null };
  test: {
    id: string;
    name: Record<string, string>;
    advancedParams: {
      calc?: { name: string; expr: string }[];
      result?: { scores?: { variable: string; label: string; description?: string }[]; summary?: string; professions?: Record<string, string[]> };
    };
    // The test's RESULT blocks (joined to their library block) so the result
    // drawer can render the designed blocks without a separate test-read call.
    blocks?: {
      id: string;
      blockId: string;
      props: Record<string, unknown>;
      block: { id: string; name: string; html: string; props: { name: string; type: string; value: unknown }[] } | null;
    }[];
  };
  variables: { variable: string; value: number }[];
}

export function fetchOrgAttempts(orgId: string): Promise<OrgAttempt[]> {
  return apiFetch<OrgAttempt[]>(`/organizations/${orgId}/attempts`);
}

// ── Project attempts (project-level dashboards) ─────────────────────────────
// Completed attempts across every test in the project, newest first. Used as the
// variable source for the dashboard constructor (license_test_variables).

export interface ProjectAttempt {
  id: string;
  state: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  startTime: string | null;
  endTime: string | null;
  updatedTime: string;
  license: { id: string; licenseCode: string; holder: { login: string; name: string | null } | null };
  test: { id: string; name: Record<string, string> };
  variables: { variable: string; value: number }[];
}

export function fetchProjectAttempts(projectId: string): Promise<ProjectAttempt[]> {
  return apiFetch<ProjectAttempt[]>(`/projects/${projectId}/attempts`);
}

// ── Org-management API adapter ──────────────────────────────────────────────
// The Licenses/Settings tabs are shared between the super-admin org page and
// the org-admin page; each passes the implementation bound to its own session
// (super-admin via this default; org-admin via its own token client).

export interface OrgApi {
  fetchOrgLicenses: typeof fetchOrgLicenses;
  generateLicenses: typeof generateLicenses;
  licenseAction: typeof licenseAction;
  resetLicenseCode: typeof resetLicenseCode;
  deleteLicense: typeof deleteLicense;
  fetchOrgAttempts: typeof fetchOrgAttempts;
  updateOrganization: typeof updateOrganization;
  fetchOrgAdmin: typeof fetchOrgAdmin;
  setOrgAdmin: typeof setOrgAdmin;
  resetOrgCode: typeof resetOrgCode;
  deleteOrganization: typeof deleteOrganization;
}

export const defaultOrgApi: OrgApi = {
  fetchOrgLicenses,
  generateLicenses,
  licenseAction,
  resetLicenseCode,
  deleteLicense,
  fetchOrgAttempts,
  updateOrganization,
  fetchOrgAdmin,
  setOrgAdmin,
  resetOrgCode,
  deleteOrganization,
};

// ── Blocks (reusable HTML+Tailwind components) ──────────────────────────────

// The four block kinds, matching the backend BlockType enum. `TEST` blocks are
// dropped into test views, `RESULT` into result views, etc.
export type BlockType = "TEST" | "RESULT" | "DASHBOARD" | "CATALOG";

// A declared prop the editor renders as a control. Mirrors the builder's PropDef
// minus the local id; persisted as the JSON `props` column.
export interface BlockProp {
  name: string;
  // "json" holds an arbitrary parsed value (e.g. a chart's data array of objects).
  // "ref" points into a data catalog ({ $catalog, ids }) and resolves to entity
  // data at render time — see lib/catalog-refs.ts.
  type: "text" | "number" | "boolean" | "color" | "list" | "json" | "ref";
  value: unknown;
}

export interface Block {
  id: string;
  type: BlockType;
  name: string;
  description: string | null;
  html: string;
  props: BlockProp[];
  /** Sample values keyed by prop name — used when rendering without chosen props. */
  sampleProps: Record<string, unknown>;
  /** null = a platform-wide SYSTEM block: available everywhere, locked (no edit/delete). */
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** True for platform-wide system blocks (locked — cannot be edited or deleted). */
export const isSystemBlock = (b: { projectId?: string | null }): boolean => b.projectId === null;

export type BlockInput = {
  type: BlockType;
  name: string;
  description?: string;
  html?: string;
  props?: BlockProp[];
  sampleProps?: Record<string, unknown>;
  projectId?: string;
};

/**
 * The values a block renders with when nothing has been chosen: its saved
 * sample values, falling back to the declared prop defaults (older rows).
 */
export function blockSampleProps(block: {
  props: BlockProp[];
  sampleProps?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const sample = block.sampleProps ?? {};
  if (Object.keys(sample).length > 0) return sample;
  const o: Record<string, unknown> = {};
  for (const p of block.props) if (p.name) o[p.name] = p.value;
  return o;
}

export function fetchBlocks(type?: BlockType): Promise<Block[]> {
  // Scoped to the active project when one is set (admin); unscoped on the
  // public site, where there is no ProjectProvider.
  const projectId = getActiveProjectId();
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString();
  return apiFetch<Block[]>(`/blocks${qs ? `?${qs}` : ""}`);
}

export function fetchBlock(id: string): Promise<Block> {
  return apiFetch<Block>(`/blocks/${id}`);
}

export function createBlock(input: BlockInput): Promise<Block> {
  // New blocks belong to the active project unless one was passed explicitly.
  const body = { projectId: getActiveProjectId(), ...input };
  return apiFetch<Block>("/blocks", { method: "POST", body: JSON.stringify(body) });
}

export function updateBlock(id: string, patch: Partial<BlockInput>): Promise<Block> {
  return apiFetch<Block>(`/blocks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function duplicateBlock(id: string): Promise<Block> {
  return apiFetch<Block>(`/blocks/${id}/duplicate`, { method: "POST" });
}

export function deleteBlock(id: string): Promise<void> {
  return apiFetch<void>(`/blocks/${id}`, { method: "DELETE" });
}

// ── Tests ───────────────────────────────────────────────────────────────────
// The backend Test stores the editor's general fields in two free-form JSON
// bags: `info` (description, color, icon, duration, surveyLogic) and
// `advancedParams` (visibilityRule, calculation vars, result config…). Blocks
// (questions/result/dashboard) live in TestBlock rows. Name/category are
// localized objects.

export type TestStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface TestInfo {
  description?: Localized;
  color?: string;
  icon?: string;
  duration?: number;
  surveyLogic?: unknown;
}

interface BeTest {
  id: string;
  projectId: string;
  name: Record<string, string>;
  category: Record<string, string>;
  state: TestStatus;
  info: TestInfo & Record<string, unknown>;
  advancedParams: Record<string, unknown>;
  _count?: { blocks?: number; licenseTests?: number };
  createdAt: string;
  updatedAt: string;
}

export interface AdminTest {
  id: string;
  projectId: string;
  name: Localized;
  category: Localized;
  state: TestStatus;
  description: Localized;
  color: string;
  icon: string;
  duration: number;
  surveyLogic: unknown;
  // Full bags kept so a partial (e.g. General-tab) save can round-trip the keys
  // it doesn't touch — the JSON columns are replaced wholesale on update.
  info: Record<string, unknown>;
  advancedParams: Record<string, unknown>;
  blockCount: number;
  licenseTestCount: number;
  createdAt: string;
  updatedAt: string;
}

const asLoc = (v: unknown): Localized => {
  const o = (v ?? {}) as Record<string, string>;
  return { en: o.en ?? "", ru: o.ru ?? "", kk: o.kk ?? "" };
};

function adaptTest(t: BeTest): AdminTest {
  const info = (t.info ?? {}) as TestInfo & Record<string, unknown>;
  return {
    id: t.id,
    projectId: t.projectId,
    name: asLoc(t.name),
    category: asLoc(t.category),
    state: t.state,
    description: asLoc(info.description),
    color: typeof info.color === "string" ? info.color : "#6b7280",
    icon: typeof info.icon === "string" ? info.icon : "compass",
    duration: typeof info.duration === "number" ? info.duration : 0,
    surveyLogic: info.surveyLogic ?? {},
    info,
    advancedParams: (t.advancedParams ?? {}) as Record<string, unknown>,
    blockCount: t._count?.blocks ?? 0,
    licenseTestCount: t._count?.licenseTests ?? 0,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// The backend write shape (name/category localized; info/advancedParams full bags).
export interface TestWrite {
  name?: Localized;
  category?: Localized;
  info?: Record<string, unknown>;
  advancedParams?: Record<string, unknown>;
}

export async function fetchTests(projectId: string): Promise<AdminTest[]> {
  return (await apiFetch<BeTest[]>(`/projects/${projectId}/tests`)).map(adaptTest);
}

export async function fetchTest(id: string): Promise<AdminTest> {
  return adaptTest(await apiFetch<BeTest>(`/tests/${id}`));
}

export async function createTest(projectId: string, body: TestWrite): Promise<AdminTest> {
  return adaptTest(
    await apiFetch<BeTest>(`/projects/${projectId}/tests`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

export async function updateTest(id: string, body: TestWrite): Promise<AdminTest> {
  return adaptTest(
    await apiFetch<BeTest>(`/tests/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  );
}

// State changes go through the lifecycle endpoints, not PATCH. Same-state is
// rejected by the backend, so callers must only switch on a real change.
export async function setTestState(id: string, state: TestStatus): Promise<AdminTest> {
  const action =
    state === "PUBLISHED" ? "publish" : state === "ARCHIVED" ? "archive" : "unpublish";
  return adaptTest(await apiFetch<BeTest>(`/tests/${id}/${action}`, { method: "POST" }));
}

export function deleteTest(id: string): Promise<void> {
  return apiFetch<void>(`/tests/${id}`, { method: "DELETE" });
}

// The test-editor shell's ad-hoc save payload (General tab fields).
export interface EditorSavePatch {
  name: Localized;
  desc: Localized;
  color: string;
  icon: string;
  category: Localized | string;
  visibilityRule?: unknown;
  duration: number;
  vars?: { variables?: unknown[] };
  surveyLogic?: unknown;
}

/**
 * Map the editor's save payload to a backend write, merging into the existing
 * info/advancedParams bags so fields owned by other tabs (calc/result) survive.
 */
export function editorPatchToWrite(
  patch: EditorSavePatch,
  base?: Pick<AdminTest, "info" | "advancedParams">,
): TestWrite {
  const category: Localized =
    typeof patch.category === "string"
      ? { en: patch.category, ru: "", kk: "" }
      : asLoc(patch.category);
  const baseAp = (base?.advancedParams ?? {}) as Record<string, unknown>;
  return {
    name: asLoc(patch.name),
    category,
    info: {
      ...(base?.info ?? {}),
      description: asLoc(patch.desc),
      color: patch.color,
      icon: patch.icon,
      duration: patch.duration,
      surveyLogic: patch.surveyLogic ?? {},
    },
    advancedParams: {
      // Preserve everything the OTHER tabs own (vars, calc, matches, result) —
      // the General tab only owns the visibility rule. Writing vars here would
      // clobber the declared variables managed by the Questions tab.
      ...baseAp,
      visibilityRule: patch.visibilityRule,
    },
  };
}

// ── Test blocks (per surface: questions / result / dashboard) ─────────────────
// Each block instance lives in a TestBlock row: `props` are the instance prop
// values/bindings; `advancedParams` carries the per-surface extras (questions:
// onAnswer/visibleIf/randomize). The library block (html + declared props) is
// fetched separately and joined by `blockId`.

export type TestSurface = "QUESTION" | "RESULT" | "DASHBOARD";

export interface AdminTestBlock {
  id: string;
  blockId: string;
  surface: TestSurface;
  order: number;
  props: Record<string, unknown>;
  advancedParams: Record<string, unknown>;
  block: { id: string; name: string; type: BlockType } | null;
}

// The write shape for one instance — `order` is implied by array position.
export interface TestBlockInput {
  blockId: string;
  props?: Record<string, unknown>;
  advancedParams?: Record<string, unknown>;
}

export function fetchTestBlocks(testId: string, surface: TestSurface): Promise<AdminTestBlock[]> {
  return apiFetch<AdminTestBlock[]>(`/tests/${testId}/blocks?surface=${surface}`);
}

// Replace ALL blocks of one surface with this ordered list (mirrors how each
// tab holds a whole surface as one draft).
export function saveTestBlocks(
  testId: string,
  surface: TestSurface,
  blocks: TestBlockInput[],
): Promise<AdminTestBlock[]> {
  return apiFetch<AdminTestBlock[]>(`/tests/${testId}/blocks`, {
    method: "PUT",
    body: JSON.stringify({ surface, blocks }),
  });
}
