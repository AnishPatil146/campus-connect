import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Create a new user.
   */
  async createUser(dto: CreateUserDto, actorId: string, actorName: string, actorRole: string) {
    // Check if email already exists
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Email "${dto.email}" is already registered`);
    }

    // Hash the password
    const passwordHash = bcrypt.hashSync(dto.password, 12);

    if (dto.collegeId) {
      const college = await this.prisma.college.findFirst({
        where: { id: dto.collegeId, deletedAt: null },
      });
      if (!college) {
        throw new NotFoundException(`College with ID ${dto.collegeId} not found`);
      }
    }

    // Find the roleModel by name
    const roleModel = await this.prisma.roleModel.findUnique({
      where: { name: dto.role },
    });
    if (!roleModel) {
      throw new NotFoundException(`Role model for "${dto.role}" not found in database`);
    }

    // Create user and map to roles
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        collegeId: dto.collegeId,
        status: UserStatus.ACTIVE,
        userRoles: {
          create: {
            roleId: roleModel.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Log audit activity
    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created User',
      `Created user account for ${dto.email} with role ${dto.role}`,
      'users',
      'User',
      user.id
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: dto.role,
      collegeId: user.collegeId,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  /**
   * List all users with query filtering and pagination.
   */
  async findAllUsers(searchDto: SearchUserDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', q, role, status } = searchDto;
    const skip = (page - 1) * limit;

    const whereClause: any = { deletedAt: null };

    // Apply text search on name or email
    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Apply role filter
    if (role) {
      whereClause.userRoles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    // Apply status filter
    if (status) {
      whereClause.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        include: {
          userRoles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.userRoles[0]?.role.name || null,
      roles: u.userRoles.map((ur) => ur.role.name),
      collegeId: u.collegeId,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      data: formattedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get a single user with detailed relations.
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        college: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        refreshTokens: {
          where: { expiresAt: { gt: new Date() } },
          select: {
            id: true,
            device: true,
            browser: true,
            ipAddress: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      collegeId: user.collegeId,
      college: user.college,
      role: user.userRoles[0]?.role.name || null,
      roles: user.userRoles.map((ur) => ur.role.name),
      activeSessions: user.refreshTokens,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update a user.
   */
  async updateUser(id: string, dto: UpdateUserDto, actorId: string, actorName: string, actorRole: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const data: any = {};

    if (dto.name) {
      data.name = dto.name;
    }

    if (dto.password) {
      data.passwordHash = bcrypt.hashSync(dto.password, 12);
    }

    if (dto.status) {
      data.status = dto.status;
    }

    if (dto.collegeId) {
      const college = await this.prisma.college.findFirst({ where: { id: dto.collegeId, deletedAt: null } });
      if (!college) throw new NotFoundException(`College with ID ${dto.collegeId} not found`);
      data.collegeId = dto.collegeId;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Updated User',
      `Updated profile fields for user ${user.email}`,
      'users',
      'User',
      id
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      status: updatedUser.status,
      collegeId: updatedUser.collegeId,
    };
  }

  /**
   * Soft delete a user.
   */
  async removeUser(id: string, actorId: string, actorName: string, actorRole: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Terminate all sessions
    await this.prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Deleted User',
      `Soft-deleted user ${user.email}`,
      'users',
      'User',
      id
    );

    return { message: `User "${user.name}" deleted successfully` };
  }

  /**
   * Update status of user.
   */
  async updateStatus(id: string, status: UserStatus, actorId: string, actorName: string, actorRole: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    // If deactivating or suspending, terminate all their active sessions
    if (status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: id },
      });
    }

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Updated User Status',
      `Changed status of user ${user.email} to ${status}`,
      'users',
      'User',
      id
    );

    return { message: `Status for user "${user.name}" updated to ${status} successfully` };
  }

  /**
   * Get sessions of a user.
   */
  async getSessions(id: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId: id, expiresAt: { gt: new Date() } },
    });
  }

  /**
   * Revoke a single login session.
   */
  async revokeSession(userId: string, sessionId: string, actorId: string, actorName: string, actorRole: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found for this user`);
    }

    await this.prisma.refreshToken.delete({
      where: { id: sessionId },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Revoked Session',
      `Revoked login session ${sessionId} for user ID ${userId}`,
      'auth',
      'RefreshToken',
      sessionId
    );

    return { message: 'Session revoked successfully' };
  }

  /**
   * Get activity timeline/logs for a user.
   */
  async getActivityTimeline(userId: string) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  /**
   * Find all students (kept for backwards compatibility).
   */
  async findAllStudents() {
    const students = await this.prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            collegeId: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        division: {
          include: {
            semester: {
              include: {
                academicSession: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return students.map((s) => {
      const u = s.user;
      return {
        ...s,
        user: u
          ? {
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.userRoles[0]?.role.name || null,
              roles: u.userRoles.map((ur) => ur.role.name),
              collegeId: u.collegeId,
            }
          : null,
      };
    });
  }
}
