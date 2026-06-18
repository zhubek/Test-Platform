import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../common/access/access.guard';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Loaded } from '../common/decorators/loaded-entity.decorator';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { capabilitiesFor } from './license-test.access';
import type { LicenseTestEntity } from './tests.types';
import { LicenseTestService } from './license-test.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('license-tests')
@UseGuards(JwtAuthGuard, AccessGuard)
export class LicenseTestsController {
  constructor(private readonly service: LicenseTestService) {}

  @Get(':id')
  @RequireAccess('licenseTest', 'read')
  async findOne(@Loaded() attempt: LicenseTestEntity, @CurrentUser() user: AuthUser) {
    // The guard loads a lean entity for authorization; return the full record
    // (with computed variables) for the response.
    const data = await this.service.findOne(attempt.id);
    return { data, capabilities: capabilitiesFor(attempt, user) };
  }

  @Patch(':id/progress')
  @RequireAccess('licenseTest', 'saveProgress')
  saveProgress(@Loaded() attempt: LicenseTestEntity, @Body() dto: SaveProgressDto) {
    return this.service.saveProgress(attempt, dto);
  }

  @Post(':id/submit')
  @HttpCode(200)
  @RequireAccess('licenseTest', 'submit')
  submit(@Loaded() attempt: LicenseTestEntity, @Body() dto: SubmitAttemptDto) {
    return this.service.submit(attempt, dto);
  }

  @Post(':id/expire')
  @HttpCode(200)
  @RequireAccess('licenseTest', 'expire')
  expire(@Loaded() attempt: LicenseTestEntity) {
    return this.service.expire(attempt);
  }
}
