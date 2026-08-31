export type EffectiveStatus = 'WAITING' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface ChecklistTask {
  id: string;
  title: string;
  description: string | null;
  task_type: 'ACTION' | 'READING';
  order_index: number;
  owner_type: 'EMPLOYEE' | 'HR' | 'DEPARTMENT_ADMIN';
  is_required: boolean;
  depends_on_task_id: string | null;
  effective_status: EffectiveStatus;
  reading_total_active_seconds?: number;
  reading_status?: string | null;
}

export interface OnboardingInstance {
  id: string;
  employee_id: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  tasks: ChecklistTask[];
}