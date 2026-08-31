import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { DatabaseService } from '../database/database.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

export interface PrivateNoteRow {
  id: string;
  employee_id: string;
  title: string | null;
  content_json: Record<string, unknown>;
  content_html_sanitized: string;
  created_at: string;
  updated_at: string;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
};

@Injectable()
export class NotesService {
  constructor(private readonly db: DatabaseService) {}

  async create(employeeId: string, dto: CreateNoteDto): Promise<PrivateNoteRow> {
    const sanitized = sanitizeHtml(dto.content_html, SANITIZE_OPTIONS);

    const { rows } = await this.db.query<PrivateNoteRow>(
      `INSERT INTO private_notes (employee_id, title, content_json, content_html_sanitized)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [employeeId, dto.title ?? null, JSON.stringify(dto.content_json), sanitized],
    );
    return rows[0];
  }

  async findAllForEmployee(employeeId: string): Promise<PrivateNoteRow[]> {
    const { rows } = await this.db.query<PrivateNoteRow>(
      'SELECT * FROM private_notes WHERE employee_id = $1 ORDER BY updated_at DESC',
      [employeeId],
    );
    return rows;
  }

  private async fetchOwned(noteId: string, employeeId: string): Promise<PrivateNoteRow> {
    const { rows } = await this.db.query<PrivateNoteRow>(
      'SELECT * FROM private_notes WHERE id = $1',
      [noteId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Note not found');
    }
    if (rows[0].employee_id !== employeeId) {
      throw new ForbiddenException('You do not have access to this note');
    }
    return rows[0];
  }

  async findOneOwned(noteId: string, employeeId: string): Promise<PrivateNoteRow> {
    return this.fetchOwned(noteId, employeeId);
  }

  async update(noteId: string, employeeId: string, dto: UpdateNoteDto): Promise<PrivateNoteRow> {
    await this.fetchOwned(noteId, employeeId);

    const sanitized = dto.content_html !== undefined
      ? sanitizeHtml(dto.content_html, SANITIZE_OPTIONS)
      : undefined;

    const { rows } = await this.db.query<PrivateNoteRow>(
      `UPDATE private_notes SET
         title = COALESCE($1, title),
         content_json = COALESCE($2, content_json),
         content_html_sanitized = COALESCE($3, content_html_sanitized),
         updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [
        dto.title ?? null,
        dto.content_json ? JSON.stringify(dto.content_json) : null,
        sanitized ?? null,
        noteId,
      ],
    );
    return rows[0];
  }

  async delete(noteId: string, employeeId: string): Promise<void> {
    await this.fetchOwned(noteId, employeeId);
    await this.db.query('DELETE FROM private_notes WHERE id = $1', [noteId]);
  }

  /** Super Admin break-glass read — never used for edit/delete. */
  async findAllForEmployeeAsSuperAdmin(employeeId: string): Promise<PrivateNoteRow[]> {
    return this.findAllForEmployee(employeeId);
  }
}
