import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateEntitlementDto } from './dto/create-entitlement.dto';
import { UpdateEntitlementDto } from './dto/update-entitlement.dto';

export interface EntitlementRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
}

@Injectable()
export class EntitlementsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = false): Promise<EntitlementRow[]> {
    const where = activeOnly ? 'WHERE is_active = true' : '';
    const { rows } = await this.db.query<EntitlementRow>(
      `SELECT * FROM entitlements ${where} ORDER BY category, name`,
    );
    return rows;
  }

  async create(dto: CreateEntitlementDto): Promise<EntitlementRow> {
    const { rows } = await this.db.query<EntitlementRow>(
      `INSERT INTO entitlements (name, description, category, is_active)
       VALUES ($1, $2, $3, COALESCE($4, true))
       RETURNING *`,
      [dto.name, dto.description ?? null, dto.category, dto.is_active ?? null],
    );
    return rows[0];
  }

  async update(id: string, dto: UpdateEntitlementDto): Promise<EntitlementRow> {
    const { rows } = await this.db.query<EntitlementRow>(
      `UPDATE entitlements SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [dto.name ?? null, dto.description ?? null, dto.category ?? null, dto.is_active ?? null, id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Entitlement not found');
    }
    return rows[0];
  }
}
