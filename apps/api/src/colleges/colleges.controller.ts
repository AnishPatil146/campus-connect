import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollegesService } from './colleges.service';
import { CreateCollegeDto, UpdateCollegeDto, UpdateCollegeSettingsDto } from './dto/college.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Colleges')
@Controller('colleges')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class CollegesController {
  constructor(private collegesService: CollegesService) {}

  @Get()
  @Roles(Role.ADMIN)
  @Permissions('colleges.read')
  @ApiOperation({ summary: 'Retrieve list of all colleges' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.collegesService.findAll(pagination);
    return {
      message: 'Colleges retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @Permissions('colleges.read')
  @ApiOperation({ summary: 'Get a single college by ID with full hierarchy' })
  async findOne(@Param('id') id: string) {
    const data = await this.collegesService.findOne(id);
    return {
      message: 'College retrieved successfully',
      data,
    };
  }

  @Post()
  @Roles(Role.ADMIN)
  @Permissions('colleges.create')
  @ApiOperation({ summary: 'Create a new college under an education group' })
  async create(@Body() dto: CreateCollegeDto, @Req() req: any) {
    const data = await this.collegesService.create(dto, req.user.id, req.user.name, req.user.role);
    return {
      message: 'College created successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('colleges.update')
  @ApiOperation({ summary: 'Update a college' })
  async update(@Param('id') id: string, @Body() dto: UpdateCollegeDto, @Req() req: any) {
    const data = await this.collegesService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return {
      message: 'College updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Permissions('colleges.delete')
  @ApiOperation({ summary: 'Soft delete a college' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.collegesService.remove(id, req.user.id, req.user.name, req.user.role);
    return {
      message: result.message,
      data: null,
    };
  }

  @Get(':id/settings')
  @Roles(Role.ADMIN)
  @Permissions('colleges.read')
  @ApiOperation({ summary: 'Get college settings/branding' })
  async getSettings(@Param('id') id: string) {
    const data = await this.collegesService.getSettings(id);
    return {
      message: 'College settings retrieved successfully',
      data,
    };
  }

  @Put(':id/settings')
  @Roles(Role.ADMIN)
  @Permissions('colleges.update')
  @ApiOperation({ summary: 'Update college settings/branding' })
  async updateSettings(@Param('id') id: string, @Body() dto: UpdateCollegeSettingsDto, @Req() req: any) {
    const data = await this.collegesService.updateSettings(id, dto, req.user.id, req.user.name, req.user.role);
    return {
      message: 'College settings updated successfully',
      data,
    };
  }

  @Get(':id/statistics')
  @Roles(Role.ADMIN)
  @Permissions('colleges.read')
  @ApiOperation({ summary: 'Get college statistics dashboard widget' })
  async getStatistics(@Param('id') id: string) {
    const data = await this.collegesService.getStatistics(id);
    return {
      message: 'College statistics retrieved successfully',
      data,
    };
  }
}

