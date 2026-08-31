import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DepartmentSummaryRow {
  id: string;
  name: string;
  code: string;
  employee_count: number;
}

@Injectable()
export class CompanyService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Live department headcount — the single source this query lives in.
   * Reused as-is by the Company page and by the Day 5 dashboard endpoint,
   * so the count never drifts between the two views.
   */
  async getDepartmentsSummary(): Promise<DepartmentSummaryRow[]> {
    const { rows } = await this.db.query<{ id: string; name: string; code: string; employee_count: string }>(
      `SELECT d.id, d.name, d.code, COUNT(u.id) AS employee_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id AND u.is_active = true
       WHERE d.is_active = true
       GROUP BY d.id, d.name, d.code
       ORDER BY d.name`,
    );
    return rows.map((r) => ({ ...r, employee_count: parseInt(r.employee_count, 10) }));
  }
}
