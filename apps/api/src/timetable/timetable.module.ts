import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { StudentTimetableController } from './student-timetable.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, EventsModule],
  controllers: [TimetableController, StudentTimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}

