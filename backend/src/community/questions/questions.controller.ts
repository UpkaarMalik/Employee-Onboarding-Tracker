import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';

interface AuthenticatedUser {
  userId: string;
}

@Controller('community/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.create(user.userId, dto);
  }

  @Post(':id/answer')
  answer(
    @Param('id') id: string,
    @Body() dto: AnswerQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.answer(id, user.userId, dto);
  }
}
