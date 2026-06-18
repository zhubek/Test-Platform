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
import { capabilitiesFor } from './params.access';
import type { ParamEntity } from './params.types';
import { ParamsService } from './params.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { CreateParamDto } from './dto/create-param.dto';
import { UpdateParamDto } from './dto/update-param.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class ParamsController {
  constructor(private readonly service: ParamsService) {}

  // --- nested under a project ---

  @Get('projects/:id/params')
  @RequireAccess('project', 'read')
  list(@Param('id') projectId: string) {
    return this.service.listForProject(projectId);
  }

  @Post('projects/:id/params')
  @RequireAccess('project', 'manageParams')
  create(@Param('id') projectId: string, @Body() dto: CreateParamDto) {
    return this.service.createUnderProject(projectId, dto);
  }

  // --- the param itself + its options ---

  @Get('params/:id')
  @RequireAccess('param', 'read')
  findOne(@Loaded() param: ParamEntity, @CurrentUser() user: AuthUser) {
    return { data: param, capabilities: capabilitiesFor(param, user) };
  }

  @Patch('params/:id')
  @RequireAccess('param', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateParamDto) {
    return this.service.update(id, dto);
  }

  @Delete('params/:id')
  @RequireAccess('param', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('params/:id/options')
  @RequireAccess('param', 'read')
  listOptions(@Param('id') id: string) {
    return this.service.listOptions(id);
  }

  @Post('params/:id/options')
  @RequireAccess('param', 'manageOptions')
  addOption(@Param('id') id: string, @Body() dto: CreateOptionDto) {
    return this.service.addOption(id, dto);
  }

  @Delete('params/:id/options/:optionId')
  @RequireAccess('param', 'manageOptions')
  removeOption(@Param('id') id: string, @Param('optionId') optionId: string) {
    return this.service.removeOption(id, optionId);
  }
}
