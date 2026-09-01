import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'HR')
  async create(@Body() dto: CreateTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.create(dto, user.userId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'HR')
  async findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'HR')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }


}