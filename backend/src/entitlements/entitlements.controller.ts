import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { CreateEntitlementDto } from './dto/create-entitlement.dto';
import { UpdateEntitlementDto } from './dto/update-entitlement.dto';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('entitlements')
export class EntitlementsController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  @Get()
  @Permissions('benefits.read')
  async findAll() {
    return this.entitlementsService.findAll();
  }

  @Post()
  @Permissions('benefits.manage')
  async create(@Body() dto: CreateEntitlementDto) {
    return this.entitlementsService.create(dto);
  }

  @Patch(':id')
  @Permissions('benefits.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateEntitlementDto) {
    return this.entitlementsService.update(id, dto);
  }
}
