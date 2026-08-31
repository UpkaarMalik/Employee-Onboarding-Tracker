import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreatePollDto } from './dto/create-poll.dto';

export interface PollOption {
  id: string;
  text: string;
}

export interface PollRow {
  id: string;
  question: string;
  is_active: boolean;
  created_at: string;
  options: PollOption[];
  my_vote_option_id: string | null;
}

@Injectable()
export class PollsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createdBy: string, dto: CreatePollDto): Promise<PollRow> {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: pollRows } = await client.query<{ id: string; question: string; is_active: boolean; created_at: string }>(
        'INSERT INTO polls (question, created_by) VALUES ($1, $2) RETURNING id, question, is_active, created_at',
        [dto.question, createdBy],
      );
      const poll = pollRows[0];

      const options: PollOption[] = [];
      for (const text of dto.options) {
        const { rows } = await client.query<PollOption>(
          'INSERT INTO poll_options (poll_id, text) VALUES ($1, $2) RETURNING id, text',
          [poll.id, text],
        );
        options.push(rows[0]);
      }

      await client.query('COMMIT');
      return { ...poll, options, my_vote_option_id: null };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll(currentUserId: string): Promise<PollRow[]> {
    const { rows: polls } = await this.db.query<{ id: string; question: string; is_active: boolean; created_at: string }>(
      'SELECT id, question, is_active, created_at FROM polls ORDER BY created_at DESC',
    );
    if (polls.length === 0) return [];

    const pollIds = polls.map((p) => p.id);
    const { rows: options } = await this.db.query<{ id: string; poll_id: string; text: string }>(
      'SELECT id, poll_id, text FROM poll_options WHERE poll_id = ANY($1)',
      [pollIds],
    );
    const { rows: myVotes } = await this.db.query<{ poll_id: string; option_id: string }>(
      'SELECT poll_id, option_id FROM poll_votes WHERE poll_id = ANY($1) AND user_id = $2',
      [pollIds, currentUserId],
    );

    const optionsByPoll = new Map<string, PollOption[]>();
    for (const o of options) {
      const existing = optionsByPoll.get(o.poll_id) ?? [];
      existing.push({ id: o.id, text: o.text });
      optionsByPoll.set(o.poll_id, existing);
    }
    const myVoteByPoll = new Map(myVotes.map((v) => [v.poll_id, v.option_id]));

    return polls.map((p) => ({
      ...p,
      options: optionsByPoll.get(p.id) ?? [],
      my_vote_option_id: myVoteByPoll.get(p.id) ?? null,
    }));
  }

  async vote(pollId: string, userId: string, optionId: string): Promise<{ success: true }> {
    const { rows: pollRows } = await this.db.query<{ is_active: boolean }>(
      'SELECT is_active FROM polls WHERE id = $1',
      [pollId],
    );
    if (pollRows.length === 0) {
      throw new NotFoundException('Poll not found');
    }
    if (!pollRows[0].is_active) {
      throw new ConflictException('This poll is no longer active');
    }

    const { rows: optionRows } = await this.db.query(
      'SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2',
      [optionId, pollId],
    );
    if (optionRows.length === 0) {
      throw new NotFoundException('Poll option not found');
    }

    try {
      await this.db.query(
        'INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)',
        [pollId, optionId, userId],
      );
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException('You have already voted on this poll');
      }
      throw err;
    }

    return { success: true };
  }

  async results(pollId: string): Promise<{ poll_id: string; question: string; results: { option_id: string; text: string; votes: number }[]; total: number }> {
    const { rows: pollRows } = await this.db.query<{ question: string }>(
      'SELECT question FROM polls WHERE id = $1',
      [pollId],
    );
    if (pollRows.length === 0) {
      throw new NotFoundException('Poll not found');
    }

    const { rows } = await this.db.query<{ option_id: string; text: string; votes: string }>(
      `SELECT po.id AS option_id, po.text, COUNT(pv.id) AS votes
       FROM poll_options po
       LEFT JOIN poll_votes pv ON pv.option_id = po.id
       WHERE po.poll_id = $1
       GROUP BY po.id, po.text
       ORDER BY po.text`,
      [pollId],
    );

    const results = rows.map((r) => ({ option_id: r.option_id, text: r.text, votes: parseInt(r.votes, 10) }));
    const total = results.reduce((sum, r) => sum + r.votes, 0);

    return { poll_id: pollId, question: pollRows[0].question, results, total };
  }
}
