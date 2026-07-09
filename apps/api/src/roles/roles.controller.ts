import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { UpdateRoleDto, AssignPermissionsDto, AssignRoleToUserDto } from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@ApiTags('Roles & Permissions')
@Controller('api/v1/roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Roles(Role.ADMIN)
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get all roles with permissions' })
  async findAll() {
    const data = await this.rolesService.findAll();
    return { message: 'Roles retrieved successfully', data };
  }

  @Get('matrix')
  @Roles(Role.ADMIN)
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get full permission matrix (roles vs permissions)' })
  async getPermissionMatrix() {
    const data = await this.rolesService.getPermissionMatrix();
    return { message: 'Permission matrix retrieved successfully', data };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get a single role by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.rolesService.findOne(id);
    return { message: 'Role retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Update role description' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: any) {
    const data = await this.rolesService.update(id, dto, req.user.id, req.user.name, req.user.role);
    return { message: 'Role updated successfully', data };
  }

  @Post(':id/permissions')
  @Roles(Role.ADMIN)
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Assign permissions to a role (replaces all existing)' })
  async assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto, @Req() req: any) {
    const data = await this.rolesService.assignPermissions(id, dto.permissionIds, req.user.id, req.user.name, req.user.role);
    return { message: 'Permissions assigned successfully', data };
  }

  @Post(':id/permissions/:permissionId')
  @Roles(Role.ADMIN)
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Add a single permission to a role' })
  async addPermission(@Param('id') id: string, @Param('permissionId') permissionId: string, @Req() req: any) {
    const data = await this.rolesService.addPermission(id, permissionId, req.user.id, req.user.name, req.user.role);
    return { message: 'Permission added successfully', data };
  }

  @Delete(':id/permissions/:permissionId')
  @Roles(Role.ADMIN)
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Remove a single permission from a role' })
  async removePermission(@Param('id') id: string, @Param('permissionId') permissionId: string, @Req() req: any) {
    const data = await this.rolesService.removePermission(id, permissionId, req.user.id, req.user.name, req.user.role);
    return { message: 'Permission removed successfully', data };
  }

  @Post('assign')
  @Roles(Role.ADMIN)
  @Permissions('roles.assign')
  @ApiOperation({ summary: 'Assign a role to a user' })
  async assignRoleToUser(@Body() dto: AssignRoleToUserDto, @Req() req: any) {
    const data = await this.rolesService.assignRoleToUser(dto.userId, dto.role as Role, req.user.id, req.user.name, req.user.role);
    return { message: data.message, data: null };
  }

  @Delete('users/:userId/roles/:roleName')
  @Roles(Role.ADMIN)
  @Permissions('roles.assign')
  @ApiOperation({ summary: 'Remove a role from a user' })
  async removeRoleFromUser(@Param('userId') userId: string, @Param('roleName') roleName: string, @Req() req: any) {
    const data = await this.rolesService.removeRoleFromUser(userId, roleName as Role, req.user.id, req.user.name, req.user.role);
    return { message: data.message, data: null };
  }
}
