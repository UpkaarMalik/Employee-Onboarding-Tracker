import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

export interface FaqRow {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

@Injectable()
export class FaqService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<FaqRow[]> {
    const { rows } = await this.db.query<FaqRow>(
      'SELECT * FROM faqs WHERE is_active = true ORDER BY category, created_at',
    );
    return rows;
  }

  async create(dto: CreateFaqDto, createdBy: string): Promise<FaqRow> {
    const { rows } = await this.db.query<FaqRow>(
      `INSERT INTO faqs (category, question, answer, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dto.category, dto.question, dto.answer, createdBy],
    );
    return rows[0];
  }

  async update(id: string, dto: UpdateFaqDto): Promise<FaqRow> {
    const { rows } = await this.db.query<FaqRow>(
      `UPDATE faqs SET
         category = COALESCE($1, category),
         question = COALESCE($2, question),
         answer = COALESCE($3, answer),
         is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [dto.category ?? null, dto.question ?? null, dto.answer ?? null, dto.is_active ?? null, id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('FAQ not found');
    }
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const { rowCount } = await this.db.query('DELETE FROM faqs WHERE id = $1', [id]);
    if (rowCount === 0) {
      throw new NotFoundException('FAQ not found');
    }
  }
}
