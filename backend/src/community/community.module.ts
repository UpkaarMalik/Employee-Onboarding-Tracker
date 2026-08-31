import { Module } from '@nestjs/common';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { PollsController } from './polls/polls.controller';
import { PollsService } from './polls/polls.service';

@Module({
  controllers: [PostsController, PollsController],
  providers: [PostsService, PollsService],
  exports: [PostsService, PollsService],
})
export class CommunityModule {}
