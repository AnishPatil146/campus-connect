import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Subjects')
@Controller('api/v1/subjects')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Permissions('subjects.create')
  @ApiOperation({ summary: 'Create a new subject' })
  async create(@Body() dto: CreateSubjectDto, @Req() req: any) {
    const data = await this.subjectsService.create(dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Subject created successfully', data };
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('subjects.read')
  @ApiOperation({ summary: 'Get all subjects' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.subjectsService.findAll(pagination);
    return { message: 'Subjects retrieved successfully', data: result.data, meta: result.meta };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('subjects.read')
  @ApiOperation({ summary: 'Get subject details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.subjectsService.findOne(id);
    return { message: 'Subject retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('subjects.update')
  @ApiOperation({ summary: 'Update subject details' })
  async update(@Param('id') id: string, @Body() dto: UpdateSubjectDto, @Req() req: any) {
    const data = await this.subjectsService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Subject updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('subjects.delete')
  @ApiOperation({ summary: 'Soft delete a subject' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.subjectsService.remove(id, req.user.id, req.user.name, req.user.role);
    return { message: result.message, data: null };
  }
}
