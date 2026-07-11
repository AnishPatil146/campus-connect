import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/admin')
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

  @UseGuards(JwtAuthGuard)
  @Get('teacher/dashboard')
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

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/teacher')
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

  @UseGuards(JwtAuthGuard)
  @Get('student/dashboard')
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

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/student')
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

