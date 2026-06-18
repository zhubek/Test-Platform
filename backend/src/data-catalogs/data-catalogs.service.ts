import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, VariableDto, PageDto } from './dto/group.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import {
  CreateCharacteristicDto,
  CreateCharacteristicGroupDto,
  UpdateCharacteristicDto,
  UpdateCharacteristicGroupDto,
} from './dto/characteristic.dto';

const json = (v: unknown) => v as Prisma.InputJsonValue;

const GROUP_INCLUDE = {
  variables: {
    orderBy: { order: 'asc' },
    include: { options: true },
  },
  characteristics: {
    where: { characteristicGroup: { archived: false } },
    include: {
      characteristicGroup: {
        include: {
          characteristics: { where: { archived: false }, orderBy: { order: 'asc' } },
        },
      },
    },
  },
  pages: {
    orderBy: { order: 'asc' },
    include: { blocks: { orderBy: { order: 'asc' } } },
  },
  _count: { select: { items: true } },
} satisfies Prisma.DataCatalogGroupInclude;

const ITEM_INCLUDE = {
  values: { include: { variable: { select: { varName: true } } } },
  characteristicValues: true,
  pageProps: true,
  group: { select: { id: true, name: true } },
} satisfies Prisma.DataCatalogInclude;

@Injectable()
export class DataCatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Groups ────────────────────────────────────────────────────────────────

  listGroups(projectId?: string) {
    return this.prisma.dataCatalogGroup.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'asc' },
      include: GROUP_INCLUDE,
    });
  }

  getGroup(id: string) {
    return this.prisma.dataCatalogGroup.findUniqueOrThrow({
      where: { id },
      include: GROUP_INCLUDE,
    });
  }

  createGroup(dto: CreateGroupDto) {
    return this.prisma.dataCatalogGroup.create({
      data: {
        name: dto.name,
        info: dto.info !== undefined ? json(dto.info) : undefined,
        isPublic: dto.isPublic ?? false,
        projectId: dto.projectId ?? null,
        variables: {
          create: (dto.variables ?? []).map((v, i) => ({
            varName: v.varName,
            hasOptions: v.hasOptions ?? false,
            type: v.type ?? 'text',
            filterable: v.filterable ?? false,
            order: i,
            options: { create: (v.options ?? []).map((o) => ({ optionValue: json(o) })) },
          })),
        },
      },
      include: GROUP_INCLUDE,
    });
  }

  async updateGroup(id: string, dto: UpdateGroupDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.dataCatalogGroup.update({
        where: { id },
        data: {
          name: dto.name,
          info: dto.info !== undefined ? json(dto.info) : undefined,
          isPublic: dto.isPublic,
          cardPageId: dto.cardPageId,
        },
      });
      if (dto.variables) await this.syncVariables(tx, id, dto.variables);
      if (dto.pages) await this.syncPages(tx, id, dto.pages);
      if (dto.characteristicGroupIds) {
        await this.syncCharacteristicGroups(tx, id, dto.characteristicGroupIds);
      }
    });
    return this.getGroup(id);
  }

  // ── Characteristic groups + characteristics (their own catalog) ──────────

  private readonly CHAR_GROUP_INCLUDE = {
    characteristics: { where: { archived: false }, orderBy: { order: 'asc' as const } },
  };

  listCharacteristicGroups() {
    return this.prisma.characteristicGroup.findMany({
      where: { archived: false },
      orderBy: { createdAt: 'asc' },
      include: this.CHAR_GROUP_INCLUDE,
    });
  }

  getCharacteristicGroup(id: string) {
    return this.prisma.characteristicGroup.findUniqueOrThrow({
      where: { id },
      include: this.CHAR_GROUP_INCLUDE,
    });
  }

  createCharacteristicGroup(dto: CreateCharacteristicGroupDto) {
    return this.prisma.characteristicGroup.create({
      data: { name: dto.name ?? '', description: dto.description, color: dto.color },
      include: this.CHAR_GROUP_INCLUDE,
    });
  }

  updateCharacteristicGroup(id: string, dto: UpdateCharacteristicGroupDto) {
    return this.prisma.characteristicGroup.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        archived: dto.archived,
      },
      include: this.CHAR_GROUP_INCLUDE,
    });
  }

  async createCharacteristic(groupId: string, dto: CreateCharacteristicDto) {
    const last = await this.prisma.characteristic.findFirst({
      where: { groupId },
      orderBy: { order: 'desc' },
    });
    await this.prisma.characteristic.create({
      data: {
        groupId,
        name: dto.name ?? '',
        description: dto.description,
        order: (last?.order ?? -1) + 1,
      },
    });
    return this.getCharacteristicGroup(groupId);
  }

  async updateCharacteristic(id: string, dto: UpdateCharacteristicDto) {
    const char = await this.prisma.characteristic.update({
      where: { id },
      data: { name: dto.name, description: dto.description, archived: dto.archived },
    });
    return this.getCharacteristicGroup(char.groupId);
  }

  /** Replace the catalog group's attached characteristic-group set. */
  private async syncCharacteristicGroups(
    tx: Prisma.TransactionClient,
    catalogGroupId: string,
    ids: string[],
  ) {
    await tx.dcGroupCharacteristicGroup.deleteMany({
      where: { catalogGroupId, characteristicGroupId: { notIn: ids.length ? ids : ['__none__'] } },
    });
    for (const characteristicGroupId of ids) {
      await tx.dcGroupCharacteristicGroup.upsert({
        where: { catalogGroupId_characteristicGroupId: { catalogGroupId, characteristicGroupId } },
        update: {},
        create: { catalogGroupId, characteristicGroupId },
      });
    }
  }

  deleteGroup(id: string) {
    return this.prisma.dataCatalogGroup.delete({ where: { id } });
  }

  /**
   * Replace the group's slot set, synced by varName: kept names keep their row
   * (so item values survive), new names are created, missing ones are deleted
   * (cascading their item values). Options are replaced wholesale per variable.
   */
  private async syncVariables(tx: Prisma.TransactionClient, groupId: string, vars: VariableDto[]) {
    const names = vars.map((v) => v.varName);
    await tx.extraVariable.deleteMany({
      where: { groupId, varName: { notIn: names.length ? names : ['__none__'] } },
    });
    for (const [i, v] of vars.entries()) {
      const row = await tx.extraVariable.upsert({
        where: { groupId_varName: { groupId, varName: v.varName } },
        update: {
          hasOptions: v.hasOptions ?? false,
          type: v.type ?? 'text',
          filterable: v.filterable ?? false,
          order: i,
        },
        create: {
          groupId,
          varName: v.varName,
          hasOptions: v.hasOptions ?? false,
          type: v.type ?? 'text',
          filterable: v.filterable ?? false,
          order: i,
        },
      });
      if (v.options !== undefined) {
        await tx.extraVariableOption.deleteMany({ where: { variableId: row.id } });
        if (v.options.length) {
          await tx.extraVariableOption.createMany({
            data: v.options.map((o) => ({ variableId: row.id, optionValue: json(o) })),
          });
        }
      }
    }
  }

  /**
   * Replace the group's page templates, synced by page id: payload pages with
   * a known id are updated in place, others created, missing ones deleted.
   * Blocks are likewise synced by id (kept instances keep their id, so items'
   * per-block prop overrides survive page edits); blocks without an id are
   * created, missing ones deleted.
   */
  private async syncPages(tx: Prisma.TransactionClient, groupId: string, pages: PageDto[]) {
    const keepIds = pages.map((p) => p.id).filter((x): x is string => !!x);
    await tx.dataCatalogGroupPage.deleteMany({
      where: { groupId, id: { notIn: keepIds.length ? keepIds : ['__none__'] } },
    });
    const existing = new Set(
      (await tx.dataCatalogGroupPage.findMany({ where: { groupId }, select: { id: true } })).map(
        (p) => p.id,
      ),
    );
    for (const [i, p] of pages.entries()) {
      let pageId: string;
      if (p.id && existing.has(p.id)) {
        pageId = p.id;
        await tx.dataCatalogGroupPage.update({
          where: { id: pageId },
          data: { pageName: json(p.pageName), order: p.order ?? i },
        });
      } else {
        pageId = (
          await tx.dataCatalogGroupPage.create({
            data: { groupId, pageName: json(p.pageName), order: p.order ?? i },
          })
        ).id;
      }
      const blocks = p.blocks ?? [];
      const keepBlockIds = blocks.map((b) => b.id).filter((x): x is string => !!x);
      await tx.dcgPageBlock.deleteMany({
        where: { pageId, id: { notIn: keepBlockIds.length ? keepBlockIds : ['__none__'] } },
      });
      const existingBlocks = new Set(
        (await tx.dcgPageBlock.findMany({ where: { pageId }, select: { id: true } })).map((b) => b.id),
      );
      for (const [j, b] of blocks.entries()) {
        if (b.id && existingBlocks.has(b.id)) {
          await tx.dcgPageBlock.update({
            where: { id: b.id },
            data: { blockId: b.blockId, order: j, props: json(b.props ?? {}) },
          });
        } else {
          await tx.dcgPageBlock.create({
            data: { pageId, blockId: b.blockId, order: j, props: json(b.props ?? {}) },
          });
        }
      }
    }
  }

  // ── Items ────────────────────────────────────────────────────────────────

  listItems(groupId: string) {
    return this.prisma.dataCatalog.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: ITEM_INCLUDE,
    });
  }

  getItem(id: string) {
    return this.prisma.dataCatalog.findUniqueOrThrow({
      where: { id },
      include: ITEM_INCLUDE,
    });
  }

  async createItem(groupId: string, dto: CreateItemDto) {
    const item = await this.prisma.dataCatalog.create({
      data: {
        groupId,
        title: json(dto.title),
        description: dto.description !== undefined ? json(dto.description) : undefined,
        params: dto.params !== undefined ? json(dto.params) : undefined,
      },
    });
    if (dto.values) await this.upsertValues(item.id, groupId, dto.values);
    return this.getItem(item.id);
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    const item = await this.prisma.dataCatalog.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? json(dto.title) : undefined,
        description: dto.description !== undefined ? json(dto.description) : undefined,
        params: dto.params !== undefined ? json(dto.params) : undefined,
      },
    });
    if (dto.values) await this.upsertValues(id, item.groupId, dto.values);
    if (dto.pageProps) await this.upsertPageProps(id, item.groupId, dto.pageProps);
    if (dto.characteristicValues) await this.upsertCharacteristicValues(id, dto.characteristicValues);
    return this.getItem(id);
  }

  /** Upsert numeric characteristic values keyed by characteristic id; null deletes. */
  private async upsertCharacteristicValues(
    catalogId: string,
    values: Record<string, number | null>,
  ) {
    for (const [characteristicId, value] of Object.entries(values)) {
      if (value === null) {
        await this.prisma.dataCatalogCharacteristicValue.deleteMany({
          where: { catalogId, characteristicId },
        });
      } else {
        await this.prisma.dataCatalogCharacteristicValue.upsert({
          where: { catalogId_characteristicId: { catalogId, characteristicId } },
          update: { value },
          create: { catalogId, characteristicId, value },
        });
      }
    }
  }

  deleteItem(id: string) {
    return this.prisma.dataCatalog.delete({ where: { id } });
  }

  /**
   * Upsert per-item prop overrides keyed by DcgPageBlock id; null deletes.
   * The page block must belong to the item's own group.
   */
  private async upsertPageProps(
    catalogId: string,
    groupId: string,
    pageProps: Record<string, unknown>,
  ) {
    for (const [pageBlockId, props] of Object.entries(pageProps)) {
      const pageBlock = await this.prisma.dcgPageBlock.findUnique({
        where: { id: pageBlockId },
        include: { page: { select: { groupId: true } } },
      });
      if (!pageBlock || pageBlock.page.groupId !== groupId) {
        throw new NotFoundException(`Page block ${pageBlockId} is not part of this catalog's group`);
      }
      if (props === null) {
        await this.prisma.dataCatalogPageProp.deleteMany({ where: { catalogId, pageBlockId } });
      } else {
        await this.prisma.dataCatalogPageProp.upsert({
          where: { catalogId_pageBlockId: { catalogId, pageBlockId } },
          update: { props: json(props) },
          create: { catalogId, pageBlockId, props: json(props) },
        });
      }
    }
  }

  /** Upsert values keyed by varName; null deletes. Unknown names are rejected. */
  private async upsertValues(
    catalogId: string,
    groupId: string,
    values: Record<string, unknown>,
  ) {
    const vars = await this.prisma.extraVariable.findMany({ where: { groupId } });
    const byName = new Map(vars.map((v) => [v.varName, v.id]));
    for (const [varName, value] of Object.entries(values)) {
      const variableId = byName.get(varName);
      if (!variableId) {
        throw new NotFoundException(`Extra variable "${varName}" is not defined on this catalog group`);
      }
      if (value === null) {
        await this.prisma.dataCatalogExtraValue.deleteMany({ where: { catalogId, variableId } });
      } else {
        await this.prisma.dataCatalogExtraValue.upsert({
          where: { catalogId_variableId: { catalogId, variableId } },
          update: { value: json(value) },
          create: { catalogId, variableId, value: json(value) },
        });
      }
    }
  }
}
