import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Student Timetable Dashboard')
@Controller('student/timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentTimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student timetable slots with filtering' })
  async getStudentTimetable(
    @Req() req: any,
    @Query('course') course?: string,
    @Query('division') division?: string,
  ) {
    const data = await this.timetableService.getStudentTimetableByQuery(
      req.user.id,
      course,
      division,
    );
    return { success: true, message: 'Student timetable retrieved successfully', data };
  }
}
