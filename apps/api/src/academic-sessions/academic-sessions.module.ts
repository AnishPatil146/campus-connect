import { Module } from '@nestjs/common';
import { AcademicSessionsService } from './academic-sessions.service';
import { AcademicSessionsController } from './academic-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AcademicSessionsController],
  providers: [AcademicSessionsService],
  exports: [AcademicSessionsService],
})
export class AcademicSessionsModule {}
