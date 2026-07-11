import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateTimetableDto, PublishTimetableDto, SubstituteTeacherDto, UpdateTimetableDto } from './dto/timetable.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Timetable')
@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Permissions('timetable.create')
  @ApiOperation({ summary: 'Create a new timetable' })
  async create(@Body() dto: CreateTimetableDto, @Req() req: any) {
    const data = await this.timetableService.createTimetable(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Timetable created successfully', data };
  }

  @Patch()
  @Roles(Role.ADMIN)
  @Permissions('timetable.update')
  @ApiOperation({ summary: 'Update timetable metadata' })
  async update(@Body() dto: UpdateTimetableDto, @Req() req: any) {
    const data = await this.timetableService.updateTimetable(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Timetable updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('timetable.delete')
  @ApiOperation({ summary: 'Delete a timetable' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const data = await this.timetableService.deleteTimetable(id, req.user.id, req.user.name, req.user.role);
    return { message: 'Timetable deleted successfully', data };
  }

  @Get('student')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @Permissions('timetable.read')
  @ApiOperation({ summary: 'Get the timetable for a student' })
  async getStudent(@Query('studentId') studentId: string) {
    const data = await this.timetableService.getStudentTimetable(studentId);
    return { message: 'Student timetable retrieved successfully', data };
  }

  @Get('teacher')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('timetable.read')
  @ApiOperation({ summary: 'Get the timetable for a teacher' })
  async getTeacher(@Query('teacherId') teacherId: string) {
    const data = await this.timetableService.getTeacherTimetable(teacherId);
    return { message: 'Teacher timetable retrieved successfully', data };
  }

  @Get('class')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('timetable.read')
  @ApiOperation({ summary: 'Get the timetable for a division' })
  async getClass(@Query('divisionId') divisionId: string) {
    const data = await this.timetableService.getClassTimetable(divisionId);
    return { message: 'Class timetable retrieved successfully', data };
  }

  @Post('publish')
  @Roles(Role.ADMIN)
  @Permissions('timetable.publish')
  @ApiOperation({ summary: 'Publish a timetable version' })
  async publish(@Body() dto: PublishTimetableDto, @Req() req: any) {
    const data = await this.timetableService.publishTimetable(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Timetable published successfully', data };
  }

  @Post('substitute')
  @Roles(Role.ADMIN)
  @Permissions('timetable.update')
  @ApiOperation({ summary: 'Assign a substitute teacher' })
  async substitute(@Body() dto: SubstituteTeacherDto, @Req() req: any) {
    const data = await this.timetableService.assignSubstitute(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Substitute teacher assigned successfully', data };
  }

  @Get('history')
  @Roles(Role.ADMIN)
  @Permissions('timetable.read')
  @ApiOperation({ summary: 'Get timetable change history' })
  async history(@Query('timetableId') timetableId: string) {
    const data = await this.timetableService.getHistory(timetableId);
    return { message: 'Timetable history retrieved successfully', data };
  }
}

