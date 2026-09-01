import { TaskStateService } from './task-state.service';

describe('TaskStateService', () => {
  it('keeps a completed task marked as completed even if its dependency is still pending', () => {
    const service = new TaskStateService({} as any);

    const task = {
      id: 'task-1',
      depends_on_task_id: 'dep-1',
      status: 'COMPLETED',
    } as any;

    expect((service as any).computeEffectiveState(task, 'PENDING')).toBe('COMPLETED');
  });

  it('marks an incomplete task as waiting when its dependency is still pending', () => {
    const service = new TaskStateService({} as any);

    const task = {
      id: 'task-2',
      depends_on_task_id: 'dep-2',
      status: 'PENDING',
    } as any;

    expect((service as any).computeEffectiveState(task, 'PENDING')).toBe('WAITING');
  });
});
