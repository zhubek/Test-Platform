import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlockType } from '@prisma/client';
import { AccessGuard } from '../common/access/access.guard';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Loaded } from '../common/decorators/loaded-entity.decorator';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { capabilitiesFor } from './blocks.access';
import type { BlockEntity } from './blocks.types';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class BlocksController {
  constructor(private readonly service: BlocksService) {}

  @Get('blocks')
  @RequireAccess('block', 'read')
  list(@Query('type') type?: string, @Query('projectId') projectId?: string) {
    const filter =
      type && (Object.values(BlockType) as string[]).includes(type)
        ? (type as BlockType)
        : undefined;
    return this.service.list(filter, projectId || undefined);
  }

  @Post('blocks')
  @RequireAccess('block', 'create')
  create(@Body() dto: CreateBlockDto) {
    return this.service.create(dto);
  }

  @Get('blocks/:id')
  @RequireAccess('block', 'read')
  findOne(@Loaded() block: BlockEntity, @CurrentUser() user: AuthUser) {
    return { data: block, capabilities: capabilitiesFor(block, user) };
  }

  @Patch('blocks/:id')
  @RequireAccess('block', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.service.update(id, dto);
  }

  @Delete('blocks/:id')
  @RequireAccess('block', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // Duplicating produces a NEW block, so it is authorized as a `create`.
  @Post('blocks/:id/duplicate')
  @RequireAccess('block', 'create')
  duplicate(@Param('id') id: string) {
    return this.service.duplicate(id);
  }
}
