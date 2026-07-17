import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { StudentAttendanceController } from './student-attendance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AttendanceController, StudentAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
