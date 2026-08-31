import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_WAITING'
  | 'ONBOARDING_STARTED'
  | 'ONBOARDING_COMPLETED';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

interface CreateNotificationInput {
  userId: string;
  title: string;
  message?: string;
  type: NotificationType;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Single insertion path for all notifications — every module creates
   * notifications through this method so swapping in a queue later (BullMQ)
   * requires no change to any caller.
   */
  async create(input: CreateNotificationInput): Promise<NotificationRow> {
    const { rows } = await this.db.query<NotificationRow>(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.userId, input.title, input.message ?? null, input.type],
    );
    return rows[0];
  }

  async findAllForUser(userId: string): Promise<NotificationRow[]> {
    const { rows } = await this.db.query<NotificationRow>(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [userId],
    );
    return rows;
  }

  async markRead(notificationId: string, userId: string): Promise<NotificationRow> {
    const { rows } = await this.db.query<NotificationRow>(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Notification not found');
    }
    if (rows[0].user_id !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    const { rows: updated } = await this.db.query<NotificationRow>(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [notificationId],
    );
    return updated[0];
  }

  async unreadCount(userId: string): Promise<number> {
    const { rows } = await this.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId],
    );
    return parseInt(rows[0].count, 10);
  }
}
