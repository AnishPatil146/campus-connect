import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { TeacherNotesController } from './teacher-notes.controller';
import { StudentNotesController } from './student-notes.controller';
import { NotesService } from './notes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, AuditModule, EventsModule],
  controllers: [NotesController, TeacherNotesController, StudentNotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
