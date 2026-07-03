import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@ApiTags('Users & Students')
@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  @Get('users')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Retrieve list of all users' })
  async getUsers(@Req() req: any) {
    const data = await this.usersService.findAllUsers();
    
    // Log audit activity
    const user = req.user;
    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Viewed Users',
      `User ${user.email} queried all system users`,
    );

    return {
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Get('students')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Retrieve list of all students' })
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
}
