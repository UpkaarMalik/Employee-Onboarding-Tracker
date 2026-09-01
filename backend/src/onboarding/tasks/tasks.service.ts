import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface TaskRow {
  id: string;
  onboarding_instance_id: string;
  title: string;
  owner_id: string;
  owner_type: string;
  status: string;
  version: number;
  is_required: boolean;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async start(taskId: string, actorId: string, actorRole: string): Promise<TaskRow> {
    return this.db.serializableTransaction(async (client) => {
      const task = await this.lockAndFetchTask(client, taskId);
      await this.assertCanAct(client, task, actorId, actorRole);

      if (task.status !== 'AVAILABLE' && task.status !== 'PENDING') {
        throw new ConflictException(
          `Task cannot be started from its current status: ${task.status}`,
        );
      }

      const updated = await this.transitionStatus(client, task, 'IN_PROGRESS', actorId);
      return updated;
    });
  }

  async complete(
    taskId: string,
    actorId: string,
    actorRole: string,
    officialEmail?: string,
  ): Promise<TaskRow> {
    return this.db.serializableTransaction(async (client) => {
      const task = await this.lockAndFetchTask(client, taskId);
      await this.assertCanAct(client, task, actorId, actorRole);

      if (task.status === 'COMPLETED') {
        throw new ConflictException('Task is already completed');
      }

      // Special case: "Company Email ID Issuance" requires the official
      // email as input alongside the status change, not just a plain flip.
      if (task.title === 'Company Email ID Issuance') {
        if (!officialEmail) {
          throw new BadRequestException(
            'official_email is required to complete this task',
          );
        }

        const { rows: instanceRows } = await client.query<{ employee_id: string }>(
          'SELECT employee_id FROM onboarding_instances WHERE id = $1',
          [task.onboarding_instance_id],
        );
        const employeeId = instanceRows[0].employee_id;

        const { rows: emailTaken } = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [officialEmail],
        );
        if (emailTaken.length > 0) {
          throw new ConflictException('This official email is already in use');
        }

        const { rows: employeeRows } = await client.query<{
          id: string;
          full_name: string;
          personal_email: string;
          email: string | null;
          is_temp_email_active: boolean;
        }>(
          `UPDATE users SET pending_official_email = $1, updated_at = now()
           WHERE id = $2
           RETURNING id, full_name, personal_email, email, is_temp_email_active`,
          [officialEmail, employeeId],
        );
        const employee = employeeRows[0];

        // Fire-and-forget style, but awaited so failures are caught by
        // MailService's own internal try/catch (never blocks this transaction)
        await this.mailService.sendOfficialEmailReady(employee, officialEmail);
      }

      const updated = await this.transitionStatus(client, task, 'COMPLETED', actorId);

      await this.notifyUnblockedDependents(client, task.id);
      await this.checkAndCompleteInstance(client, task.onboarding_instance_id);

      return updated;
    });
  }

  /**
   * Any task whose single linear dependency was this one just became
   * AVAILABLE (effective state, computed — not stored). Notify its owner.
   */
  private async notifyUnblockedDependents(client: PoolClient, completedTaskId: string): Promise<void> {
    const { rows: dependents } = await client.query<{ id: string; title: string; owner_id: string }>(
      `SELECT id, title, owner_id FROM tasks WHERE depends_on_task_id = $1 AND status = 'PENDING'`,
      [completedTaskId],
    );

    for (const dependent of dependents) {
      await this.notificationsService.create({
        userId: dependent.owner_id,
        title: 'A task is now available',
        message: `"${dependent.title}" is now ready for you to start.`,
        type: 'TASK_WAITING',
      });
    }
  }

  /**
   * Row-locks the task (via the version check pattern below) and fetches
   * its current state within the active transaction.
   */
  private async lockAndFetchTask(client: PoolClient, taskId: string): Promise<TaskRow> {
    const { rows } = await client.query<TaskRow>(
      'SELECT * FROM tasks WHERE id = $1 FOR UPDATE',
      [taskId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Task not found');
    }
    return rows[0];
  }

  /**
   * Ownership check: only the resolved owner can start/complete a task,
   * unless the actor is Super Admin, HR, or an Admin for that department.
   * Special case: employees can always complete DEPARTMENT_ADMIN tasks (the
   * admin has done the work, employee just marks it complete).
   */
  private async assertCanAct(
    client: PoolClient,
    task: TaskRow,
    actorId: string,
    actorRole: string,
  ): Promise<void> {
    const isOwner = task.owner_id === actorId;
    if (isOwner) {
      return;
    }

    if (actorRole === 'SUPER_ADMIN') {
      return;
    }

    if (actorRole === 'HR') {
      return;
    }

    if (actorRole === 'EMPLOYEE' && task.owner_type === 'DEPARTMENT_ADMIN') {
      return;
    }

    if (actorRole !== 'ADMIN') {
      throw new ConflictException('You are not authorized to act on this task');
    }

    const { rows: actorRows } = await client.query<{ department_id: string | null }>(
      'SELECT department_id FROM users WHERE id = $1',
      [actorId],
    );
    const actorDepartmentId = actorRows[0]?.department_id ?? null;
    if (!actorDepartmentId) {
      throw new ConflictException('This admin is not assigned to a department');
    }

    const { rows: employeeRows } = await client.query<{ department_id: string | null }>(
      `SELECT u.department_id
       FROM onboarding_instances oi
       JOIN users u ON u.id = oi.employee_id
       WHERE oi.id = $1`,
      [task.onboarding_instance_id],
    );
    const employeeDepartmentId = employeeRows[0]?.department_id ?? null;

    if (employeeDepartmentId !== actorDepartmentId) {
      throw new ConflictException('You can only act on tasks for employees in your department');
    }
  }

  private async transitionStatus(
    client: PoolClient,
    task: TaskRow,
    toStatus: string,
    actorId: string,
  ): Promise<TaskRow> {
    const { rows } = await client.query<TaskRow>(
      `UPDATE tasks SET status = $1, version = version + 1, updated_at = now()
       WHERE id = $2 AND version = $3
       RETURNING *`,
      [toStatus, task.id, task.version],
    );

    if (rows.length === 0) {
      // Someone else modified this task between our SELECT FOR UPDATE and
      // this UPDATE — optimistic lock caught a conflict despite the row lock.
      // In practice, FOR UPDATE should prevent this within SERIALIZABLE, but
      // this check remains as defense in depth.
      throw new ConflictException('Task was modified by someone else. Please retry.');
    }

    const updated = rows[0];

    await client.query(
      `INSERT INTO task_status_history (task_id, from_status, to_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [task.id, task.status, toStatus, actorId],
    );

    await this.auditService.log({
      actorId,
      eventType: 'TASK_STATUS_CHANGED',
      targetType: 'task',
      targetId: task.id,
      metadata: { from: task.status, to: toStatus },
    });

    return updated;
  }

  /**
   * If every is_required task in this instance is now COMPLETED, mark the
   * instance itself COMPLETED. Runs inside the same transaction as the
   * triggering task completion, so it's atomic with it.
   */
  private async checkAndCompleteInstance(client: PoolClient, instanceId: string): Promise<void> {
    const { rows } = await client.query<{ incomplete_required_count: string }>(
      `SELECT COUNT(*) as incomplete_required_count
       FROM tasks
       WHERE onboarding_instance_id = $1 AND is_required = true AND status != 'COMPLETED'`,
      [instanceId],
    );

    const incompleteCount = parseInt(rows[0].incomplete_required_count, 10);

    if (incompleteCount === 0) {
      const { rows: completedRows } = await client.query<{ employee_id: string }>(
        `UPDATE onboarding_instances
         SET status = 'COMPLETED', completed_at = now(), version = version + 1
         WHERE id = $1 AND status != 'COMPLETED'
         RETURNING employee_id`,
        [instanceId],
      );

      if (completedRows.length > 0) {
        await this.notificationsService.create({
          userId: completedRows[0].employee_id,
          title: 'Onboarding complete',
          message: 'You have completed all required onboarding tasks. Welcome aboard!',
          type: 'ONBOARDING_COMPLETED',
        });
      }
    }
  }

  async getHistory(taskId: string) {
    const { rows } = await this.db.query(
      'SELECT * FROM task_status_history WHERE task_id = $1 ORDER BY changed_at ASC',
      [taskId],
    );
    return rows;
  }

  async reassign(
  taskId: string,
  newOwnerId: string,
  actorId: string,
  actorRole: string,
): Promise<TaskRow> {
  return this.db.serializableTransaction(async (client) => {
    const task = await this.lockAndFetchTask(client, taskId);

    if (task.status === 'COMPLETED') {
      throw new ConflictException('Cannot reassign a task that is already completed');
    }

    if (task.owner_id === newOwnerId) {
      throw new ConflictException('Task is already assigned to this user');
    }

    const { rows: newOwnerRows } = await client.query<{ id: string; is_active: boolean }>(
      'SELECT id, is_active FROM users WHERE id = $1',
      [newOwnerId],
    );
    const newOwner = newOwnerRows[0];
    if (!newOwner) {
      throw new NotFoundException('New owner not found');
    }
    if (!newOwner.is_active) {
      throw new ConflictException('Cannot reassign a task to an inactive user');
    }

    const { rows } = await client.query<TaskRow>(
      `UPDATE tasks SET owner_id = $1, version = version + 1, updated_at = now()
       WHERE id = $2 AND version = $3
       RETURNING *`,
      [newOwnerId, task.id, task.version],
    );

    if (rows.length === 0) {
      throw new ConflictException('Task was modified by someone else. Please retry.');
    }

    const updated = rows[0];

    await this.auditService.log({
      actorId,
      eventType: 'TASK_REASSIGNED',
      targetType: 'task',
      targetId: task.id,
      metadata: { fromOwnerId: task.owner_id, toOwnerId: newOwnerId },
    });

    return updated;
  });
}
}
