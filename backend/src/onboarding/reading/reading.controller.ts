import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReadingService } from './reading.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
}

@Controller('reading')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Post(':taskId/heartbeat')
  async heartbeat(
    @Param('taskId') taskId: string,
    @Body() dto: HeartbeatDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.readingService.heartbeat(taskId, user.userId, dto.activeSeconds);
  }

  @Get(':taskId/progress')
  async progress(@Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.readingService.getProgress(taskId, user.userId);
  }
  @Get('reminders')
async reminders(@CurrentUser() user: AuthenticatedUser) {
  return this.readingService.getPendingReminders(user.userId);
}
}