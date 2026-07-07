import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CollegesModule } from './colleges/colleges.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { ImportsModule } from './imports/imports.module';
import { TasksModule } from './tasks/tasks.module';
import { CollegeMiddleware } from './common/college.middleware';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    CollegesModule,
    UsersModule,
    StudentsModule,
    ImportsModule,
    TasksModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CollegeMiddleware)
      .forRoutes('*');
  }
}
