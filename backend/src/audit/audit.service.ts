import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type AuditEventType =
  | 'ROLE_CHANGED'
  | 'PRIVATE_NOTE_ACCESSED_BY_SUPER_ADMIN'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_REASSIGNED'
  | 'TEMPLATE_UPDATED'
  | 'EMAIL_TRANSFORMED'
  | 'CSV_EXPORTED';

interface LogAuditEventInput {
  actorId: string;
  eventType: AuditEventType;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Fire-and-forget by design: an audit log failure should never block
   * the actual business action it's recording. Errors are logged, not thrown.
   */
  async log(input: LogAuditEventInput): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO audit_logs (actor_id, event_type, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          input.actorId,
          input.eventType,
          input.targetType ?? null,
          input.targetId ?? null,
          input.metadata ? JSON.stringify(input.metadata) : null,
        ],
      );
    } catch (err) {
      this.logger.error(
        `Failed to write audit log (event: ${input.eventType}): ${(err as Error).message}`,
      );
    }
  }

  async findAll(filters?: { eventType?: AuditEventType; actorId?: string }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters?.eventType) {
      conditions.push(`event_type = $${paramIndex++}`);
      values.push(filters.eventType);
    }
    if (filters?.actorId) {
      conditions.push(`actor_id = $${paramIndex++}`);
      values.push(filters.actorId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await this.db.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT 200`,
      values,
    );
    return rows;
  }
}