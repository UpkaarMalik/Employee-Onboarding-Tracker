export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'EMPLOYEE';

export type Permission =
  // Onboarding & templates
  | 'onboarding.read'
  | 'onboarding.update'
  | 'onboarding.manage'
  | 'template.manage'
  | 'task.manage'
  | 'task.assign'
  // Employee & HR data
  | 'employee.read'
  | 'employee.update'
  | 'benefits.manage'
  | 'benefits.read'
  // Feedback & reports
  | 'feedback.read'
  | 'feedback.create'
  | 'reports.read'
  // Content management
  | 'content.manage'
  | 'content.read'
  | 'faq.manage'
  | 'faq.read'
  // Community
  | 'poll.manage'
  | 'poll.vote'
  | 'post.moderate'
  | 'post.read'
  // Self-scoped (every role has these regardless of admin permissions)
  | 'own_onboarding.read'
  | 'own_task.complete'
  | 'own_notes.manage'
  // Audit & system
  | 'audit.read'
  | 'audit.read.scoped'
  | 'system.configure';

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  'onboarding.read', 'onboarding.update', 'onboarding.manage',
  'template.manage', 'task.manage', 'task.assign',
  'employee.read', 'employee.update', 'benefits.manage', 'benefits.read',
  'feedback.read', 'feedback.create', 'reports.read',
  'content.manage', 'content.read', 'faq.manage', 'faq.read',
  'poll.manage', 'poll.vote', 'post.moderate', 'post.read',
  'own_onboarding.read', 'own_task.complete', 'own_notes.manage',
  'audit.read', 'audit.read.scoped', 'system.configure',
];

const ADMIN_PERMISSIONS: Permission[] = [
  'onboarding.read', 'onboarding.update',
  'template.manage', 'task.manage', 'task.assign',
  'benefits.manage', 'benefits.read',
  'feedback.read', 'reports.read',
  'content.manage', 'content.read', 'faq.manage', 'faq.read',
  'poll.manage', 'poll.vote', 'post.moderate', 'post.read',
  'own_onboarding.read', 'own_task.complete', 'own_notes.manage', 'feedback.create',
  'audit.read.scoped',
  // Explicitly NOT included: employee.read/update (HR-only sensitive data),
  // audit.read (full log), system.configure
];

const HR_PERMISSIONS: Permission[] = [
  'onboarding.read', 'onboarding.update', 'onboarding.manage',
  'task.manage', 'task.assign', 'template.manage',
  'employee.read', 'employee.update', 'benefits.manage', 'benefits.read',
  'feedback.read', 'feedback.create', 'reports.read',
  'content.manage', 'content.read', 'faq.manage', 'faq.read',
  'post.moderate', 'post.read', 'poll.vote',
  'own_onboarding.read', 'own_task.complete', 'own_notes.manage',
  // Explicitly NOT included: template.manage (unless you want HR to manage
  // templates too — your spec said "if HR is responsible for templates",
  // add 'template.manage' here if so), audit.read, audit.read.scoped, system.configure
];

const EMPLOYEE_PERMISSIONS: Permission[] = [
  'own_onboarding.read', 'own_task.complete', 'own_notes.manage',
  'benefits.read', 'faq.read', 'content.read',
  'feedback.create', 'post.read', 'poll.vote',
];

export const PERMISSION_MAP: Record<Role, Permission[]> = {
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  HR: HR_PERMISSIONS,
  EMPLOYEE: EMPLOYEE_PERMISSIONS,
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return PERMISSION_MAP[role]?.includes(permission) ?? false;
}