import { Controller, Get, Post, Patch, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
  AttendanceCorrectionDto,
  AttendanceReportQueryDto,
  AttendanceRequestDto,
  CreateAttendanceSessionDto,
  MarkAttendanceDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('session')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('attendance.create')
  @ApiOperation({ summary: 'Create a new attendance session' })
  async createSession(@Body() dto: CreateAttendanceSessionDto, @Req() req: any) {
    const data = await this.attendanceService.createSession(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Attendance session created successfully', data };
  }

  @Get('session')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('attendance.read')
  @ApiOperation({ summary: 'Get attendance sessions' })
  async getSessions(@Query() query: { divisionId?: string; teacherId?: string; date?: string }) {
    const data = await this.attendanceService.findSessions(query);
    return { message: 'Attendance sessions retrieved successfully', data };
  }

  @Post('mark')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('attendance.mark')
  @ApiOperation({ summary: 'Mark attendance for students' })
  async mark(@Body() dto: MarkAttendanceDto, @Req() req: any) {
    const data = await this.attendanceService.markAttendance(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Attendance marked successfully', data };
  }

  @Patch('update')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('attendance.update')
  @ApiOperation({ summary: 'Update an attendance record' })
  async update(@Body() dto: UpdateAttendanceDto, @Req() req: any) {
    const data = await this.attendanceService.updateAttendance(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Attendance record updated successfully', data };
  }

  @Get('student')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @Permissions('attendance.read')
  @ApiOperation({ summary: 'Get attendance records for a student' })
  async getStudent(@Query('studentId') studentId: string) {
    const data = await this.attendanceService.getStudentAttendance(studentId);
    return { message: 'Student attendance retrieved successfully', data };
  }

  @Get('class')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('attendance.read')
  @ApiOperation({ summary: 'Get attendance for a class session' })
  async getClass(@Query('attendanceSessionId') attendanceSessionId: string) {
    const data = await this.attendanceService.getClassAttendance(attendanceSessionId);
    return { message: 'Class attendance retrieved successfully', data };
  }

  @Post('request')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @Permissions('attendance.create')
  @ApiOperation({ summary: 'Submit a leave request' })
  async requestLeave(@Body() dto: AttendanceRequestDto, @Req() req: any) {
    const data = await this.attendanceService.requestLeave(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Attendance leave request submitted successfully', data };
  }

  @Post('correction')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @Permissions('attendance.create')
  @ApiOperation({ summary: 'Submit an attendance correction request' })
  async requestCorrection(@Body() dto: AttendanceCorrectionDto, @Req() req: any) {
    const data = await this.attendanceService.requestCorrection(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Attendance correction request submitted successfully', data };
  }

  @Get('report')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('attendance.report')
  @ApiOperation({ summary: 'Get attendance reports' })
  async report(@Query() query: AttendanceReportQueryDto) {
    const data = await this.attendanceService.getReports(query);
    return { message: 'Attendance reports retrieved successfully', data };
  }
}

