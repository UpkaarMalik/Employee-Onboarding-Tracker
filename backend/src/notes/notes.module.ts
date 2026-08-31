import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesPdfService } from './notes-pdf.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, NotesPdfService],
  exports: [NotesService],
})
export class NotesModule {}
