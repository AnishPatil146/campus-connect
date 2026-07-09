import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@ApiTags('Students Management')
@Controller('api/v1/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(
    private studentsService: StudentsService,
    private auditService: AuditService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Retrieve list of all students with filtering' })
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('courseId') courseId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user;
    
    // Restrict College Admin to their own college
    const scopedCollegeId = user.role === Role.ADMIN ? user.collegeId : collegeId;

    const data = await this.studentsService.findAll(scopedCollegeId, {
      search,
      departmentId,
      courseId,
      semesterId,
      divisionId,
      status,
    });

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Viewed Students Directory',
      `User ${user.email} queried students directory. Status filter: ${status || 'active'}`,
    );

    return {
      message: 'Students retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Retrieve specific student details' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const user = req.user;
    const scopedCollegeId = user.role === Role.ADMIN ? user.collegeId : undefined;

    const data = await this.studentsService.findOne(id, scopedCollegeId);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Viewed Student Details',
      `User ${user.email} viewed details of student ${(data as any).user.email}`,
    );

    return {
      message: 'Student retrieved successfully',
      data,
    };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new student profile' })
  async create(@Req() req: any, @Body() createDto: CreateStudentDto) {
    const user = req.user;
    
    // Restrict College Admin to creating students only in their own college
    const scopedCollegeId = user.role === Role.ADMIN ? user.collegeId : null;

    const data = await this.studentsService.create(createDto, scopedCollegeId, user.id, user.name, user.role);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Created Student',
      `User ${user.email} created student profile for ${(data as any).user.email} (Roll: ${data.rollNumber || 'N/A'})`,
    );

    return {
      message: 'Student created successfully',
      data,
    };
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update student profile details' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentDto,
  ) {
    const user = req.user;
    const scopedCollegeId = user.role === Role.ADMIN ? user.collegeId : undefined;

    const data = await this.studentsService.update(id, updateDto, scopedCollegeId);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Updated Student',
      `User ${user.email} updated student profile for ${(data as any).user.email}`,
    );

    return {
      message: 'Student updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete a student profile' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const user = req.user;
    const scopedCollegeId = user.role === Role.ADMIN ? user.collegeId : undefined;

    const data = await this.studentsService.softDelete(id, scopedCollegeId);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Soft-Deleted Student',
      `User ${user.email} soft-deleted student profile (ID: ${id})`,
    );

    return {
      message: 'Student soft-deleted successfully',
      data,
    };
  }

  @Post(':id/reset-password')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reset student password (optionally to a custom one)' })
  async resetPassword(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body?: { password?: string }
  ) {
    const user = req.user;
    const scopedCollegeId = user.role === Role.ADMIN ? user.collegeId : undefined;

    const data = await this.studentsService.resetPassword(id, scopedCollegeId, body?.password);

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Reset Student Password',
      `User ${user.email} reset password for student (ID: ${id})`,
    );

    return {
      message: 'Student password reset successfully',
      data,
    };
  }

  @Post('promote')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Promote multiple students to a new division' })
  async promote(
    @Req() req: any,
    @Body() body: { studentIds: string[]; targetDivisionId: string },
  ) {
    const user = req.user;
    const data = await this.studentsService.promote(
      body.studentIds,
      body.targetDivisionId,
      user.id,
      user.name,
      user.role,
    );

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Promoted Students',
      `User ${user.email} promoted ${body.studentIds.length} students to division ID ${body.targetDivisionId}`,
    );

    return {
      message: 'Students promoted successfully',
      data,
    };
  }
}
