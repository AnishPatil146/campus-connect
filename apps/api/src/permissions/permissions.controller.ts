import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Permissions')
@Controller('api/v1/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get all permissions grouped by module' })
  async findAll() {
    const data = await this.permissionsService.findAll();
    return { message: 'Permissions retrieved successfully', data };
  }

  @Get('module/:module')
  @Roles(Role.ADMIN)
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get permissions for a specific module' })
  async findByModule(@Param('module') module: string) {
    const data = await this.permissionsService.findByModule(module);
    return { message: `Permissions for module ${module} retrieved successfully`, data };
  }

  @Post('check')
  @Roles(Role.ADMIN)
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Check if a user has specific permissions' })
  async checkUserPermissions(@Body() body: { userId: string; permissions: string[] }) {
    const data = await this.permissionsService.checkUserPermissions(body.userId, body.permissions);
    return { message: 'Permission check completed', data };
  }
}
