import { Body, Controller, Get, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Permissions('feedback.create')
  async submit(@Body() dto: CreateFeedbackDto, @CurrentUser() user: AuthenticatedUser) {
    return this.feedbackService.submit(user.userId, dto);
  }

  @Get()
  @Permissions('feedback.read')
  async findAll() {
    return this.feedbackService.findAll();
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.feedbackService.findMine(user.userId);
  }
}
