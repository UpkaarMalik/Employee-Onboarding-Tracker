import { Module } from '@nestjs/common';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { PollsController } from './polls/polls.controller';
import { PollsService } from './polls/polls.service';
import { QuestionsController } from './questions/questions.controller';
import { QuestionsService } from './questions/questions.service';

@Module({
  controllers: [PostsController, PollsController, QuestionsController],
  providers: [PostsService, PollsService, QuestionsService],
  exports: [PostsService, PollsService, QuestionsService],
})
export class CommunityModule {}
