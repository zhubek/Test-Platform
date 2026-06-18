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
import { capabilitiesFor } from './licenses.access';
import { CreateLicenseDto } from './dto/create-license.dto';
import { GenerateLicensesDto } from './dto/generate-licenses.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { LicensesService } from './licenses.service';
import type { LicenseEntity } from './licenses.types';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class LicensesController {
  constructor(private readonly service: LicensesService) {}

  // --- nested under an organization: the org is the authorized entity ---

  @Get('organizations/:id/licenses')
  @RequireAccess('organization', 'read')
  list(@Param('id') organizationId: string) {
    return this.service.listForOrganization(organizationId);
  }

  @Get('projects/:id/licenses')
  @RequireAccess('project', 'read')
  listForProject(@Param('id') projectId: string) {
    return this.service.listForProject(projectId);
  }

  @Post('organizations/:id/licenses')
  @RequireAccess('organization', 'createLicense')
  create(
    @Loaded() org: { id: string; projectId: string },
    @Body() dto: CreateLicenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createUnderOrganization(org, dto, user.id);
  }

  @Post('organizations/:id/licenses/generate')
  @RequireAccess('organization', 'createLicense')
  generate(
    @Loaded() org: { id: string; projectId: string },
    @Body() dto: GenerateLicensesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.generateUnderOrganization(org, dto, user.id);
  }

  // --- the license itself ---

  @Get('licenses/:id')
  @RequireAccess('license', 'read')
  findOne(@Loaded() license: LicenseEntity, @CurrentUser() user: AuthUser) {
    return { data: license, capabilities: capabilitiesFor(license, user) };
  }

  @Patch('licenses/:id')
  @RequireAccess('license', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateLicenseDto) {
    return this.service.update(id, dto);
  }

  @Delete('licenses/:id')
  @RequireAccess('license', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('licenses/:id/revoke')
  @HttpCode(200)
  @RequireAccess('license', 'revoke')
  revoke(@Loaded() license: LicenseEntity) {
    return this.service.changeState(license, 'REVOKED');
  }

  @Post('licenses/:id/expire')
  @HttpCode(200)
  @RequireAccess('license', 'expire')
  expire(@Loaded() license: LicenseEntity) {
    return this.service.changeState(license, 'EXPIRED');
  }

  @Post('licenses/:id/renew')
  @HttpCode(200)
  @RequireAccess('license', 'renew')
  renew(@Loaded() license: LicenseEntity) {
    return this.service.changeState(license, 'ACTIVE');
  }

  @Post('licenses/:id/reset-code')
  @HttpCode(200)
  @RequireAccess('license', 'resetCode')
  resetCode(@Loaded() license: LicenseEntity) {
    return this.service.resetCode(license);
  }
}
