import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TestSurface } from '@prisma/client';
import { AccessGuard } from '../common/access/access.guard';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Loaded } from '../common/decorators/loaded-entity.decorator';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { capabilitiesFor } from './tests.access';
import type { TestEntity } from './tests.types';
import { TestsService } from './tests.service';
import { LicenseTestService } from './license-test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { SaveTestBlocksDto } from './dto/save-test-blocks.dto';
import { SetTestParamsDto } from './dto/set-test-params.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class TestsController {
  constructor(
    private readonly service: TestsService,
    private readonly attempts: LicenseTestService,
  ) {}

  // --- holder-facing: my published tests (JWT only; AccessGuard opts out) ---

  @Get('me/tests')
  listMine(@CurrentUser() user: AuthUser) {
    return this.service.listForHolder(user);
  }

  // Org-admin results: attempts across the org's licenses. Authorized as a read
  // of the parent organization (org_admin / project_admin / super_admin).
  @Get('organizations/:id/attempts')
  @RequireAccess('organization', 'read')
  listOrgAttempts(@Param('id') orgId: string) {
    return this.attempts.listForOrganization(orgId);
  }

  // Project-level dashboards: completed attempts across all of the project's
  // tests (their license_test_variables), newest first.
  @Get('projects/:id/attempts')
  @RequireAccess('project', 'read')
  listProjectAttempts(@Param('id') projectId: string) {
    return this.attempts.listForProject(projectId);
  }

  // --- nested under a project: the parent project is the authorized entity ---

  @Get('projects/:id/tests')
  @RequireAccess('project', 'read')
  list(@Param('id') projectId: string) {
    return this.service.listForProject(projectId);
  }

  @Post('projects/:id/tests')
  @RequireAccess('project', 'createTest')
  create(@Param('id') projectId: string, @Body() dto: CreateTestDto) {
    return this.service.createUnderProject(projectId, dto);
  }

  // --- the test itself ---

  @Get('tests/:id')
  @RequireAccess('test', 'read')
  findOne(@Loaded() test: TestEntity, @CurrentUser() user: AuthUser) {
    return { data: test, capabilities: capabilitiesFor(test, user) };
  }

  @Patch('tests/:id')
  @RequireAccess('test', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateTestDto) {
    return this.service.update(id, dto);
  }

  @Delete('tests/:id')
  @RequireAccess('test', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // --- lifecycle ---

  @Post('tests/:id/publish')
  @HttpCode(200)
  @RequireAccess('test', 'publish')
  publish(@Loaded() test: TestEntity) {
    return this.service.changeState(test, 'PUBLISHED');
  }

  @Post('tests/:id/unpublish')
  @HttpCode(200)
  @RequireAccess('test', 'unpublish')
  unpublish(@Loaded() test: TestEntity) {
    return this.service.changeState(test, 'DRAFT');
  }

  @Post('tests/:id/archive')
  @HttpCode(200)
  @RequireAccess('test', 'archive')
  archive(@Loaded() test: TestEntity) {
    return this.service.changeState(test, 'ARCHIVED');
  }

  // --- blocks (per surface) ---

  @Get('tests/:id/blocks')
  @RequireAccess('test', 'read')
  listBlocks(@Param('id') id: string, @Query('surface') surface?: string) {
    const s =
      surface && (Object.values(TestSurface) as string[]).includes(surface)
        ? (surface as TestSurface)
        : undefined;
    return this.service.listBlocks(id, s);
  }

  @Put('tests/:id/blocks')
  @RequireAccess('test', 'manageBlocks')
  saveBlocks(@Param('id') id: string, @Body() dto: SaveTestBlocksDto) {
    return this.service.saveBlocks(id, dto);
  }

  // --- project parameters ---

  @Get('tests/:id/params')
  @RequireAccess('test', 'read')
  listParams(@Param('id') id: string) {
    return this.service.listParams(id);
  }

  @Put('tests/:id/params')
  @RequireAccess('test', 'manageParams')
  setParams(@Param('id') id: string, @Body() dto: SetTestParamsDto) {
    return this.service.setParams(id, dto);
  }

  // --- attempts (admin view + holder start) ---

  @Get('tests/:id/attempts')
  @RequireAccess('test', 'read')
  listAttempts(@Param('id') id: string) {
    return this.attempts.listForTest(id);
  }

  @Post('tests/:id/attempts')
  @RequireAccess('test', 'attempt')
  startAttempt(@Loaded() test: TestEntity, @CurrentUser() user: AuthUser) {
    return this.attempts.start(user.licenseId, test.id);
  }
}
