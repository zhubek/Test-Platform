import {
  Body,
  Controller,
  Delete,
  Get,
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
import { capabilitiesFor } from './languages.access';
import type { LanguageEntity } from './languages.types';
import { LanguagesService } from './languages.service';
import { AssignLanguageDto } from './dto/assign-language.dto';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class LanguagesController {
  constructor(private readonly service: LanguagesService) {}

  // --- global catalog ---

  @Get('languages')
  @RequireAccess('language', 'read')
  list() {
    return this.service.list();
  }

  @Post('languages')
  @RequireAccess('language', 'create')
  create(@Body() dto: CreateLanguageDto) {
    return this.service.create(dto);
  }

  @Get('languages/:id')
  @RequireAccess('language', 'read')
  findOne(@Loaded() language: LanguageEntity, @CurrentUser() user: AuthUser) {
    return { data: language, capabilities: capabilitiesFor(language, user) };
  }

  @Patch('languages/:id')
  @RequireAccess('language', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.service.update(id, dto);
  }

  @Delete('languages/:id')
  @RequireAccess('language', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // --- per-project assignment (authorized against the project) ---

  @Get('projects/:id/languages')
  @RequireAccess('project', 'read')
  listForProject(@Param('id') projectId: string) {
    return this.service.listForProject(projectId);
  }

  @Post('projects/:id/languages')
  @RequireAccess('project', 'manageLanguages')
  assign(@Param('id') projectId: string, @Body() dto: AssignLanguageDto) {
    return this.service.assignToProject(projectId, dto.languageId);
  }

  @Delete('projects/:id/languages/:languageId')
  @RequireAccess('project', 'manageLanguages')
  unassign(@Param('id') projectId: string, @Param('languageId') languageId: string) {
    return this.service.removeFromProject(projectId, languageId);
  }
}
