import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTemplateDto } from './dto/create-template.dto';

export interface TemplateRow {
  id: string;
  department_id: string;
  name: string;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface TemplateTaskRow {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  task_type: string;
  order_index: number;
  owner_type: string;
  is_required: boolean;
  depends_on_order_index: number | null;
  resource_id: string | null;
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateTemplateDto, createdBy: string): Promise<TemplateRow & { tasks: TemplateTaskRow[] }> {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      // Determine next version for this department (append-only versioning)
      const { rows: versionRows } = await client.query<{ max_version: number | null }>(
        'SELECT MAX(version) as max_version FROM onboarding_templates WHERE department_id = $1',
        [dto.department_id],
      );
      const nextVersion = (versionRows[0].max_version ?? 0) + 1;

      // Deactivate the previous active version for this department, if any
      await client.query(
        'UPDATE onboarding_templates SET is_active = false WHERE department_id = $1 AND is_active = true',
        [dto.department_id],
      );

      const { rows: templateRows } = await client.query<TemplateRow>(
        `INSERT INTO onboarding_templates (department_id, name, version, is_active, created_by)
         VALUES ($1, $2, $3, true, $4)
         RETURNING *`,
        [dto.department_id, dto.name, nextVersion, createdBy],
      );
      const template = templateRows[0];

      const insertedTasks: TemplateTaskRow[] = [];
      for (const task of dto.tasks) {
        const { rows: taskRows } = await client.query<TemplateTaskRow>(
          `INSERT INTO template_tasks
            (template_id, title, description, task_type, order_index, owner_type,
             is_required, depends_on_order_index, resource_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            template.id,
            task.title,
            task.description ?? null,
            task.task_type,
            task.order_index,
            task.owner_type,
            task.is_required ?? true,
            task.depends_on_order_index ?? null,
            task.resource_id ?? null,
          ],
        );
        insertedTasks.push(taskRows[0]);
      }

      await client.query('COMMIT');

      await this.auditService.log({
        actorId: createdBy,
        eventType: 'TEMPLATE_UPDATED',
        targetType: 'onboarding_template',
        targetId: template.id,
        metadata: { departmentId: dto.department_id, version: nextVersion, taskCount: insertedTasks.length },
      });

      return { ...template, tasks: insertedTasks };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findActiveByDepartment(departmentId: string): Promise<(TemplateRow & { tasks: TemplateTaskRow[] }) | null> {
    const { rows: templateRows } = await this.db.query<TemplateRow>(
      'SELECT * FROM onboarding_templates WHERE department_id = $1 AND is_active = true LIMIT 1',
      [departmentId],
    );
    if (templateRows.length === 0) return null;

    const template = templateRows[0];
    const { rows: taskRows } = await this.db.query<TemplateTaskRow>(
      'SELECT * FROM template_tasks WHERE template_id = $1 ORDER BY order_index',
      [template.id],
    );

    return { ...template, tasks: taskRows };
  }

  async findAll(): Promise<TemplateRow[]> {
    const { rows } = await this.db.query<TemplateRow>(
      'SELECT * FROM onboarding_templates ORDER BY department_id, version DESC',
    );
    return rows;
  }

  async findById(id: string): Promise<TemplateRow & { tasks: TemplateTaskRow[] }> {
    const { rows: templateRows } = await this.db.query<TemplateRow>(
      'SELECT * FROM onboarding_templates WHERE id = $1',
      [id],
    );
    if (templateRows.length === 0) {
      throw new NotFoundException('Template not found');
    }
    const { rows: taskRows } = await this.db.query<TemplateTaskRow>(
      'SELECT * FROM template_tasks WHERE template_id = $1 ORDER BY order_index',
      [id],
    );
    return { ...templateRows[0], tasks: taskRows };
  }

  
}