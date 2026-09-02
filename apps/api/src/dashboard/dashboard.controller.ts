import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/admin')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get college admin dashboard statistics' })
  async getAdminDashboard(@Req() req: any) {
    const data = await this.dashboardService.getAdminDashboard(req.user.collegeId);
    return {
      success: true,
      message: 'Admin dashboard stats retrieved successfully',
      data,
    };
  }

  @Get('teacher/dashboard')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get teacher dashboard statistics' })
  async getTeacherDashboard(@Req() req: any) {
    const data = await this.dashboardService.getTeacherDashboard(req.user.id);
    return {
      success: true,
      message: 'Teacher dashboard stats retrieved successfully',
      data,
    };
  }

  @Get('dashboard/teacher')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alternative route to get teacher dashboard statistics' })
  async getTeacherDashboardAlt(@Req() req: any) {
    const data = await this.dashboardService.getTeacherDashboard(req.user.id);
    return {
      success: true,
      message: 'Teacher dashboard stats retrieved successfully',
      data,
    };
  }

  @Get('student/dashboard')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student dashboard statistics' })
  async getStudentDashboard(@Req() req: any) {
    const data = await this.dashboardService.getStudentDashboard(req.user.id);
    return {
      success: true,
      message: 'Student dashboard stats retrieved successfully',
      data,
    };
  }

  @Get('dashboard/student')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alternative route to get student dashboard statistics' })
  async getStudentDashboardAlt(@Req() req: any) {
    const data = await this.dashboardService.getStudentDashboard(req.user.id);
    return {
      success: true,
      message: 'Student dashboard stats retrieved successfully',
      data,
    };
  }
}
