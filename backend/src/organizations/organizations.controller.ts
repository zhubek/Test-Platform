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
  findOne(@Loaded() org: OrganizationEntity, @CurrentUser() user: AuthUser) {
    // The activation code is shown in full only at create/reset; reads mask it.
    return { data: { ...org, code: maskCode(org.code) }, capabilities: capabilitiesFor(org, user) };
  }

  // The caller's own org (org-admin area). JWT only — AccessGuard opts out
  // without @RequireAccess; capabilities tell the UI what this user may do.
  @Get('me/organization')
  async myOrganization(@CurrentUser() user: AuthUser) {
    const org = await this.service.getForUser(user.orgId);
    return { data: { ...org, code: maskCode(org.code) }, capabilities: capabilitiesFor(org, user) };
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
