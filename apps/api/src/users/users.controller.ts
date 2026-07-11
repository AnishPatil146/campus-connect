import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Role, UserStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@ApiTags('Users & Students')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  @Post('users')
  @Roles(Role.ADMIN)
  @Permissions('users.create')
  @ApiOperation({ summary: 'Create a new user account (Student/Teacher/Admin)' })
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    const data = await this.usersService.createUser(dto, req.user.id, req.user.name, req.user.role);
    return {
      message: 'User created successfully',
      data,
    };
  }

  @Get('users')
  @Roles(Role.ADMIN)
  @Permissions('users.read')
  @ApiOperation({ summary: 'Retrieve list of all users' })
  async getUsers(@Query() searchDto: SearchUserDto) {
    const result = await this.usersService.findAllUsers(searchDto);
    return {
      message: 'Users retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('users/:id')
  @Roles(Role.ADMIN)
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get a single user details by ID' })
  async getUser(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return {
      message: 'User retrieved successfully',
      data,
    };
  }

  @Patch('users/:id')
  @Roles(Role.ADMIN)
  @Permissions('users.update')
  @ApiOperation({ summary: 'Update a user account' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    const data = await this.usersService.updateUser(id, dto, req.user.id, req.user.name, req.user.role);
    return {
      message: 'User updated successfully',
      data,
    };
  }

  @Delete('users/:id')
  @Roles(Role.ADMIN)
  @Permissions('users.delete')
  @ApiOperation({ summary: 'Soft delete a user account' })
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const result = await this.usersService.removeUser(id, req.user.id, req.user.name, req.user.role);
    return {
      message: result.message,
      data: null,
    };
  }

  @Patch('users/:id/status')
  @Roles(Role.ADMIN)
  @Permissions('users.update')
  @ApiOperation({ summary: 'Change user account status (Activate/Suspend/Deactivate)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
    @Req() req: any,
  ) {
    const result = await this.usersService.updateStatus(id, status, req.user.id, req.user.name, req.user.role);
    return {
      message: result.message,
      data: null,
    };
  }

  @Get('users/:id/sessions')
  @Roles(Role.ADMIN)
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get all active sessions for a user' })
  async getSessions(@Param('id') id: string) {
    const data = await this.usersService.getSessions(id);
    return {
      message: 'Active sessions retrieved successfully',
      data,
    };
  }

  @Delete('users/:id/sessions/:sessionId')
  @Roles(Role.ADMIN)
  @Permissions('users.update')
  @ApiOperation({ summary: 'Revoke an active session for a user' })
  async revokeSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    const result = await this.usersService.revokeSession(id, sessionId, req.user.id, req.user.name, req.user.role);
    return {
      message: result.message,
      data: null,
    };
  }

  @Get('users/:id/timeline')
  @Roles(Role.ADMIN)
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get activity timeline for a user' })
  async getActivityTimeline(@Param('id') id: string) {
    const data = await this.usersService.getActivityTimeline(id);
    return {
      message: 'Activity timeline retrieved successfully',
      data,
    };
  }

  @Get('students')
  @Roles(Role.ADMIN, Role.TEACHER)
  @Permissions('students.read')
  @ApiOperation({ summary: 'Retrieve list of all student profiles' })
  async getStudents(@Req() req: any) {
    const data = await this.usersService.findAllStudents();
    
    // Log audit activity
    const user = req.user;
    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Viewed Students',
      `User ${user.email} queried student profiles`,
    );

    return {
      message: 'Students retrieved successfully',
      data,
    };
  }

  @Get('audit-logs')
  @Roles(Role.ADMIN)
  @Permissions('audit.read')
  @ApiOperation({ summary: 'Retrieve list of all activity/audit logs' })
  async getAuditLogs() {
    const data = await this.auditService.getLogs();
    return {
      message: 'Audit logs retrieved successfully',
      data,
    };
  }
}

