import { randomBytes } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ImportMode = 'merge' | 'clone';

// Project content migration: a preserve-IDs snapshot of everything authored
// under a project — blocks, catalog groups (full graph), tests (all surfaces,
// incl. dashboards) — plus the global pieces they depend on (languages,
// characteristic groups). Importing re-creates the graph identically, so all
// internal references (blockId, pageBlockId, characteristicId, …) stay valid
// without remapping. Runtime/tenant data (users, orgs, licenses, attempts) is
// intentionally NOT exported.

export const BUNDLE_VERSION = 1;

export interface ProjectBundle {
  version: number;
  exportedAt: string;
  project: Record<string, unknown>;
  languages: Record<string, unknown>[];
  projectLanguages: Record<string, unknown>[];
  projectParams: Record<string, unknown>[];
  projectParamOptions: Record<string, unknown>[];
  characteristicGroups: Record<string, unknown>[];
  characteristics: Record<string, unknown>[];
  blocks: Record<string, unknown>[];
  catalogGroups: Record<string, unknown>[];
  extraVariables: Record<string, unknown>[];
  extraVariableOptions: Record<string, unknown>[];
  groupCharacteristicGroups: Record<string, unknown>[];
  groupPages: Record<string, unknown>[];
  pageBlocks: Record<string, unknown>[];
  catalogs: Record<string, unknown>[];
  catalogExtraValues: Record<string, unknown>[];
  catalogCharacteristicValues: Record<string, unknown>[];
  catalogPageProps: Record<string, unknown>[];
  tests: Record<string, unknown>[];
  testBlocks: Record<string, unknown>[];
  testProjectParams: Record<string, unknown>[];
}

const J = (v: unknown) => v as Prisma.InputJsonValue;

@Injectable()
export class MigrationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Snapshot a project's full content graph (preserve-IDs). */
  async exportProject(projectId: string): Promise<ProjectBundle> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new BadRequestException('Project not found');

    const projectLanguages = await this.prisma.projectLanguage.findMany({ where: { projectId } });
    const projectParams = await this.prisma.projectParam.findMany({ where: { projectId } });
    const paramIds = projectParams.map((p) => p.id);
    const projectParamOptions = await this.prisma.projectParamOption.findMany({
      where: { projectParamId: { in: paramIds.length ? paramIds : ['—'] } },
    });

    // Catalog groups + their full nested graph.
    const catalogGroups = await this.prisma.dataCatalogGroup.findMany({ where: { projectId } });
    const groupIds = catalogGroups.map((g) => g.id);
    const inGroups = { groupId: { in: groupIds.length ? groupIds : ['—'] } };
    const extraVariables = await this.prisma.extraVariable.findMany({ where: inGroups });
    const variableIds = extraVariables.map((v) => v.id);
    const extraVariableOptions = await this.prisma.extraVariableOption.findMany({
      where: { variableId: { in: variableIds.length ? variableIds : ['—'] } },
    });
    const groupCharacteristicGroups = await this.prisma.dcGroupCharacteristicGroup.findMany({
      where: { catalogGroupId: { in: groupIds.length ? groupIds : ['—'] } },
    });
    const groupPages = await this.prisma.dataCatalogGroupPage.findMany({ where: inGroups });
    const pageIds = groupPages.map((p) => p.id);
    const pageBlocks = await this.prisma.dcgPageBlock.findMany({
      where: { pageId: { in: pageIds.length ? pageIds : ['—'] } },
    });
    const catalogs = await this.prisma.dataCatalog.findMany({ where: inGroups });
    const itemIds = catalogs.map((c) => c.id);
    const inItems = { catalogId: { in: itemIds.length ? itemIds : ['—'] } };
    const catalogExtraValues = await this.prisma.dataCatalogExtraValue.findMany({ where: inItems });
    const catalogCharacteristicValues = await this.prisma.dataCatalogCharacteristicValue.findMany({ where: inItems });
    const catalogPageProps = await this.prisma.dataCatalogPageProp.findMany({ where: inItems });

    // Tests + their blocks (all surfaces) + project-param links.
    const tests = await this.prisma.test.findMany({ where: { projectId } });
    const testIds = tests.map((t) => t.id);
    const inTests = { testId: { in: testIds.length ? testIds : ['—'] } };
    const testBlocks = await this.prisma.testBlock.findMany({ where: inTests });
    const testProjectParams = await this.prisma.testProjectParam.findMany({ where: inTests });

    // Blocks: the project's own blocks PLUS any block referenced by this project's
    // content (system/global or cross-project) so references resolve on import.
    const referencedBlockIds = new Set<string>([
      ...testBlocks.map((b) => b.blockId),
      ...pageBlocks.map((b) => b.blockId),
    ]);
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ projectId }, { id: { in: [...referencedBlockIds, '—'] } }] },
    });

    // Global pieces the graph depends on (small; export whole).
    const languageIds = new Set<string>(projectLanguages.map((l) => l.languageId));
    if (project.defaultLanguageId) languageIds.add(project.defaultLanguageId);
    const languages = await this.prisma.language.findMany({
      where: { id: { in: [...languageIds, '—'] } },
    });
    const characteristicGroups = await this.prisma.characteristicGroup.findMany();
    const characteristics = await this.prisma.characteristic.findMany();

    return {
      version: BUNDLE_VERSION,
      exportedAt: new Date().toISOString(),
      project,
      languages,
      projectLanguages,
      projectParams,
      projectParamOptions,
      characteristicGroups,
      characteristics,
      blocks,
      catalogGroups,
      extraVariables,
      extraVariableOptions,
      groupCharacteristicGroups,
      groupPages,
      pageBlocks,
      catalogs,
      catalogExtraValues,
      catalogCharacteristicValues,
      catalogPageProps,
      tests,
      testBlocks,
      testProjectParams,
    } as ProjectBundle;
  }

  /**
   * Re-create a bundle's graph. Content ids are preserved (so internal references
   * stay valid), but every `projectId` is re-parented to `targetProjectId` when
   * given — importing the bundle's content INTO a chosen project. Without a
   * target, the source project is recreated as-exported. Rows are created in FK
   * order; existing ids are skipped (idempotent). Returns per-table created counts.
   */
  async importBundle(
    input: ProjectBundle,
    targetProjectId?: string,
    mode: ImportMode = 'merge',
  ): Promise<Record<string, number>> {
    // Tolerate a raw API download still wrapped in the `{ data }` response envelope.
    const wrapped = input as unknown as { data?: ProjectBundle };
    const bundle = wrapped?.data?.project ? wrapped.data : input;
    if (!bundle || typeof bundle !== 'object' || !bundle.project) {
      throw new BadRequestException('Invalid bundle');
    }
    if (bundle.version !== BUNDLE_VERSION) {
      throw new BadRequestException(`Unsupported bundle version ${bundle.version}`);
    }

    if (targetProjectId) {
      const target = await this.prisma.project.findUnique({ where: { id: targetProjectId } });
      if (!target) throw new BadRequestException('Target project not found');
    }

    // Clone: regenerate every content id so the bundle becomes a fresh copy in
    // the target project (for export/import between projects in the SAME instance).
    if (mode === 'clone') return this.importClone(bundle, targetProjectId);

    const counts: Record<string, number> = {};
    const created = (name: string, r: { count: number }) => (counts[name] = r.count);

    // Re-parent project-scoped rows to the target (system/global blocks keep null).
    const reparent = (rows: Record<string, unknown>[]) =>
      targetProjectId ? rows.map((r) => ({ ...r, projectId: targetProjectId })) : rows;
    const reparentBlocks = (rows: Record<string, unknown>[]) =>
      targetProjectId
        ? rows.map((r) => ({ ...r, projectId: r.projectId == null ? null : targetProjectId }))
        : rows;

    // Order matters (FK dependencies). createMany + skipDuplicates is idempotent
    // on the primary key. Dates/enums/JSON pass through as-is.
    await this.prisma.$transaction(
      async (tx) => {
        const many = (rows: Record<string, unknown>[]) => rows.map((r) => J(r) as never);

        created('languages', await tx.language.createMany({ data: many(bundle.languages), skipDuplicates: true }));
        created('characteristicGroups', await tx.characteristicGroup.createMany({ data: many(bundle.characteristicGroups), skipDuplicates: true }));
        created('characteristics', await tx.characteristic.createMany({ data: many(bundle.characteristics), skipDuplicates: true }));

        // Only recreate the source project when no target is chosen (the target
        // project already exists and is the destination).
        if (!targetProjectId) {
          await tx.project.upsert({
            where: { id: String(bundle.project.id) },
            create: J(bundle.project) as never,
            update: J({ ...bundle.project, licenseUsed: undefined }) as never,
          });
          counts.project = 1;
        }

        created('projectLanguages', await tx.projectLanguage.createMany({ data: many(reparent(bundle.projectLanguages)), skipDuplicates: true }));
        created('projectParams', await tx.projectParam.createMany({ data: many(reparent(bundle.projectParams)), skipDuplicates: true }));
        created('projectParamOptions', await tx.projectParamOption.createMany({ data: many(bundle.projectParamOptions), skipDuplicates: true }));

        created('blocks', await tx.block.createMany({ data: many(reparentBlocks(bundle.blocks)), skipDuplicates: true }));

        created('catalogGroups', await tx.dataCatalogGroup.createMany({ data: many(reparent(bundle.catalogGroups)), skipDuplicates: true }));
        created('extraVariables', await tx.extraVariable.createMany({ data: many(bundle.extraVariables), skipDuplicates: true }));
        created('extraVariableOptions', await tx.extraVariableOption.createMany({ data: many(bundle.extraVariableOptions), skipDuplicates: true }));
        created('groupCharacteristicGroups', await tx.dcGroupCharacteristicGroup.createMany({ data: many(bundle.groupCharacteristicGroups), skipDuplicates: true }));
        created('groupPages', await tx.dataCatalogGroupPage.createMany({ data: many(bundle.groupPages), skipDuplicates: true }));
        created('pageBlocks', await tx.dcgPageBlock.createMany({ data: many(bundle.pageBlocks), skipDuplicates: true }));
        created('catalogs', await tx.dataCatalog.createMany({ data: many(bundle.catalogs), skipDuplicates: true }));
        created('catalogExtraValues', await tx.dataCatalogExtraValue.createMany({ data: many(bundle.catalogExtraValues), skipDuplicates: true }));
        created('catalogCharacteristicValues', await tx.dataCatalogCharacteristicValue.createMany({ data: many(bundle.catalogCharacteristicValues), skipDuplicates: true }));
        created('catalogPageProps', await tx.dataCatalogPageProp.createMany({ data: many(bundle.catalogPageProps), skipDuplicates: true }));

        created('tests', await tx.test.createMany({ data: many(reparent(bundle.tests)), skipDuplicates: true }));
        created('testBlocks', await tx.testBlock.createMany({ data: many(bundle.testBlocks), skipDuplicates: true }));
        created('testProjectParams', await tx.testProjectParam.createMany({ data: many(bundle.testProjectParams), skipDuplicates: true }));
      },
      { timeout: 120_000 },
    );

    return counts;
  }

  /**
   * Clone import: every project-scoped row gets a brand-new id, all id
   * references (FK columns AND ids embedded in JSON, e.g. item `params`
   * relations) are rewritten to the new ids, and catalog groups whose globally
   * unique name is already taken are renamed (with the name references in test
   * `advancedParams.matches` updated to match). Globals (languages,
   * characteristic groups, system blocks) keep their ids. Re-parents to target.
   */
  private async importClone(
    bundle: ProjectBundle,
    targetProjectId?: string,
  ): Promise<Record<string, number>> {
    if (!targetProjectId) {
      throw new BadRequestException('A clone import requires a target project.');
    }

    const genId = () => 'c' + randomBytes(12).toString('hex');
    const idMap = new Map<string, string>();
    const add = (id: unknown) => {
      if (typeof id === 'string' && id && !idMap.has(id)) idMap.set(id, genId());
    };
    // Regenerate ids for project-scoped entities only — NOT system/global blocks
    // (projectId null) or global characteristics/languages, which the target shares.
    for (const b of bundle.blocks) if ((b as Any).projectId != null) add((b as Any).id);
    const regen = [
      bundle.catalogGroups, bundle.extraVariables, bundle.extraVariableOptions,
      bundle.groupPages, bundle.pageBlocks, bundle.catalogs, bundle.catalogExtraValues,
      bundle.catalogCharacteristicValues, bundle.catalogPageProps, bundle.tests,
      bundle.testBlocks, bundle.projectParams, bundle.projectParamOptions,
    ];
    for (const arr of regen) for (const r of arr) add((r as Any).id);

    const rid = (id: unknown) => (typeof id === 'string' ? (idMap.get(id) ?? id) : id);
    // Deep-rewrite any string that is a regenerated id (cuids are unique enough
    // that this never touches content text). Handles ids buried in JSON columns.
    const remap = (v: Any): Any => {
      if (typeof v === 'string') return idMap.get(v) ?? v;
      if (Array.isArray(v)) return v.map(remap);
      if (v && typeof v === 'object') {
        const o: Any = {};
        for (const k of Object.keys(v)) o[k] = remap(v[k]);
        return o;
      }
      return v;
    };

    // Rename catalog groups whose (globally unique) name already exists.
    const nameMap = new Map<string, string>();
    const taken = new Set(
      (await this.prisma.dataCatalogGroup.findMany({ select: { name: true } })).map((g) => g.name),
    );
    for (const g of bundle.catalogGroups) {
      const orig = String((g as Any).name);
      if (taken.has(orig)) {
        let i = 2;
        while (taken.has(`${orig}-${i}`)) i++;
        nameMap.set(orig, `${orig}-${i}`);
        taken.add(`${orig}-${i}`);
      } else taken.add(orig);
    }
    const rname = (n: unknown) => (typeof n === 'string' ? (nameMap.get(n) ?? n) : n);

    const R = (rows: Any[]) => rows.map((r) => J(r) as never);
    const counts: Record<string, number> = {};

    const blocks = bundle.blocks.map((b) => ({
      ...b, id: rid((b as Any).id),
      projectId: (b as Any).projectId == null ? null : targetProjectId,
      props: remap((b as Any).props), sampleProps: remap((b as Any).sampleProps),
    }));
    const groups = bundle.catalogGroups.map((g) => ({
      ...g, id: rid((g as Any).id), projectId: targetProjectId,
      cardPageId: rid((g as Any).cardPageId), name: rname((g as Any).name),
      info: remap((g as Any).info),
    }));
    const variables = bundle.extraVariables.map((v) => ({
      ...v, id: rid((v as Any).id), groupId: rid((v as Any).groupId),
    }));
    const varOptions = bundle.extraVariableOptions.map((o) => ({
      ...o, id: rid((o as Any).id), variableId: rid((o as Any).variableId),
      optionValue: remap((o as Any).optionValue),
    }));
    const gcg = bundle.groupCharacteristicGroups.map((x) => ({
      ...x, catalogGroupId: rid((x as Any).catalogGroupId), // characteristicGroupId is global → kept
    }));
    const pages = bundle.groupPages.map((p) => ({
      ...p, id: rid((p as Any).id), groupId: rid((p as Any).groupId),
      pageName: remap((p as Any).pageName),
    }));
    const pageBlocks = bundle.pageBlocks.map((pb) => ({
      ...pb, id: rid((pb as Any).id), pageId: rid((pb as Any).pageId),
      blockId: rid((pb as Any).blockId), props: remap((pb as Any).props),
    }));
    const items = bundle.catalogs.map((c) => ({
      ...c, id: rid((c as Any).id), groupId: rid((c as Any).groupId),
      title: remap((c as Any).title), description: remap((c as Any).description),
      params: remap((c as Any).params),
    }));
    const extraValues = bundle.catalogExtraValues.map((ev) => ({
      ...ev, id: rid((ev as Any).id), catalogId: rid((ev as Any).catalogId),
      variableId: rid((ev as Any).variableId), value: remap((ev as Any).value),
    }));
    const charValues = bundle.catalogCharacteristicValues.map((cv) => ({
      ...cv, id: rid((cv as Any).id), catalogId: rid((cv as Any).catalogId), // characteristicId global → kept
    }));
    const pageProps = bundle.catalogPageProps.map((pp) => ({
      ...pp, id: rid((pp as Any).id), catalogId: rid((pp as Any).catalogId),
      pageBlockId: rid((pp as Any).pageBlockId), props: remap((pp as Any).props),
    }));
    const params = bundle.projectParams.map((p) => ({
      ...p, id: rid((p as Any).id), projectId: targetProjectId,
    }));
    const paramOptions = bundle.projectParamOptions.map((o) => ({
      ...o, id: rid((o as Any).id), projectParamId: rid((o as Any).projectParamId),
    }));
    const tests = bundle.tests.map((t) => {
      const ap = remap((t as Any).advancedParams);
      if (ap && Array.isArray(ap.matches)) {
        ap.matches = ap.matches.map((m: Any) => ({ ...m, catalogId: rname(m.catalogId) }));
      }
      return {
        ...t, id: rid((t as Any).id), projectId: targetProjectId,
        name: remap((t as Any).name), category: remap((t as Any).category),
        info: remap((t as Any).info), advancedParams: ap,
      };
    });
    const testBlocks = bundle.testBlocks.map((tb) => ({
      ...tb, id: rid((tb as Any).id), testId: rid((tb as Any).testId),
      blockId: rid((tb as Any).blockId), props: remap((tb as Any).props),
      advancedParams: remap((tb as Any).advancedParams),
    }));
    const testParams = bundle.testProjectParams.map((x) => ({
      ...x, testId: rid((x as Any).testId), projectParamId: rid((x as Any).projectParamId),
    }));
    const projLanguages = bundle.projectLanguages.map((l) => ({
      ...l, projectId: targetProjectId, // languageId global → kept
    }));

    await this.prisma.$transaction(
      async (tx) => {
        // Ensure shared globals exist (no-op on the same instance).
        await tx.language.createMany({ data: R(bundle.languages), skipDuplicates: true });
        await tx.characteristicGroup.createMany({ data: R(bundle.characteristicGroups), skipDuplicates: true });
        await tx.characteristic.createMany({ data: R(bundle.characteristics), skipDuplicates: true });

        counts.projectLanguages = (await tx.projectLanguage.createMany({ data: R(projLanguages), skipDuplicates: true })).count;
        counts.projectParams = (await tx.projectParam.createMany({ data: R(params) })).count;
        counts.projectParamOptions = (await tx.projectParamOption.createMany({ data: R(paramOptions) })).count;
        counts.blocks = (await tx.block.createMany({ data: R(blocks), skipDuplicates: true })).count;
        counts.catalogGroups = (await tx.dataCatalogGroup.createMany({ data: R(groups) })).count;
        counts.extraVariables = (await tx.extraVariable.createMany({ data: R(variables) })).count;
        counts.extraVariableOptions = (await tx.extraVariableOption.createMany({ data: R(varOptions) })).count;
        counts.groupCharacteristicGroups = (await tx.dcGroupCharacteristicGroup.createMany({ data: R(gcg), skipDuplicates: true })).count;
        counts.groupPages = (await tx.dataCatalogGroupPage.createMany({ data: R(pages) })).count;
        counts.pageBlocks = (await tx.dcgPageBlock.createMany({ data: R(pageBlocks) })).count;
        counts.catalogs = (await tx.dataCatalog.createMany({ data: R(items) })).count;
        counts.catalogExtraValues = (await tx.dataCatalogExtraValue.createMany({ data: R(extraValues) })).count;
        counts.catalogCharacteristicValues = (await tx.dataCatalogCharacteristicValue.createMany({ data: R(charValues) })).count;
        counts.catalogPageProps = (await tx.dataCatalogPageProp.createMany({ data: R(pageProps) })).count;
        counts.tests = (await tx.test.createMany({ data: R(tests) })).count;
        counts.testBlocks = (await tx.testBlock.createMany({ data: R(testBlocks) })).count;
        counts.testProjectParams = (await tx.testProjectParam.createMany({ data: R(testParams), skipDuplicates: true })).count;
      },
      { timeout: 120_000 },
    );

    return counts;
  }
}

// Local shorthand for the bundle's loosely-typed JSON rows.
type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
