import { Injectable, NotFoundException } from '@nestjs/common';
import { ROLES } from '../auth/roles';
import { generateCode } from '../common/util/code';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { SetOrgAdminDto } from './dto/set-org-admin.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

// Never return password hashes.
const SAFE = { omit: { passwordHash: true } } as const;

/**
 * Mask an activation code for display — only the last 4 chars are shown. The
 * full code is returned ONLY at create/reset time (its one reveal); afterwards
 * every read shows it masked, so a forgotten code forces an admin to restore it.
 */
export function maskCode(code: string): string {
  if (!code || code.length <= 4) return code;
  return '•'.repeat(code.length - 4) + code.slice(-4);
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  listForProject(projectId: string) {
    return this.prisma.organization.findMany({ where: { projectId } });
  }

  /** The caller's own organization (for the org-admin area). */
  getForUser(orgId: string | null | undefined) {
    if (!orgId) throw new NotFoundException('No organization for this user');
    return this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  }

  /**
   * Create the org AND provision its PENDING org_admin user in one go. Returns
   * the plaintext activation code so the caller can hand it to the org_admin.
   */
  async createUnderProject(projectId: string, dto: CreateOrganizationDto) {
    const code = generateCode();
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        code,
        project: { connect: { id: projectId } },
        members: {
          create: {
            login: dto.adminLogin,
            name: dto.adminName ?? null,
            status: 'PENDING',
            project: { connect: { id: projectId } },
            projectRole: 'ORG_ADMIN',
            roles: { create: { role: { connect: { name: ROLES.ORG_ADMIN } } } },
          },
        },
      },
    });
    return { data: org, code };
  }

  update(id: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({ where: { id }, data: { ...dto } });
  }

  remove(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }

  /** The org's ORG_ADMIN user (status shows whether they activated yet). */
  getAdmin(organizationId: string) {
    return this.prisma.user.findFirst({
      where: { organizationId, roles: { some: { role: { name: ROLES.ORG_ADMIN } } } },
      ...SAFE,
    });
  }

  /**
   * Set who the org_admin is: rename the existing admin user, or provision a
   * new PENDING one when the org has none (they activate with the org code).
   */
  async setAdmin(organizationId: string, dto: SetOrgAdminDto) {
    const existing = await this.getAdmin(organizationId);
    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: { login: dto.login, name: dto.name ?? existing.name },
        ...SAFE,
      });
    }
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { projectId: true },
    });
    return this.prisma.user.create({
      data: {
        login: dto.login,
        name: dto.name ?? null,
        status: 'PENDING',
        project: { connect: { id: org.projectId } },
        projectRole: 'ORG_ADMIN',
        organization: { connect: { id: organizationId } },
        roles: { create: { role: { connect: { name: ROLES.ORG_ADMIN } } } },
      },
      ...SAFE,
    });
  }

  /**
   * Regenerate the activation code and push the org_admin back to PENDING so
   * they must re-activate ("restore" the org_admin's login+code).
   */
  async resetCode(id: string) {
    const code = generateCode();
    await this.prisma.$transaction([
      this.prisma.organization.update({ where: { id }, data: { code } }),
      this.prisma.user.updateMany({
        where: { organizationId: id, roles: { some: { role: { name: ROLES.ORG_ADMIN } } } },
        data: { status: 'PENDING', passwordHash: null },
      }),
    ]);
    return { code };
  }
}
