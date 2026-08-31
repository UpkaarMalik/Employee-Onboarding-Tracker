import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateContentGalleryDto } from './dto/create-content-gallery.dto';

export interface ContentGalleryRow {
  id: string;
  type: 'COMPANY_FAMILY' | 'SPORTS';
  title: string | null;
  description: string | null;
  image_url: string;
  uploaded_by: string | null;
  created_at: string;
}

@Injectable()
export class ContentGalleryService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(type?: string): Promise<ContentGalleryRow[]> {
    const where = type ? 'WHERE type = $1' : '';
    const values = type ? [type] : [];
    const { rows } = await this.db.query<ContentGalleryRow>(
      `SELECT * FROM content_gallery ${where} ORDER BY created_at DESC`,
      values,
    );
    return rows;
  }

  async create(dto: CreateContentGalleryDto, uploadedBy: string): Promise<ContentGalleryRow> {
    const { rows } = await this.db.query<ContentGalleryRow>(
      `INSERT INTO content_gallery (type, title, description, image_url, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dto.type, dto.title ?? null, dto.description ?? null, dto.image_url, uploadedBy],
    );
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const { rowCount } = await this.db.query('DELETE FROM content_gallery WHERE id = $1', [id]);
    if (rowCount === 0) {
      throw new NotFoundException('Content gallery item not found');
    }
  }
}
