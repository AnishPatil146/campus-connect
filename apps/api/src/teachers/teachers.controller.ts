import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, AssignSubjectsDto } from './dto/teacher.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Teachers')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Permissions('teachers.create')
  @ApiOperation({ summary: 'Admit/Create a new teacher profile' })
  async create(@Body() dto: CreateTeacherDto, @Req() req: any) {
    const data = await this.teachersService.create(dto, req.user.collegeId, req.user.id, req.user.name, req.user.role);
    return { message: 'Teacher admitted successfully', data };
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('teachers.read')
  @ApiOperation({ summary: 'Get all teachers' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.teachersService.findAll(pagination);
    return { message: 'Teachers retrieved successfully', data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('teachers.read')
  @ApiOperation({ summary: 'Get teacher details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.teachersService.findOne(id);
    return { message: 'Teacher details retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('teachers.update')
  @ApiOperation({ summary: 'Update teacher qualifications or designation' })
  async update(@Param('id') id: string, @Body() dto: UpdateTeacherDto, @Req() req: any) {
    const data = await this.teachersService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Teacher updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('teachers.delete')
  @ApiOperation({ summary: 'Soft delete/Terminate teacher profile' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.teachersService.remove(id, req.user.id, req.user.name, req.user.role);
    return { message: result.message, data: null };
  }

  @Post(':id/subjects')
  @Roles(Role.ADMIN)
  @Permissions('teachers.update')
  @ApiOperation({ summary: 'Assign subjects taught by the teacher' })
  async assignSubjects(@Param('id') id: string, @Body() dto: AssignSubjectsDto, @Req() req: any) {
    const data = await this.teachersService.assignSubjects(id, dto.assignments, req.user.id, req.user.name, req.user.role);
    return { message: 'Teacher subjects assigned successfully', data };
  }

  @Post(':id/leaves')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Request leave for the teacher' })
  async requestLeave(
    @Param('id') id: string,
    @Body() body: { leaveType: string; reason: string; startDate: string; endDate: string },
  ) {
    const data = await this.teachersService.requestLeave(id, body.leaveType, body.reason, body.startDate, body.endDate);
    return { message: 'Leave application submitted successfully', data };
  }

  @Post('leaves/:leaveId/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve teacher leave' })
  async approveLeave(@Param('leaveId') leaveId: string, @Req() req: any) {
    const data = await this.teachersService.approveLeave(leaveId, req.user.id, req.user.name, req.user.role);
    return { message: 'Leave application approved successfully', data };
  }
}

