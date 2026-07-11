import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateAcademicSessionDto, UpdateAcademicSessionDto, CreateSemesterDto, CreateDivisionDto } from './dto/academic-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Academic Sessions')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class AcademicSessionsController {
  constructor(private sessionsService: AcademicSessionsService) {}

  @Post('academic-sessions')
  @Roles(Role.ADMIN)
  @Permissions('courses.create')
  @ApiOperation({ summary: 'Create a new academic session' })
  async create(@Body() dto: CreateAcademicSessionDto, @Req() req: any) {
    const data = await this.sessionsService.create(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Academic session created successfully', data };
  }

  @Get('academic-sessions')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('courses.read')
  @ApiOperation({ summary: 'Get all academic sessions with semesters' })
  async findAll() {
    const data = await this.sessionsService.findAll();
    return { message: 'Academic sessions retrieved successfully', data };
  }

  @Get('academic-sessions/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('courses.read')
  @ApiOperation({ summary: 'Get a single academic session details' })
  async findOne(@Param('id') id: string) {
    const data = await this.sessionsService.findOne(id);
    return { message: 'Academic session retrieved successfully', data };
  }

  @Patch('academic-sessions/:id')
  @Roles(Role.ADMIN)
  @Permissions('courses.update')
  @ApiOperation({ summary: 'Update academic session details' })
  async update(@Param('id') id: string, @Body() dto: UpdateAcademicSessionDto, @Req() req: any) {
    const data = await this.sessionsService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Academic session updated successfully', data };
  }

  @Delete('academic-sessions/:id')
  @Roles(Role.ADMIN)
  @Permissions('courses.delete')
  @ApiOperation({ summary: 'Soft delete an academic session' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.sessionsService.remove(id, req.user.id, req.user.name, req.user.role);
    return { message: result.message, data: null };
  }

  @Post('academic-sessions/:id/semesters')
  @Roles(Role.ADMIN)
  @Permissions('courses.update')
  @ApiOperation({ summary: 'Add a new semester to an academic session' })
  async addSemester(
    @Param('id') id: string,
    @Body() dto: CreateSemesterDto,
    @Req() req: any,
  ) {
    const data = await this.sessionsService.addSemester(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Semester created successfully', data };
  }

  @Post('semesters/:id/divisions')
  @Roles(Role.ADMIN)
  @Permissions('courses.update')
  @ApiOperation({ summary: 'Add a new division/section to a semester' })
  async addDivision(
    @Param('id') id: string,
    @Body() dto: CreateDivisionDto,
    @Req() req: any,
  ) {
    const data = await this.sessionsService.addDivision(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Division created successfully', data };
  }
}

