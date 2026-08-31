import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/audit.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ModeratePostDto } from './dto/moderate-post.dto';

export interface PostRow {
  id: string;
  content: string;
  status: 'VISIBLE' | 'HIDDEN';
  moderation_reason: string | null;
  moderated_at: string | null;
  created_at: string;
  reactions: Record<string, number>;
  my_reaction: string | null;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(currentUserId: string, includeHidden: boolean): Promise<PostRow[]> {
    const where = includeHidden ? '' : "WHERE p.status = 'VISIBLE'";
    const { rows } = await this.db.query<{
      id: string;
      content: string;
      status: 'VISIBLE' | 'HIDDEN';
      moderation_reason: string | null;
      moderated_at: string | null;
      created_at: string;
    }>(
      `SELECT p.id, p.content, p.status, p.moderation_reason, p.moderated_at, p.created_at
       FROM posts p
       ${where}
       ORDER BY p.created_at DESC`,
    );

    if (rows.length === 0) return [];

    const postIds = rows.map((r) => r.id);
    const { rows: reactionRows } = await this.db.query<{ post_id: string; reaction: string; count: string }>(
      `SELECT post_id, reaction, COUNT(*) as count FROM post_reactions WHERE post_id = ANY($1) GROUP BY post_id, reaction`,
      [postIds],
    );
    const { rows: myReactionRows } = await this.db.query<{ post_id: string; reaction: string }>(
      `SELECT post_id, reaction FROM post_reactions WHERE post_id = ANY($1) AND user_id = $2`,
      [postIds, currentUserId],
    );

    const reactionsByPost = new Map<string, Record<string, number>>();
    for (const r of reactionRows) {
      const existing = reactionsByPost.get(r.post_id) ?? {};
      existing[r.reaction] = parseInt(r.count, 10);
      reactionsByPost.set(r.post_id, existing);
    }
    const myReactionByPost = new Map(myReactionRows.map((r) => [r.post_id, r.reaction]));

    return rows.map((r) => ({
      ...r,
      reactions: reactionsByPost.get(r.id) ?? {},
      my_reaction: myReactionByPost.get(r.id) ?? null,
    }));
  }

  async create(authorId: string, dto: CreatePostDto): Promise<{ id: string; content: string; status: string; created_at: string }> {
    const { rows } = await this.db.query<{ id: string; content: string; status: string; created_at: string }>(
      `INSERT INTO posts (author_id, content) VALUES ($1, $2)
       RETURNING id, content, status, created_at`,
      [authorId, dto.content],
    );
    return rows[0];
  }

  async moderate(postId: string, dto: ModeratePostDto, moderatorId: string) {
    const { rows: existing } = await this.db.query<{ status: string }>(
      'SELECT status FROM posts WHERE id = $1',
      [postId],
    );
    if (existing.length === 0) {
      throw new NotFoundException('Post not found');
    }

    const newStatus = dto.action === 'HIDE' ? 'HIDDEN' : 'VISIBLE';

    const { rows } = await this.db.query(
      `UPDATE posts SET
         status = $1,
         moderation_reason = $2,
         moderated_by = $3,
         moderated_at = now()
       WHERE id = $4
       RETURNING id, content, status, moderation_reason, moderated_at, created_at`,
      [newStatus, dto.reason ?? null, moderatorId, postId],
    );

    return rows[0];
  }

  async react(postId: string, userId: string, reaction: string) {
    const { rows: postRows } = await this.db.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postRows.length === 0) {
      throw new NotFoundException('Post not found');
    }

    await this.db.query(
      `INSERT INTO post_reactions (post_id, user_id, reaction)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET reaction = EXCLUDED.reaction`,
      [postId, userId, reaction],
    );

    return { success: true };
  }
}
