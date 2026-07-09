import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Departments')
@Controller('api/v1/departments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Permissions('departments.create')
  @ApiOperation({ summary: 'Create a new department' })
  async create(@Body() dto: CreateDepartmentDto, @Req() req: any) {
    const data = await this.departmentsService.create(dto, req.user.collegeId, req.user.id, req.user.name, req.user.role);
    return { message: 'Department created successfully', data };
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('departments.read')
  @ApiOperation({ summary: 'Get all departments' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.departmentsService.findAll(pagination);
    return { message: 'Departments retrieved successfully', data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('departments.read')
  @ApiOperation({ summary: 'Get department details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.departmentsService.findOne(id);
    return { message: 'Department retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('departments.update')
  @ApiOperation({ summary: 'Update department details' })
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req: any) {
    const data = await this.departmentsService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Department updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('departments.delete')
  @ApiOperation({ summary: 'Soft delete a department' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.departmentsService.remove(id, req.user.id, req.user.name, req.user.role);
    return { message: result.message, data: null };
  }
}
