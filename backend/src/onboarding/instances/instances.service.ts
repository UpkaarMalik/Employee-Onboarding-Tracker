import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TemplatesService } from '../templates/templates.service';
import { TaskStateService, TaskWithEffectiveState, RawTaskRow } from '../tasks/task-state.service';
import { resolveOwnerId } from './owner-resolver';
import { NotificationsService } from '../../notifications/notifications.service';

export interface InstanceRow {
  id: string;
  employee_id: string;
  template_id: string;
  template_version: number;
  status: string;
  version: number;
  started_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  onboarding_instance_id: string;
  template_task_id: string | null;
  title: string;
  description: string | null;
  task_type: string;
  order_index: number;
  owner_type: string;
  owner_id: string;
  is_required: boolean;
  depends_on_task_id: string | null;
  status: string;
}

@Injectable()
export class InstancesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly templatesService: TemplatesService,
    private readonly taskStateService: TaskStateService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createForEmployee(employeeId: string, createdByUserId: string): Promise<InstanceRow & { tasks: TaskRow[] }> {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: employeeRows } = await client.query<{ id: string; department_id: string | null }>(
        'SELECT id, department_id FROM users WHERE id = $1',
        [employeeId],
      );
      const employee = employeeRows[0];
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
      if (!employee.department_id) {
        throw new ConflictException('Employee has no department assigned');
      }

      const { rows: existingInstance } = await client.query(
        'SELECT id FROM onboarding_instances WHERE employee_id = $1',
        [employeeId],
      );
      if (existingInstance.length > 0) {
        throw new ConflictException('This employee already has an onboarding instance');
      }

      const template = await this.templatesService.findActiveByDepartment(employee.department_id);
      if (!template) {
        throw new NotFoundException('No active onboarding template found for this department');
      }

      const { rows: instanceRows } = await client.query<InstanceRow>(
        `INSERT INTO onboarding_instances
          (employee_id, template_id, template_version, status, started_at, created_by)
         VALUES ($1, $2, $3, 'IN_PROGRESS', now(), $4)
         RETURNING *`,
        [employeeId, template.id, template.version, createdByUserId],
      );
      const instance = instanceRows[0];

      // Snapshot each template_task into a real task row, resolving owner_type -> owner_id.
      // We keep a map from the template_task's order_index to the newly created task's id,
      // so we can wire up depends_on_task_id (which template_tasks expresses as
      // depends_on_order_index, but tasks expresses as a real FK to another task row).
      const orderIndexToTaskId = new Map<number, string>();
      const insertedTasks: TaskRow[] = [];

      for (const templateTask of template.tasks) {
        const ownerId = await resolveOwnerId(
          client,
          templateTask.owner_type as 'EMPLOYEE' | 'HR' | 'DEPARTMENT_ADMIN',
          employeeId,
          employee.department_id,
          createdByUserId,
        );

        const dependsOnTaskId = templateTask.depends_on_order_index
  ? orderIndexToTaskId.get(templateTask.depends_on_order_index) ?? null
  : null;

const initialStatus = dependsOnTaskId === null ? 'AVAILABLE' : 'PENDING';

const { rows: taskRows } = await client.query<TaskRow>(
  `INSERT INTO tasks
    (onboarding_instance_id, template_task_id, title, description, task_type,
     order_index, owner_type, owner_id, is_required, depends_on_task_id, status)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
   RETURNING *`,
  [
    instance.id,
    templateTask.id,
    templateTask.title,
    templateTask.description,
    templateTask.task_type,
    templateTask.order_index,
    templateTask.owner_type,
    ownerId,
    templateTask.is_required,
    dependsOnTaskId,
    initialStatus,
  ],
);

        const insertedTask = taskRows[0];
        insertedTasks.push(insertedTask);
        orderIndexToTaskId.set(templateTask.order_index, insertedTask.id);

        // Initialize reading_status for READING tasks
        if (templateTask.task_type === 'READING') {
          await client.query(
            `UPDATE tasks SET reading_status = 'IN_PROGRESS' WHERE id = $1`,
            [insertedTask.id],
          );
          insertedTask.status = insertedTask.status; // no-op, just clarity
        }
      }

      await client.query('COMMIT');

      await this.notificationsService.create({
        userId: employeeId,
        title: 'Onboarding started',
        message: 'Your onboarding checklist is ready — take a look at your first tasks.',
        type: 'ONBOARDING_STARTED',
      });

      for (const insertedTask of insertedTasks) {
        await this.notificationsService.create({
          userId: insertedTask.owner_id,
          title: 'New task assigned',
          message: `"${insertedTask.title}" has been added to an onboarding checklist.`,
          type: 'TASK_ASSIGNED',
        });
      }

      return { ...instance, tasks: insertedTasks };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findByEmployeeId(employeeId: string): Promise<(InstanceRow & { tasks: TaskWithEffectiveState[] }) | null> {
  const { rows: instanceRows } = await this.db.query<InstanceRow>(
    'SELECT * FROM onboarding_instances WHERE employee_id = $1',
    [employeeId],
  );
  if (instanceRows.length === 0) return null;

  const instance = instanceRows[0];
  const { rows: taskRows } = await this.db.query<RawTaskRow>(
    'SELECT * FROM tasks WHERE onboarding_instance_id = $1 ORDER BY order_index',
    [instance.id],
  );

  const tasksWithState = await this.taskStateService.attachEffectiveStateBatch(taskRows);

  return { ...instance, tasks: tasksWithState };
}

async findById(id: string): Promise<InstanceRow & { tasks: TaskWithEffectiveState[] }> {
  const { rows: instanceRows } = await this.db.query<InstanceRow>(
    'SELECT * FROM onboarding_instances WHERE id = $1',
    [id],
  );
  if (instanceRows.length === 0) {
    throw new NotFoundException('Onboarding instance not found');
  }
  const { rows: taskRows } = await this.db.query<RawTaskRow>(
    'SELECT * FROM tasks WHERE onboarding_instance_id = $1 ORDER BY order_index',
    [id],
  );

  const tasksWithState = await this.taskStateService.attachEffectiveStateBatch(taskRows);

  return { ...instanceRows[0], tasks: tasksWithState };
}

  async findAll(): Promise<InstanceRow[]> {
    const { rows } = await this.db.query<InstanceRow>(
      'SELECT * FROM onboarding_instances ORDER BY created_at DESC',
    );
    return rows;
  }
  async cancel(instanceId: string): Promise<void> {
  await this.db.serializableTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT status FROM onboarding_instances WHERE id = $1 FOR UPDATE',
      [instanceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Onboarding instance not found');
    }
    if (rows[0].status === 'COMPLETED' || rows[0].status === 'CANCELLED') {
      throw new ConflictException(`Cannot cancel an instance that is already ${rows[0].status}`);
    }

    await client.query(
      `UPDATE onboarding_instances SET status = 'CANCELLED', version = version + 1 WHERE id = $1`,
      [instanceId],
    );

    // Discard any in-progress reading trackers — per your rule, quitting
    // before the 5-minute threshold means it must NOT count as completed.
    await client.query(
      `UPDATE tasks
       SET reading_status = 'DISCARDED', updated_at = now()
       WHERE onboarding_instance_id = $1
         AND task_type = 'READING'
         AND reading_status = 'IN_PROGRESS'`,
      [instanceId],
    );
  });
}
}