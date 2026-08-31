import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/audit.service';

const READING_THRESHOLD_SECONDS = 300; // 5 minutes

export interface ReadingReminderRow {
  id: string;
  title: string;
  reading_total_active_seconds: number;
  reading_status: string | null;
  created_at: string;
  reading_last_heartbeat_at: string | null;
}

export interface TaskRow {
  id: string;
  onboarding_instance_id: string;
  title: string;
  task_type: string;
  owner_id: string;
  status: string;
  version: number;
  is_required: boolean;
  reading_total_active_seconds: number;
  reading_status: string | null;
}

@Injectable()
export class ReadingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async heartbeat(taskId: string, actorId: string, activeSeconds: number) {
    return this.db.serializableTransaction(async (client) => {
      const { rows } = await client.query<TaskRow>(
        'SELECT * FROM tasks WHERE id = $1 FOR UPDATE',
        [taskId],
      );
      const task = rows[0];

      if (!task) {
        throw new NotFoundException('Task not found');
      }
      if (task.task_type !== 'READING') {
        throw new ConflictException('This task is not a reading task');
      }
      if (task.owner_id !== actorId) {
        throw new ForbiddenException('You can only track your own reading progress');
      }
      if (task.reading_status === 'DISCARDED') {
        throw new ConflictException('This reading task was discarded and can no longer be tracked');
      }
      if (task.status === 'COMPLETED') {
        // Already done — heartbeats after completion are a no-op, not an error
        // (the frontend may keep the doc open briefly after threshold fires)
        return this.toProgressResponse(task);
      }

      const newTotal = Math.min(
        task.reading_total_active_seconds + activeSeconds,
        READING_THRESHOLD_SECONDS,
      );
      const thresholdReached = newTotal >= READING_THRESHOLD_SECONDS;

      const { rows: updatedRows } = await client.query<TaskRow>(
        `UPDATE tasks
         SET reading_total_active_seconds = $1,
             reading_last_heartbeat_at = now(),
             reading_status = $2,
             version = version + 1,
             updated_at = now()
         WHERE id = $3 AND version = $4
         RETURNING *`,
        [
          newTotal,
          thresholdReached ? 'COMPLETED' : 'IN_PROGRESS',
          taskId,
          task.version,
        ],
      );

      if (updatedRows.length === 0) {
        throw new ConflictException('Task was modified concurrently. Please retry.');
      }

      let finalTask = updatedRows[0];

      if (thresholdReached) {
        finalTask = await this.completeReadingTask(client, finalTask, actorId);
      }

      return this.toProgressResponse(finalTask);
    });
  }

  private async completeReadingTask(
    client: PoolClient,
    task: TaskRow,
    actorId: string,
  ): Promise<TaskRow> {
    const { rows } = await client.query<TaskRow>(
      `UPDATE tasks SET status = 'COMPLETED', version = version + 1, updated_at = now()
       WHERE id = $1 AND version = $2
       RETURNING *`,
      [task.id, task.version],
    );

    if (rows.length === 0) {
      throw new ConflictException('Task was modified concurrently. Please retry.');
    }

    const updated = rows[0];

    await client.query(
      `INSERT INTO task_status_history (task_id, from_status, to_status, changed_by)
       VALUES ($1, $2, 'COMPLETED', $3)`,
      [task.id, task.status, actorId],
    );

    await this.auditService.log({
      actorId,
      eventType: 'TASK_STATUS_CHANGED',
      targetType: 'task',
      targetId: task.id,
      metadata: { from: task.status, to: 'COMPLETED', reason: 'reading_threshold_reached' },
    });

    await this.checkAndCompleteInstance(client, task.onboarding_instance_id);

    return updated;
  }

  private async checkAndCompleteInstance(client: PoolClient, instanceId: string): Promise<void> {
    const { rows } = await client.query<{ incomplete_required_count: string }>(
      `SELECT COUNT(*) as incomplete_required_count
       FROM tasks
       WHERE onboarding_instance_id = $1 AND is_required = true AND status != 'COMPLETED'`,
      [instanceId],
    );

    if (parseInt(rows[0].incomplete_required_count, 10) === 0) {
      await client.query(
        `UPDATE onboarding_instances
         SET status = 'COMPLETED', completed_at = now(), version = version + 1
         WHERE id = $1 AND status != 'COMPLETED'`,
        [instanceId],
      );
    }
  }

  /**
   * Called when an onboarding is cancelled — discards any still-in-progress
   * reading trackers so they can never be completed later, per your rule
   * that quitting before the threshold means it should NOT count as read.
   */
  async discardIncompleteReadingForInstance(client: PoolClient, instanceId: string): Promise<void> {
    await client.query(
      `UPDATE tasks
       SET reading_status = 'DISCARDED', updated_at = now()
       WHERE onboarding_instance_id = $1
         AND task_type = 'READING'
         AND reading_status = 'IN_PROGRESS'`,
      [instanceId],
    );
  }

  private toProgressResponse(task: TaskRow) {
    return {
      taskId: task.id,
      totalActiveSeconds: task.reading_total_active_seconds,
      remainingSeconds: Math.max(READING_THRESHOLD_SECONDS - task.reading_total_active_seconds, 0),
      thresholdSeconds: READING_THRESHOLD_SECONDS,
      readingStatus: task.reading_status,
      taskStatus: task.status,
    };
  }

  async getProgress(taskId: string, actorId: string) {
    const { rows } = await this.db.query<TaskRow>('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = rows[0];
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.owner_id !== actorId) {
      throw new ForbiddenException('You can only view your own reading progress');
    }
    return this.toProgressResponse(task);
  }

  async getPendingReminders(userId: string): Promise<ReadingReminderRow[]> {
  const { rows } = await this.db.query<ReadingReminderRow>(
    `SELECT id, title, reading_total_active_seconds, reading_status, created_at, reading_last_heartbeat_at
     FROM tasks
     WHERE owner_id = $1
       AND task_type = 'READING'
       AND status != 'COMPLETED'
       AND reading_status IS DISTINCT FROM 'DISCARDED'
       AND (now() - COALESCE(reading_last_heartbeat_at, created_at)) > interval '3 hours'
     ORDER BY created_at ASC`,
    [userId],
  );
  return rows;
}
}