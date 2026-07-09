import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EducationGroupsService } from './education-groups.service';
import { CreateEducationGroupDto, UpdateEducationGroupDto } from './dto/education-group.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Education Groups')
@Controller('api/v1/education-groups')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class EducationGroupsController {
  constructor(private educationGroupsService: EducationGroupsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @Permissions('education-groups.read')
  @ApiOperation({ summary: 'List all education groups with their colleges' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.educationGroupsService.findAll(pagination);
    return { message: 'Education groups retrieved successfully', data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @Permissions('education-groups.read')
  @ApiOperation({ summary: 'Get a single education group by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.educationGroupsService.findOne(id);
    return { message: 'Education group retrieved successfully', data };
  }

  @Post()
  @Roles(Role.ADMIN)
  @Permissions('education-groups.create')
  @ApiOperation({ summary: 'Create a new education group' })
  async create(@Body() dto: CreateEducationGroupDto, @Req() req: any) {
    const data = await this.educationGroupsService.create(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Education group created successfully', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('education-groups.update')
  @ApiOperation({ summary: 'Update an education group' })
  async update(@Param('id') id: string, @Body() dto: UpdateEducationGroupDto, @Req() req: any) {
    const data = await this.educationGroupsService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Education group updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('education-groups.delete')
  @ApiOperation({ summary: 'Soft delete an education group' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.educationGroupsService.remove(id, req.user.id, req.user.name, req.user.role);
    return { message: result.message, data: null };
  }
}
