import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, TestState, TestSurface } from '@prisma/client';
import type { AuthUser } from '../common/access/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { SaveTestBlocksDto } from './dto/save-test-blocks.dto';
import { SetTestParamsDto } from './dto/set-test-params.dto';
import { canTransition } from './tests.transitions';
import { TestEntity } from './tests.types';

const json = (v: unknown): Prisma.InputJsonValue => (v ?? {}) as Prisma.InputJsonValue;

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tests in a project, newest first, with light counts for the list view. */
  listForProject(projectId: string) {
    return this.prisma.test.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { blocks: true, licenseTests: true } } },
    });
  }

  /**
   * The published tests a license holder can take in their project, each with
   * the holder's own attempt state (null = not started) so the home screen can
   * label them In progress / Completed / Available.
   */
  async listForHolder(user: AuthUser) {
    if (!user.projectId) return [];
    const tests = await this.prisma.test.findMany({
      where: { projectId: user.projectId, state: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { blocks: true } } },
    });
    const attempts = user.licenseId
      ? await this.prisma.licenseTest.findMany({
          where: { licenseId: user.licenseId, testId: { in: tests.map((t) => t.id) } },
          select: { id: true, testId: true, state: true },
        })
      : [];
    const byTest = new Map(attempts.map((a) => [a.testId, a]));
    return tests.map((t) => {
      const a = byTest.get(t.id);
      return { ...t, attempt: a ? { id: a.id, state: a.state } : null };
    });
  }

  createUnderProject(projectId: string, dto: CreateTestDto) {
    return this.prisma.test.create({
      data: {
        project: { connect: { id: projectId } },
        name: json(dto.name),
        category: json(dto.category),
        info: json(dto.info),
        advancedParams: json(dto.advancedParams),
      },
    });
  }

  findOne(id: string) {
    return this.prisma.test.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { blocks: true, licenseTests: true } },
        projectParams: true,
      },
    });
  }

  update(id: string, dto: UpdateTestDto) {
    return this.prisma.test.update({
      where: { id },
      data: {
        name: dto.name ? json(dto.name) : undefined,
        category: dto.category ? json(dto.category) : undefined,
        info: dto.info ? json(dto.info) : undefined,
        advancedParams: dto.advancedParams ? json(dto.advancedParams) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.test.delete({ where: { id } });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  async changeState(test: TestEntity, to: TestState) {
    const verdict = canTransition(test.state, to, test);
    if (!verdict.ok) throw new UnprocessableEntityException(verdict.reason);
    return this.prisma.test.update({ where: { id: test.id }, data: { state: to } });
  }

  // ── Blocks (per surface) ─────────────────────────────────────────────────

  listBlocks(testId: string, surface?: TestSurface) {
    return this.prisma.testBlock.findMany({
      where: { testId, surface },
      orderBy: [{ surface: 'asc' }, { order: 'asc' }],
      include: { block: { select: { id: true, name: true, type: true } } },
    });
  }

  /**
   * Replace ALL blocks of one surface with the given ordered list, in a single
   * transaction (the editor holds a whole surface as one draft and saves it
   * wholesale). Order is taken from array position.
   */
  async saveBlocks(testId: string, dto: SaveTestBlocksDto) {
    const create = dto.blocks.map((b, i) => ({
      testId,
      blockId: b.blockId,
      surface: dto.surface,
      order: b.order ?? i,
      props: json(b.props),
      advancedParams: json(b.advancedParams),
    }));
    await this.prisma.$transaction([
      this.prisma.testBlock.deleteMany({ where: { testId, surface: dto.surface } }),
      ...(create.length ? [this.prisma.testBlock.createMany({ data: create })] : []),
      this.prisma.test.update({ where: { id: testId }, data: { updatedAt: new Date() } }),
    ]);
    return this.listBlocks(testId, dto.surface);
  }

  // ── Project parameters ────────────────────────────────────────────────────

  listParams(testId: string) {
    return this.prisma.testProjectParam.findMany({ where: { testId } });
  }

  async setParams(testId: string, dto: SetTestParamsDto) {
    await this.prisma.$transaction([
      this.prisma.testProjectParam.deleteMany({ where: { testId } }),
      ...(dto.params.length
        ? [
            this.prisma.testProjectParam.createMany({
              data: dto.params.map((p) => ({
                testId,
                projectParamId: p.projectParamId,
                isVisible: p.isVisible ?? true,
              })),
            }),
          ]
        : []),
    ]);
    return this.listParams(testId);
  }

  /** Used by the controller to 404 cleanly when a nested route's test is gone. */
  async assertExists(id: string) {
    const test = await this.prisma.test.findUnique({ where: { id }, select: { id: true } });
    if (!test) throw new NotFoundException(`Test ${id} not found`);
  }
}
