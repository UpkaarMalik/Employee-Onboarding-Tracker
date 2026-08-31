import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @Permissions('content.read')
  async findAll(@Query('category') category?: string) {
    return this.resourcesService.findAll(category);
  }

  @Get(':id/preview')
  @Permissions('content.read')
  async preview(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Post()
  @Permissions('content.manage')
  async create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Patch(':id')
  @Permissions('content.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }
}
