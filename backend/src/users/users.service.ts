import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Never select the password hash back to a caller.
const SAFE = { omit: { passwordHash: true } } as const;

// List view: safe fields + the names a UI needs (role, org, license).
const LIST = {
  omit: { passwordHash: true },
  include: {
    roles: { include: { role: true } },
    organization: { select: { name: true } },
    license: { select: { licenseCode: true } },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Global list: super-admin sees everyone; anyone else sees only themselves. */
  listForUser(caller: AuthUser) {
    if (caller.roles.includes(ROLES.SUPER_ADMIN)) {
      return this.prisma.user.findMany(LIST);
    }
    return this.prisma.user.findMany({ where: { id: caller.id }, ...LIST });
  }

  /** Everyone belonging to a project (admin project-scoped view). */
  listForProject(projectId: string) {
    return this.prisma.user.findMany({ where: { projectId }, ...LIST });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        login: dto.login,
        email: dto.email,
        name: dto.name ?? null,
        status: 'ACTIVE',
        passwordHash,
        projectId: dto.projectId ?? null,
        projectRole: dto.projectRole ?? null,
        roles: { create: { role: { connect: { name: dto.role } } } },
      },
      ...SAFE,
    });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: { ...dto }, ...SAFE });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id }, ...SAFE });
  }

  assignRole(id: string, dto: AssignRoleDto) {
    return this.prisma.userRole.create({
      data: { user: { connect: { id } }, role: { connect: { name: dto.roleName } } },
    });
  }

  disable(id: string) {
    return this.prisma.user.update({ where: { id }, data: { status: 'DISABLED' }, ...SAFE });
  }
}
