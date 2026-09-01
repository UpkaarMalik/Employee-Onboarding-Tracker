import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

export interface CommunityQuestion {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
}

@Injectable()
export class QuestionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<CommunityQuestion[]> {
    const { rows } = await this.db.query<CommunityQuestion>(
      `SELECT id, question, answer, created_at, answered_at
       FROM community_questions
       ORDER BY created_at DESC`,
    );
    return rows;
  }

  async create(authorId: string, dto: CreateQuestionDto): Promise<CommunityQuestion> {
    const { rows } = await this.db.query<CommunityQuestion>(
      `INSERT INTO community_questions (question, author_id)
       VALUES ($1, $2)
       RETURNING id, question, answer, created_at, answered_at`,
      [dto.question.trim(), authorId],
    );
    return rows[0];
  }

  async answer(questionId: string, userId: string, dto: AnswerQuestionDto): Promise<CommunityQuestion> {
    const { rows } = await this.db.query<CommunityQuestion>(
      `UPDATE community_questions
       SET answer = $1, answered_by = $2, answered_at = now(), updated_at = now()
       WHERE id = $3
       RETURNING id, question, answer, created_at, answered_at`,
      [dto.answer.trim(), userId, questionId],
    );
    if (rows.length === 0) throw new NotFoundException('Question not found');
    return rows[0];
  }
}
