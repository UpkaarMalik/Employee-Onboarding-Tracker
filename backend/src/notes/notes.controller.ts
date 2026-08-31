import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { NotesService } from './notes.service';
import { NotesPdfService } from './notes-pdf.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly notesPdfService: NotesPdfService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Permissions('own_notes.manage')
  async create(@Body() dto: CreateNoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.notesService.create(user.userId, dto);
  }

  @Get()
  @Permissions('own_notes.manage')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notesService.findAllForEmployee(user.userId);
  }

  @Patch(':id')
  @Permissions('own_notes.manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notesService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @Permissions('own_notes.manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.notesService.delete(id, user.userId);
    return { success: true };
  }

  @Get(':id/export.pdf')
  @Permissions('own_notes.manage')
  async exportPdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const note = await this.notesService.findOneOwned(id, user.userId);
    const buffer = await this.notesPdfService.renderToBuffer(note);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(note.title || 'note').replace(/[^a-z0-9-_ ]/gi, '')}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('employee/:employeeId')
  @Roles('SUPER_ADMIN')
  async findAllForEmployeeAsSuperAdmin(
    @Param('employeeId') employeeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const notes = await this.notesService.findAllForEmployeeAsSuperAdmin(employeeId);

    await this.auditService.log({
      actorId: actor.userId,
      eventType: 'PRIVATE_NOTE_ACCESSED_BY_SUPER_ADMIN',
      targetType: 'user',
      targetId: employeeId,
      metadata: { noteCount: notes.length },
    });

    return notes;
  }
}
