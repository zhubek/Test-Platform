import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_ACCESS, RequireAccessMeta } from '../decorators/require-access.decorator';
import { accessRegistry } from './registry';
import { AuthUser } from './types';

/**
 * The ONE authorization guard. Reads {entity, action} from @RequireAccess,
 * loads the entity fresh from the DB, stashes it on req.loadedEntity for the
 * handler to reuse, and enforces `can()`. Authentication (req.user) must
 * already have happened via JwtAuthGuard.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<RequireAccessMeta | undefined>(
      REQUIRE_ACCESS,
      ctx.getHandler(),
    );
    if (!meta) return true; // route opts out of access control

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user) throw new UnauthorizedException();

    const entry = accessRegistry.get(meta.entity);
    if (!entry) {
      throw new Error(`No access registration for entity "${meta.entity}"`);
    }

    // Entity-scoped actions carry an :id; create-style actions don't (entity = null).
    const id: string | undefined = req.params?.id;
    let entity: unknown = null;
    if (id !== undefined) {
      entity = await entry.load(this.prisma, id);
      if (!entity) throw new NotFoundException(`${meta.entity} not found`);
      req.loadedEntity = entity;
    }

    if (!entry.can(meta.action, entity, user)) {
      throw new ForbiddenException(`Not allowed to ${meta.action} ${meta.entity}`);
    }
    return true;
  }
}
