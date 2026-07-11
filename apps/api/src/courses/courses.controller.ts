import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Permissions('courses.create')
  @ApiOperation({ summary: 'Create a new course' })
  async create(@Body() dto: CreateCourseDto, @Req() req: any) {
    const data = await this.coursesService.create(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Course created successfully', data };
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('courses.read')
  @ApiOperation({ summary: 'Get all courses' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.coursesService.findAll(pagination);
    return { message: 'Courses retrieved successfully', data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('courses.read')
  @ApiOperation({ summary: 'Get course details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.coursesService.findOne(id);
    return { message: 'Course retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('courses.update')
  @ApiOperation({ summary: 'Update course details' })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Req() req: any) {
    const data = await this.coursesService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Course updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('courses.delete')
  @ApiOperation({ summary: 'Soft delete a course' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.coursesService.remove(id, req.user.id, req.user.name, req.user.role);
    return { message: result.message, data: null };
  }
}

