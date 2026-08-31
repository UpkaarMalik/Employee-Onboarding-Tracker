import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ContentGalleryService } from './content-gallery.service';
import { CreateContentGalleryDto } from './dto/create-content-gallery.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('content-gallery')
export class ContentGalleryController {
  constructor(private readonly contentGalleryService: ContentGalleryService) {}

  @Get()
  @Permissions('content.read')
  async findAll(@Query('type') type?: string) {
    return this.contentGalleryService.findAll(type);
  }

  @Post()
  @Permissions('content.manage')
  async create(@Body() dto: CreateContentGalleryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.contentGalleryService.create(dto, user.userId);
  }

  @Delete(':id')
  @Permissions('content.manage')
  async remove(@Param('id') id: string) {
    await this.contentGalleryService.delete(id);
    return { success: true };
  }
}
