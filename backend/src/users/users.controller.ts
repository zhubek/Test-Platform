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
import { capabilitiesFor } from './users.access';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import type { UserView } from './users.types';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // Everyone in a project (authorized against the project). Used by the admin UI.
  @Get('projects/:id/users')
  @RequireAccess('project', 'read')
  listForProject(@Param('id') projectId: string) {
    return this.service.listForProject(projectId);
  }

  // Global list: super_admin sees everyone, others see only themselves.
  @Get('users')
  list(@CurrentUser() user: AuthUser) {
    return this.service.listForUser(user);
  }

  @Post('users')
  @RequireAccess('user', 'create')
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Get('users/:id')
  @RequireAccess('user', 'read')
  findOne(@Loaded() target: UserView, @CurrentUser() user: AuthUser) {
    return { data: target, capabilities: capabilitiesFor(target as never, user) };
  }

  @Patch('users/:id')
  @RequireAccess('user', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Delete('users/:id')
  @RequireAccess('user', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('users/:id/roles')
  @RequireAccess('user', 'assignRole')
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.service.assignRole(id, dto);
  }

  @Post('users/:id/disable')
  @HttpCode(200)
  @RequireAccess('user', 'disable')
  disable(@Param('id') id: string) {
    return this.service.disable(id);
  }
}
