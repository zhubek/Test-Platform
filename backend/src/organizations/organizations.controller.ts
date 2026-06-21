import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessGuard } from '../common/access/access.guard';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Loaded } from '../common/decorators/loaded-entity.decorator';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { capabilitiesFor } from './organizations.access';
import type { OrganizationEntity } from './organizations.types';
import { maskCode, OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { SetOrgAdminDto } from './dto/set-org-admin.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  // --- nested under a project: the parent project is the authorized entity ---

  @Get('projects/:id/organizations')
  @RequireAccess('project', 'read')
  list(@Param('id') projectId: string) {
    return this.service.listForProject(projectId);
  }

  @Post('projects/:id/organizations')
  @RequireAccess('project', 'createOrganization')
  create(@Param('id') projectId: string, @Body() dto: CreateOrganizationDto) {
    return this.service.createUnderProject(projectId, dto);
  }

  // --- the organization itself ---

  @Get('organizations/:id')
  @RequireAccess('organization', 'read')
  async findOne(@Loaded() org: OrganizationEntity, @CurrentUser() user: AuthUser) {
    const capabilities = capabilitiesFor(org, user);
    // Show the activation code in full to a caller who can rotate it anyway
    // (super/project admin) so they can use it / hand it to the org admin; the
    // org admin's own view (/me/organization) stays masked.
    const code = capabilities.resetCode === true ? org.code : maskCode(org.code);
    // projectExpirationDate caps the org's own date in the settings UI.
    const projectExpirationDate = await this.service.projectExpiration(org.projectId);
    return { data: { ...org, code, projectExpirationDate }, capabilities };
  }

  // The caller's own org (org-admin area). JWT only — AccessGuard opts out
  // without @RequireAccess; capabilities tell the UI what this user may do.
  @Get('me/organization')
  async myOrganization(@CurrentUser() user: AuthUser) {
    const org = await this.service.getForUser(user.orgId);
    const { project, ...rest } = org;
    return {
      data: { ...rest, code: maskCode(org.code), projectExpirationDate: project?.expirationDate ?? null },
      capabilities: capabilitiesFor(org, user),
    };
  }

  @Patch('organizations/:id')
  @RequireAccess('organization', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(id, dto);
  }

  @Delete('organizations/:id')
  @RequireAccess('organization', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('organizations/:id/reset-code')
  @HttpCode(200)
  @RequireAccess('organization', 'resetCode')
  resetCode(@Param('id') id: string) {
    return this.service.resetCode(id);
  }

  // --- the org's admin user (view / set) ---

  @Get('organizations/:id/admin')
  @RequireAccess('organization', 'read')
  getAdmin(@Param('id') id: string) {
    return this.service.getAdmin(id);
  }

  @Patch('organizations/:id/admin')
  @RequireAccess('organization', 'update')
  setAdmin(@Param('id') id: string, @Body() dto: SetOrgAdminDto) {
    return this.service.setAdmin(id, dto);
  }
}
