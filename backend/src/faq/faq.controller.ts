import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  @Permissions('faq.read')
  async findAll() {
    return this.faqService.findAll();
  }

  @Post()
  @Permissions('faq.manage')
  async create(@Body() dto: CreateFaqDto, @CurrentUser() user: AuthenticatedUser) {
    return this.faqService.create(dto, user.userId);
  }

  @Patch(':id')
  @Permissions('faq.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('faq.manage')
  async remove(@Param('id') id: string) {
    await this.faqService.delete(id);
    return { success: true };
  }
}
