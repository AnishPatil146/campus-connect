import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CollegesModule } from './colleges/colleges.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { ImportsModule } from './imports/imports.module';
import { TasksModule } from './tasks/tasks.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { EducationGroupsModule } from './education-groups/education-groups.module';
import { CollegeMiddleware } from './common/college.middleware';
import { DepartmentsModule } from './departments/departments.module';
import { CoursesModule } from './courses/courses.module';
import { AcademicSessionsModule } from './academic-sessions/academic-sessions.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from './teachers/teachers.module';
import { EventsModule } from './events/events.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TimetableModule } from './timetable/timetable.module';
import { NotesModule } from './notes/notes.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // Core infrastructure modules
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute per IP
    }]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    RedisModule,
    
    // Application feature modules
    PrismaModule,
    AuditModule,
    AuthModule,
    CollegesModule,
    UsersModule,
    StudentsModule,
    ImportsModule,
    TasksModule,
    AnnouncementsModule,
    RolesModule,
    PermissionsModule,
    EducationGroupsModule,
    DepartmentsModule,
    CoursesModule,
    AcademicSessionsModule,
    SubjectsModule,
    TeachersModule,
    EventsModule,
    AttendanceModule,
    TimetableModule,
    NotesModule,
    AssignmentsModule,
    NotificationsModule,
    DashboardModule,
    ReportsModule,
    FilesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CollegeMiddleware)
      .forRoutes('*');
  }
}
