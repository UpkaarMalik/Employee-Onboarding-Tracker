import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

export interface FeedbackRow {
  instance_id: string;
  employee_id: string;
  employee_name: string;
  feedback_rating: number;
  feedback_comments: string | null;
  feedback_submitted_at: string;
}

@Injectable()
export class FeedbackService {
  constructor(private readonly db: DatabaseService) {}

  async submit(employeeId: string, dto: CreateFeedbackDto): Promise<FeedbackRow> {
    const { rows: instanceRows } = await this.db.query<{ id: string; status: string; feedback_submitted_at: string | null }>(
      'SELECT id, status, feedback_submitted_at FROM onboarding_instances WHERE employee_id = $1',
      [employeeId],
    );
    if (instanceRows.length === 0) {
      throw new NotFoundException('No onboarding instance found for this account');
    }
    const instance = instanceRows[0];
    if (instance.status !== 'COMPLETED') {
      throw new ConflictException('Feedback can only be submitted once onboarding is completed');
    }
    if (instance.feedback_submitted_at) {
      throw new ConflictException('Feedback has already been submitted for this onboarding');
    }

    const { rows } = await this.db.query<{
      id: string;
      employee_id: string;
      feedback_rating: number;
      feedback_comments: string | null;
      feedback_submitted_at: string;
    }>(
      `UPDATE onboarding_instances
       SET feedback_rating = $1, feedback_comments = $2, feedback_submitted_at = now()
       WHERE id = $3
       RETURNING id, employee_id, feedback_rating, feedback_comments, feedback_submitted_at`,
      [dto.rating, dto.comments ?? null, instance.id],
    );
    const updated = rows[0];

    const { rows: employeeRows } = await this.db.query<{ full_name: string }>(
      'SELECT full_name FROM users WHERE id = $1',
      [employeeId],
    );

    return {
      instance_id: updated.id,
      employee_id: updated.employee_id,
      employee_name: employeeRows[0]?.full_name ?? '',
      feedback_rating: updated.feedback_rating,
      feedback_comments: updated.feedback_comments,
      feedback_submitted_at: updated.feedback_submitted_at,
    };
  }

  async findMine(employeeId: string): Promise<FeedbackRow | null> {
    const { rows } = await this.db.query<{
      id: string;
      employee_id: string;
      feedback_rating: number | null;
      feedback_comments: string | null;
      feedback_submitted_at: string | null;
    }>(
      'SELECT id, employee_id, feedback_rating, feedback_comments, feedback_submitted_at FROM onboarding_instances WHERE employee_id = $1',
      [employeeId],
    );
    if (rows.length === 0 || !rows[0].feedback_submitted_at) {
      return null;
    }
    const r = rows[0];
    return {
      instance_id: r.id,
      employee_id: r.employee_id,
      employee_name: '',
      feedback_rating: r.feedback_rating!,
      feedback_comments: r.feedback_comments,
      feedback_submitted_at: r.feedback_submitted_at!,
    };
  }

  async findAll(): Promise<{ items: FeedbackRow[]; averageRating: number | null; count: number }> {
    const { rows } = await this.db.query<{
      id: string;
      employee_id: string;
      employee_name: string;
      feedback_rating: number;
      feedback_comments: string | null;
      feedback_submitted_at: string;
    }>(
      `SELECT oi.id, oi.employee_id, u.full_name AS employee_name,
              oi.feedback_rating, oi.feedback_comments, oi.feedback_submitted_at
       FROM onboarding_instances oi
       JOIN users u ON u.id = oi.employee_id
       WHERE oi.feedback_submitted_at IS NOT NULL
       ORDER BY oi.feedback_submitted_at DESC`,
    );

    const items = rows.map((r) => ({
      instance_id: r.id,
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      feedback_rating: r.feedback_rating,
      feedback_comments: r.feedback_comments,
      feedback_submitted_at: r.feedback_submitted_at,
    }));

    const averageRating = items.length > 0
      ? items.reduce((sum, i) => sum + i.feedback_rating, 0) / items.length
      : null;

    return { items, averageRating, count: items.length };
  }
}
