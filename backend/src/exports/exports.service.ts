import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { toCsv } from './csv.util';

interface ScopeArgs {
  role: string;
  userId: string;
}

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

@Injectable()
export class ExportsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async exportOnboardings(scope: ScopeArgs): Promise<string> {
    const isStaff = STAFF_ROLES.includes(scope.role);
    const where = isStaff ? '' : 'WHERE oi.employee_id = $1';
    const params = isStaff ? [] : [scope.userId];

    const { rows } = await this.db.query(
      `SELECT oi.id, u.full_name AS employee_name, d.name AS department,
              ot.name AS template_name, oi.status, oi.started_at, oi.completed_at
       FROM onboarding_instances oi
       JOIN users u ON u.id = oi.employee_id
       LEFT JOIN departments d ON d.id = u.department_id
       JOIN onboarding_templates ot ON ot.id = oi.template_id
       ${where}
       ORDER BY oi.created_at DESC`,
      params,
    );

    const csv = toCsv(
      ['id', 'employee_name', 'department', 'template_name', 'status', 'started_at', 'completed_at'],
      rows,
    );

    await this.auditService.log({
      actorId: scope.userId,
      eventType: 'CSV_EXPORTED',
      targetType: 'onboarding_instance',
      metadata: { exportType: 'onboardings', rowCount: rows.length },
    });

    return csv;
  }

  async exportTasks(scope: ScopeArgs): Promise<string> {
    const isStaff = STAFF_ROLES.includes(scope.role);
    const where = isStaff ? '' : 'WHERE oi.employee_id = $1';
    const params = isStaff ? [] : [scope.userId];

    const { rows } = await this.db.query(
      `SELECT t.id, u.full_name AS employee_name, t.title, t.owner_type,
              owner.full_name AS owner_name, t.status, t.is_required, t.order_index
       FROM tasks t
       JOIN onboarding_instances oi ON oi.id = t.onboarding_instance_id
       JOIN users u ON u.id = oi.employee_id
       LEFT JOIN users owner ON owner.id = t.owner_id
       ${where}
       ORDER BY oi.created_at DESC, t.order_index`,
      params,
    );

    const csv = toCsv(
      ['id', 'employee_name', 'title', 'owner_type', 'owner_name', 'status', 'is_required', 'order_index'],
      rows,
    );

    await this.auditService.log({
      actorId: scope.userId,
      eventType: 'CSV_EXPORTED',
      targetType: 'task',
      metadata: { exportType: 'tasks', rowCount: rows.length },
    });

    return csv;
  }

  async exportFeedback(scope: ScopeArgs): Promise<string> {
    const isStaff = STAFF_ROLES.includes(scope.role);
    const where = isStaff
      ? 'WHERE oi.feedback_submitted_at IS NOT NULL'
      : 'WHERE oi.feedback_submitted_at IS NOT NULL AND oi.employee_id = $1';
    const params = isStaff ? [] : [scope.userId];

    const { rows } = await this.db.query(
      `SELECT oi.id AS instance_id, u.full_name AS employee_name,
              oi.feedback_rating, oi.feedback_comments, oi.feedback_submitted_at
       FROM onboarding_instances oi
       JOIN users u ON u.id = oi.employee_id
       ${where}
       ORDER BY oi.feedback_submitted_at DESC`,
      params,
    );

    const csv = toCsv(
      ['instance_id', 'employee_name', 'feedback_rating', 'feedback_comments', 'feedback_submitted_at'],
      rows,
    );

    await this.auditService.log({
      actorId: scope.userId,
      eventType: 'CSV_EXPORTED',
      targetType: 'feedback',
      metadata: { exportType: 'feedback', rowCount: rows.length },
    });

    return csv;
  }
}
