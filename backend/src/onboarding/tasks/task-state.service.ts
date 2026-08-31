import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type EffectiveTaskStatus = 'WAITING' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface TaskWithEffectiveState {
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
  status: string; // raw DB status — kept for internal/audit use
  effective_status: EffectiveTaskStatus; // what the UI/API should actually show
  reading_total_active_seconds?: number;
  reading_last_heartbeat_at?: string | null;
  reading_status?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface RawTaskRow {
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
  reading_total_active_seconds: number;
  reading_last_heartbeat_at: string | null;
  reading_status: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class TaskStateService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * The single source of truth for what state a task "looks like" to any
   * caller. Never compute or display task status any other way.
   *
   * Rule: if a task has a dependency and that dependency isn't COMPLETED,
   * the task is effectively WAITING — regardless of what its own raw
   * `status` column says. This is computed on every read, never stored,
   * so the database, the API, and the UI can never disagree.
   */
  private computeEffectiveState(
    task: RawTaskRow,
    dependencyStatus: string | null,
  ): EffectiveTaskStatus {
    if (task.depends_on_task_id && dependencyStatus !== 'COMPLETED') {
      return 'WAITING';
    }
    // No dependency, or dependency is COMPLETED — the task's own raw status
    // is the truth. PENDING at this point means "ready to be picked up",
    // which is what AVAILABLE communicates to the UI.
    if (task.status === 'PENDING') {
      return 'AVAILABLE';
    }
    return task.status as EffectiveTaskStatus;
  }

  /**
   * Attaches effective_status to a single task. Fetches the dependency's
   * status if one exists.
   */
  async attachEffectiveState(task: RawTaskRow): Promise<TaskWithEffectiveState> {
    let dependencyStatus: string | null = null;

    if (task.depends_on_task_id) {
      const { rows } = await this.db.query<{ status: string }>(
        'SELECT status FROM tasks WHERE id = $1',
        [task.depends_on_task_id],
      );
      dependencyStatus = rows[0]?.status ?? null;
    }

    return {
      ...task,
      effective_status: this.computeEffectiveState(task, dependencyStatus),
    };
  }

  /**
   * Batch version — for a whole instance's task list, resolves dependencies
   * from the already-fetched set instead of querying per task, since all
   * dependencies within one onboarding instance are already in the list.
   */
  async attachEffectiveStateBatch(tasks: RawTaskRow[]): Promise<TaskWithEffectiveState[]> {
    const statusById = new Map(tasks.map((t) => [t.id, t.status]));

    return tasks.map((task) => {
      const dependencyStatus = task.depends_on_task_id
        ? statusById.get(task.depends_on_task_id) ?? null
        : null;

      return {
        ...task,
        effective_status: this.computeEffectiveState(task, dependencyStatus),
      };
    });
  }
}