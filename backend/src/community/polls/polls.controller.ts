import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.pollsService.findAll(user.userId);
  }

  @Post()
  @Permissions('poll.manage')
  async create(@Body() dto: CreatePollDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pollsService.create(user.userId, dto);
  }

  @Post(':id/vote')
  @Permissions('poll.vote')
  async vote(
    @Param('id') id: string,
    @Body() dto: VotePollDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pollsService.vote(id, user.userId, dto.option_id);
  }

  @Get(':id/results')
  async results(@Param('id') id: string) {
    return this.pollsService.results(id);
  }
}
