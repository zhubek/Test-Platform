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
import { AccessGuard } from '../common/access/access.guard';
import type { AuthUser } from '../common/access/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Loaded } from '../common/decorators/loaded-entity.decorator';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  charGroupCapabilitiesFor,
  groupCapabilitiesFor,
  itemCapabilitiesFor,
} from './data-catalogs.access';
import type {
  CatalogGroupEntity,
  CatalogItemEntity,
  CharacteristicGroupEntity,
} from './data-catalogs.types';
import { DataCatalogsService } from './data-catalogs.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import {
  CreateCharacteristicDto,
  CreateCharacteristicGroupDto,
  UpdateCharacteristicDto,
  UpdateCharacteristicGroupDto,
} from './dto/characteristic.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class DataCatalogsController {
  constructor(private readonly service: DataCatalogsService) {}

  // ── Catalog groups (schema: extra variables + page templates) ────────────

  @Get('catalog-groups')
  @RequireAccess('catalogGroup', 'read')
  listGroups(@Query('projectId') projectId?: string) {
    return this.service.listGroups(projectId || undefined);
  }

  @Post('catalog-groups')
  @RequireAccess('catalogGroup', 'create')
  createGroup(@Body() dto: CreateGroupDto) {
    return this.service.createGroup(dto);
  }

  @Get('catalog-groups/:id')
  @RequireAccess('catalogGroup', 'read')
  async getGroup(@Loaded() group: CatalogGroupEntity, @CurrentUser() user: AuthUser) {
    return {
      data: await this.service.getGroup(group.id),
      capabilities: groupCapabilitiesFor(group, user),
    };
  }

  @Patch('catalog-groups/:id')
  @RequireAccess('catalogGroup', 'update')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.service.updateGroup(id, dto);
  }

  @Delete('catalog-groups/:id')
  @RequireAccess('catalogGroup', 'delete')
  removeGroup(@Param('id') id: string) {
    return this.service.deleteGroup(id);
  }

  // ── Characteristic groups (reusable numeric dimension sets) ──────────────

  @Get('characteristic-groups')
  @RequireAccess('characteristicGroup', 'read')
  listCharacteristicGroups() {
    return this.service.listCharacteristicGroups();
  }

  @Post('characteristic-groups')
  @RequireAccess('characteristicGroup', 'create')
  createCharacteristicGroup(@Body() dto: CreateCharacteristicGroupDto) {
    return this.service.createCharacteristicGroup(dto);
  }

  @Get('characteristic-groups/:id')
  @RequireAccess('characteristicGroup', 'read')
  async getCharacteristicGroup(
    @Loaded() group: CharacteristicGroupEntity,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      data: await this.service.getCharacteristicGroup(group.id),
      capabilities: charGroupCapabilitiesFor(group, user),
    };
  }

  @Patch('characteristic-groups/:id')
  @RequireAccess('characteristicGroup', 'update')
  updateCharacteristicGroup(@Param('id') id: string, @Body() dto: UpdateCharacteristicGroupDto) {
    return this.service.updateCharacteristicGroup(id, dto);
  }

  // Adding a characteristic edits the group → authorized as a group update.
  @Post('characteristic-groups/:id/characteristics')
  @RequireAccess('characteristicGroup', 'update')
  createCharacteristic(@Param('id') groupId: string, @Body() dto: CreateCharacteristicDto) {
    return this.service.createCharacteristic(groupId, dto);
  }

  @Patch('characteristics/:id')
  @RequireAccess('characteristic', 'update')
  updateCharacteristic(@Param('id') id: string, @Body() dto: UpdateCharacteristicDto) {
    return this.service.updateCharacteristic(id, dto);
  }

  // ── Items (data: title, description, extra values, relations) ────────────

  @Get('catalog-groups/:id/items')
  @RequireAccess('catalogGroup', 'read')
  listItems(@Param('id') groupId: string) {
    return this.service.listItems(groupId);
  }

  // Creating an item changes the group's content → authorized as group update.
  @Post('catalog-groups/:id/items')
  @RequireAccess('catalogGroup', 'update')
  createItem(@Param('id') groupId: string, @Body() dto: CreateItemDto) {
    return this.service.createItem(groupId, dto);
  }

  @Get('catalog-items/:id')
  @RequireAccess('catalogItem', 'read')
  async getItem(@Loaded() item: CatalogItemEntity, @CurrentUser() user: AuthUser) {
    return {
      data: await this.service.getItem(item.id),
      capabilities: itemCapabilitiesFor(item, user),
    };
  }

  @Patch('catalog-items/:id')
  @RequireAccess('catalogItem', 'update')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.service.updateItem(id, dto);
  }

  @Delete('catalog-items/:id')
  @RequireAccess('catalogItem', 'delete')
  removeItem(@Param('id') id: string) {
    return this.service.deleteItem(id);
  }
}
