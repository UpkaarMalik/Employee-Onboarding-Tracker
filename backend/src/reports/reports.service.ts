import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const OVERDUE_THRESHOLD_DAYS = 7;

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async getOnboardingFunnel() {
    const { rows } = await this.db.query<{ status: string; count: string }>(
      'SELECT status, COUNT(*) as count FROM onboarding_instances GROUP BY status',
    );

    const { rows: avgRows } = await this.db.query<{ avg_days: string | null }>(
      `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 86400) as avg_days
       FROM onboarding_instances WHERE status = 'COMPLETED'`,
    );

    return {
      funnel: rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) })),
      averageCompletionDays: avgRows[0]?.avg_days ? parseFloat(avgRows[0].avg_days) : null,
    };
  }

  /**
   * "Overdue" — no due-date concept exists on tasks in this schema, so this
   * uses a documented heuristic: any required, non-completed task whose
   * onboarding instance started more than OVERDUE_THRESHOLD_DAYS ago.
   */
  async getTaskOverdue() {
    const { rows } = await this.db.query<{
      id: string;
      title: string;
      employee_name: string;
      owner_name: string;
      started_at: string;
      days_open: string;
    }>(
      `SELECT t.id, t.title, u.full_name AS employee_name, owner.full_name AS owner_name,
              oi.started_at, EXTRACT(EPOCH FROM (now() - oi.started_at)) / 86400 AS days_open
       FROM tasks t
       JOIN onboarding_instances oi ON oi.id = t.onboarding_instance_id
       JOIN users u ON u.id = oi.employee_id
       LEFT JOIN users owner ON owner.id = t.owner_id
       WHERE t.is_required = true
         AND t.status != 'COMPLETED'
         AND oi.status = 'IN_PROGRESS'
         AND oi.started_at < now() - INTERVAL '${OVERDUE_THRESHOLD_DAYS} days'
       ORDER BY oi.started_at ASC`,
    );

    return {
      thresholdDays: OVERDUE_THRESHOLD_DAYS,
      count: rows.length,
      items: rows.map((r) => ({ ...r, days_open: Math.round(parseFloat(r.days_open)) })),
    };
  }

  /**
   * Onboardings started per day per department within [from, to] — powers
   * the Reports "Trends" chart (range presets, bar/line/pie, per-department
   * toggle + color). departmentIds, when provided, restricts the result to
   * just those departments; otherwise every department is included.
   */
  async getOnboardingTrend(from: string, to: string, departmentIds?: string[]) {
    const params: unknown[] = [from, to];
    let departmentFilter = '';
    if (departmentIds && departmentIds.length > 0) {
      params.push(departmentIds);
      departmentFilter = `AND u.department_id = ANY($${params.length})`;
    }

    const { rows } = await this.db.query<{ day: string; department_id: string; department_name: string; count: string }>(
      `SELECT date_trunc('day', oi.started_at)::date AS day,
              d.id AS department_id, d.name AS department_name,
              COUNT(*) AS count
       FROM onboarding_instances oi
       JOIN users u ON u.id = oi.employee_id
       JOIN departments d ON d.id = u.department_id
       WHERE oi.started_at >= $1 AND oi.started_at < ($2::date + INTERVAL '1 day')
         ${departmentFilter}
       GROUP BY day, d.id, d.name
       ORDER BY day ASC`,
      params,
    );

    const { rows: allDepartments } = await this.db.query<{ id: string; name: string }>(
      'SELECT id, name FROM departments WHERE is_active = true ORDER BY name',
    );

    return {
      from,
      to,
      departments: allDepartments,
      points: rows.map((r) => ({
        day: r.day,
        department_id: r.department_id,
        department_name: r.department_name,
        count: parseInt(r.count, 10),
      })),
    };
  }

  async getFeedbackSummary() {
    const { rows } = await this.db.query<{ feedback_rating: number }>(
      `SELECT feedback_rating FROM onboarding_instances WHERE feedback_submitted_at IS NOT NULL`,
    );

    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: rows.filter((r) => r.feedback_rating === rating).length,
    }));

    const average = rows.length > 0
      ? rows.reduce((sum, r) => sum + r.feedback_rating, 0) / rows.length
      : null;

    return { count: rows.length, average, distribution };
  }
}
