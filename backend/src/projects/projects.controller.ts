import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AccessGuard } from '../common/access/access.guard';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Loaded } from '../common/decorators/loaded-entity.decorator';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { capabilitiesFor } from './projects.access';
import { CreateProjectDto } from './dto/create-project.dto';
import { SetProjectAdminDto } from './dto/set-project-admin.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import type { ProjectEntity } from './projects.types';

@Controller('projects')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  // No @RequireAccess: AccessGuard passes through; scoping happens in the service.
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listForUser(user);
  }

  @Post()
  @RequireAccess('project', 'create')
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @RequireAccess('project', 'read')
  findOne(@Loaded() project: ProjectEntity, @CurrentUser() user: AuthUser) {
    return { data: project, capabilities: capabilitiesFor(project, user) };
  }

  @Patch(':id')
  @RequireAccess('project', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireAccess('project', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // --- the project's admin account (login + password sign-in to /admin) ---

  @Get(':id/admin')
  @RequireAccess('project', 'read')
  getAdmin(@Param('id') id: string) {
    return this.service.getAdmin(id);
  }

  @Put(':id/admin')
  @RequireAccess('project', 'update')
  setAdmin(@Param('id') id: string, @Body() dto: SetProjectAdminDto) {
    return this.service.setAdmin(id, dto);
  }
}
