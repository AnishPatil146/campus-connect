import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Student Attendance Dashboard')
@Controller('student/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current logged-in student attendance statistics and history' })
  async getDashboardSummary(@Req() req: any) {
    const data = await this.attendanceService.getStudentDashboardSummary(req.user.id);
    return { success: true, message: 'Student attendance summary retrieved successfully', data };
  }
}
