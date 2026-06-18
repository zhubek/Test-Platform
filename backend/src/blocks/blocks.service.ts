import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.block.findMany({
      where: { ...(type ? { type } : {}), ...(projectId ? { projectId } : {}) },
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

  update(id: string, dto: UpdateBlockDto) {
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

  remove(id: string) {
    return this.prisma.block.delete({ where: { id } });
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
