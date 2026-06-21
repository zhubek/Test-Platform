import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_INCLUDE = {
  languages: { include: { language: true } },
  defaultLanguage: true,
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Scoped list: super-admin sees all; everyone else sees only their project. */
  listForUser(user: AuthUser) {
    const where = user.roles.includes(ROLES.SUPER_ADMIN)
      ? {}
      : // "" matches nothing, so a user without a project gets an empty list.
        { id: user.projectId ?? '' };
    return this.prisma.project.findMany({ where, include: PROJECT_INCLUDE });
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        licenseLimit: dto.licenseLimit ?? 0,
      },
    });
  }

  update(id: string, dto: UpdateProjectDto) {
    const { expirationDate, ...rest } = dto;
    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        // Coerce the ISO date to a Date (or null to clear); leave untouched when absent.
        ...(expirationDate !== undefined
          ? { expirationDate: expirationDate ? new Date(expirationDate) : null }
          : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
