import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ROLES } from '../auth/roles';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MigrationService, type ImportMode, type ProjectBundle } from './migration.service';

// Project content export/import — a super-admin migration tool (e.g. dev → prod).
@Controller()
@UseGuards(JwtAuthGuard)
export class MigrationController {
  constructor(private readonly service: MigrationService) {}

  @Get('projects/:id/export')
  export(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    this.assertSuper(user);
    return this.service.exportProject(id);
  }

  @Post('migration/import')
  @HttpCode(200)
  import(
    @Body() bundle: ProjectBundle,
    @CurrentUser() user: AuthUser,
    @Query('targetProjectId') targetProjectId?: string,
    @Query('mode') mode?: string,
  ) {
    this.assertSuper(user);
    const m: ImportMode = mode === 'clone' ? 'clone' : 'merge';
    return this.service.importBundle(bundle, targetProjectId || undefined, m);
  }

  private assertSuper(user: AuthUser) {
    if (!user.roles.includes(ROLES.SUPER_ADMIN)) {
      throw new ForbiddenException('Only a super-admin may export or import projects.');
    }
  }
}
