import { Injectable } from '@nestjs/common';
import { BlockType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// A read-only "content" tool layer (MCP-style): named tools with JSON-schema
// parameters and handlers that read the platform's data. Exposed to the AI
// assistant as Gemini function declarations.

interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

const OBJECT = (
  properties: Record<string, unknown> = {},
  required: string[] = [],
) => ({ type: 'object', properties, required });

const STR = (description: string) => ({ type: 'string', description });

/** Collapse a localized JSON value (or plain string) to a representative string. */
function pickText(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const rec = v as Record<string, unknown>;
    const en = rec.en;
    if (typeof en === 'string' && en) return en;
    for (const x of Object.values(rec)) if (typeof x === 'string' && x) return x;
  }
  return '';
}

@Injectable()
export class McpService {
  constructor(private readonly prisma: PrismaService) {}

  readonly tools: McpTool[] = [
    {
      name: 'list_projects',
      description: 'List all projects (id and name).',
      parameters: OBJECT(),
      handler: async () => {
        const rows = await this.prisma.project.findMany({ select: { id: true, name: true } });
        return { projects: rows };
      },
    },
    {
      name: 'list_tests',
      description: 'List tests, optionally filtered to one project. Returns id, name, and state.',
      parameters: OBJECT({ projectId: STR('Optional project id to filter by.') }),
      handler: async (args) => {
        const projectId = typeof args.projectId === 'string' ? args.projectId : undefined;
        const rows = await this.prisma.test.findMany({
          where: projectId ? { projectId } : undefined,
          select: { id: true, name: true, state: true },
          take: 100,
        });
        return { tests: rows.map((t) => ({ id: t.id, name: pickText(t.name), state: t.state })) };
      },
    },
    {
      name: 'get_test',
      description: 'Get one test by id: name, category, state, and number of blocks.',
      parameters: OBJECT({ testId: STR('The test id.') }, ['testId']),
      handler: async (args) => {
        const id = String(args.testId ?? '');
        const t = await this.prisma.test.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            category: true,
            state: true,
            info: true,
            _count: { select: { blocks: true } },
          },
        });
        if (!t) return { error: `Test ${id} not found` };
        const info = (t.info ?? {}) as Record<string, unknown>;
        return {
          id: t.id,
          name: pickText(t.name),
          category: pickText(t.category),
          state: t.state,
          description: pickText(info.description),
          blockCount: t._count.blocks,
        };
      },
    },
    {
      name: 'list_blocks',
      description:
        'List reusable blocks, optionally filtered by project and/or type (TEST, RESULT, CATALOG, DASHBOARD).',
      parameters: OBJECT({
        projectId: STR('Optional project id.'),
        type: STR('Optional block type: TEST, RESULT, CATALOG, or DASHBOARD.'),
      }),
      handler: async (args) => {
        const projectId = typeof args.projectId === 'string' ? args.projectId : undefined;
        const typeArg = typeof args.type === 'string' ? args.type.toUpperCase() : undefined;
        const type =
          typeArg && (Object.values(BlockType) as string[]).includes(typeArg)
            ? (typeArg as BlockType)
            : undefined;
        const rows = await this.prisma.block.findMany({
          where: { ...(projectId ? { projectId } : {}), ...(type ? { type } : {}) },
          select: { id: true, name: true, type: true },
          take: 200,
        });
        return { blocks: rows };
      },
    },
    {
      name: 'list_catalog_groups',
      description:
        'List data-catalog groups, optionally per project. Returns name, label, public flag, and item count.',
      parameters: OBJECT({ projectId: STR('Optional project id.') }),
      handler: async (args) => {
        const projectId = typeof args.projectId === 'string' ? args.projectId : undefined;
        const rows = await this.prisma.dataCatalogGroup.findMany({
          where: projectId ? { projectId } : undefined,
          select: { name: true, info: true, isPublic: true, _count: { select: { items: true } } },
        });
        return {
          groups: rows.map((g) => ({
            name: g.name,
            label: pickText((g.info as Record<string, unknown>)?.label) || g.name,
            isPublic: g.isPublic,
            itemCount: g._count.items,
          })),
        };
      },
    },
    {
      name: 'list_catalog_items',
      description: 'List the items of a catalog group (by group name). Returns id and title.',
      parameters: OBJECT({ groupName: STR('The catalog group name, e.g. "professions".') }, [
        'groupName',
      ]),
      handler: async (args) => {
        const groupName = String(args.groupName ?? '');
        const rows = await this.prisma.dataCatalog.findMany({
          where: { group: { name: groupName } },
          select: { id: true, title: true },
          take: 200,
        });
        return { items: rows.map((i) => ({ id: i.id, title: pickText(i.title) })) };
      },
    },
  ];

  /** Gemini function declarations (the tools without their handlers). */
  declarations() {
    return this.tools.map(({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    }));
  }

  /** Run a tool by name; never throws — errors come back as data. */
  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.find((t) => t.name === name);
    if (!tool) return { error: `Unknown tool: ${name}` };
    try {
      return await tool.handler(args ?? {});
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
}
