import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DepartmentRow {
  id: string;
  name: string;
  code: string;
}

@Injectable()
export class DepartmentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<DepartmentRow[]> {
    const { rows } = await this.db.query<DepartmentRow>(
      'SELECT id, name, code FROM departments WHERE is_active = true ORDER BY name',
    );
    return rows;
  }

  /**
   * Resolves a department by UUID (preferred, sent by the frontend dropdown)
   * or by name/code (fallback, for API testing convenience via Postman/curl).
   */
  async resolveDepartmentId(input: {
    department_id?: string;
    department_name?: string;
    department_code?: string;
  }): Promise<string> {
    if (input.department_id) {
      const { rows } = await this.db.query<{ id: string }>(
        'SELECT id FROM departments WHERE id = $1',
        [input.department_id],
      );
      if (rows.length === 0) {
        throw new NotFoundException('Department not found');
      }
      return rows[0].id;
    }

    if (input.department_name || input.department_code) {
      const { rows } = await this.db.query<{ id: string }>(
        'SELECT id FROM departments WHERE name = $1 OR code = $1 LIMIT 1',
        [input.department_name || input.department_code],
      );
      if (rows.length === 0) {
        throw new NotFoundException('Department not found by name/code');
      }
      return rows[0].id;
    }

    throw new NotFoundException(
      'Must provide department_id, department_name, or department_code',
    );
  }
}