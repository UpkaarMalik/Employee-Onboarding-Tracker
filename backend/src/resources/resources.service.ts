import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

export interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  department_id: string | null;
  is_downloadable: boolean;
  is_active: boolean;
}

@Injectable()
export class ResourcesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(category?: string): Promise<ResourceRow[]> {
    const conditions = ['is_active = true'];
    const values: unknown[] = [];
    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }
    const { rows } = await this.db.query<ResourceRow>(
      `SELECT * FROM resources WHERE ${conditions.join(' AND ')} ORDER BY category, title`,
      values,
    );
    return rows;
  }

  async findOne(id: string): Promise<ResourceRow> {
    const { rows } = await this.db.query<ResourceRow>(
      'SELECT * FROM resources WHERE id = $1',
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Resource not found');
    }
    return rows[0];
  }

  async create(dto: CreateResourceDto): Promise<ResourceRow> {
    const { rows } = await this.db.query<ResourceRow>(
      `INSERT INTO resources (title, description, category, file_url, department_id, is_downloadable)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, false))
       RETURNING *`,
      [
        dto.title,
        dto.description ?? null,
        dto.category,
        dto.file_url,
        dto.department_id ?? null,
        dto.is_downloadable ?? null,
      ],
    );
    return rows[0];
  }

  async update(id: string, dto: UpdateResourceDto): Promise<ResourceRow> {
    const { rows } = await this.db.query<ResourceRow>(
      `UPDATE resources SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         file_url = COALESCE($4, file_url),
         department_id = COALESCE($5, department_id),
         is_downloadable = COALESCE($6, is_downloadable),
         is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [
        dto.title ?? null,
        dto.description ?? null,
        dto.category ?? null,
        dto.file_url ?? null,
        dto.department_id ?? null,
        dto.is_downloadable ?? null,
        dto.is_active ?? null,
        id,
      ],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Resource not found');
    }
    return rows[0];
  }
}
