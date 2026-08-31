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

export interface PrivateNote {
  id: string;
  employee_id: string;
  title: string | null;
  content_json: Record<string, unknown>;
  content_html_sanitized: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_WAITING'
  | 'ONBOARDING_STARTED'
  | 'ONBOARDING_COMPLETED';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export type ResourceCategory = 'POLICY' | 'HANDBOOK' | 'PLAYBOOK' | 'LEARNING';

export interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  category: ResourceCategory;
  file_url: string;
  department_id: string | null;
  is_downloadable: boolean;
  is_active: boolean;
}

export type EntitlementCategory = 'INSURANCE' | 'DEVICE' | 'PERK' | 'OTHER';

export interface Entitlement {
  id: string;
  name: string;
  description: string | null;
  category: EntitlementCategory;
  is_active: boolean;
}