import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BlockType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  /** List the library, newest first, optionally narrowed to one type tab and/or
   *  one project. */
  list(type?: BlockType, projectId?: string) {
    // A project's own blocks PLUS platform-wide system blocks (projectId null),
    // which are available — but locked — in every project.
    return this.prisma.block.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(projectId ? { OR: [{ projectId }, { projectId: null }] } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(dto: CreateBlockDto) {
    return this.prisma.block.create({
      data: {
        type: dto.type,
        name: dto.name,
        description: dto.description,
        html: dto.html ?? '',
        props: (dto.props ?? []) as Prisma.InputJsonValue,
        sampleProps: (dto.sampleProps ?? {}) as Prisma.InputJsonValue,
        projectId: dto.projectId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateBlockDto) {
    await this.assertNotSystem(id);
    return this.prisma.block.update({
      where: { id },
      data: {
        type: dto.type,
        name: dto.name,
        description: dto.description,
        html: dto.html,
        props: dto.props as Prisma.InputJsonValue | undefined,
        sampleProps: dto.sampleProps as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async remove(id: string) {
    await this.assertNotSystem(id);
    return this.prisma.block.delete({ where: { id } });
  }

  /** Platform-wide system blocks (projectId null) are locked — no edit/delete. */
  private async assertNotSystem(id: string) {
    const block = await this.prisma.block.findUnique({ where: { id }, select: { projectId: true } });
    if (block && block.projectId === null) {
      throw new ForbiddenException('This is a system block and cannot be edited or deleted.');
    }
  }

  /** Copy an existing block into a new "… (copy)" entry. */
  async duplicate(id: string) {
    const src = await this.prisma.block.findUnique({ where: { id } });
    if (!src) throw new NotFoundException(`Block ${id} not found`);
    return this.prisma.block.create({
      data: {
        type: src.type,
        name: `${src.name} (copy)`,
        description: src.description,
        html: src.html,
        props: src.props as Prisma.InputJsonValue,
        sampleProps: src.sampleProps as Prisma.InputJsonValue,
        projectId: src.projectId,
      },
    });
  }
}
