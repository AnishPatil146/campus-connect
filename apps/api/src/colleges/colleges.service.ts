import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCollegeDto, UpdateCollegeDto, UpdateCollegeSettingsDto } from './dto/college.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CollegesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * List all colleges with pagination.
   */
  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.college.findMany({
        where: { deletedAt: null },
        include: {
          educationGroup: { select: { id: true, name: true } },
          settings: true,
          _count: {
            select: {
              departments: true,
              users: true,
              announcements: true,
              events: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.college.count({ where: { deletedAt: null } }),
    ]);

    return {
      data,
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
   * Get a single college by ID with full hierarchy.
   */
  async findOne(id: string) {
    const college = await this.prisma.college.findFirst({
      where: { id, deletedAt: null },
      include: {
        educationGroup: { select: { id: true, name: true } },
        settings: true,
        departments: {
          where: { deletedAt: null },
          include: {
            courses: {
              where: { deletedAt: null },
              include: {
                academicSessions: {
                  where: { deletedAt: null },
                  include: {
                    semesters: {
                      where: { deletedAt: null },
                      include: {
                        divisions: {
                          where: { deletedAt: null },
                          select: { id: true, name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { users: true, departments: true, announcements: true, events: true },
        },
      },
    });

    if (!college) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }

    return college;
  }

  /**
   * Create a new college under an education group.
   */
  async create(dto: CreateCollegeDto, userId: string, userName: string, role: string) {
    // Verify education group exists
    const group = await this.prisma.educationGroup.findFirst({
      where: { id: dto.educationGroupId, deletedAt: null },
    });
    if (!group) {
      throw new BadRequestException(`Education group with ID ${dto.educationGroupId} not found`);
    }

    // Check name uniqueness
    const existing = await this.prisma.college.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new BadRequestException(`College "${dto.name}" already exists`);
    }

    const college = await this.prisma.college.create({
      data: {
        name: dto.name,
        educationGroupId: dto.educationGroupId,
      },
      include: { educationGroup: { select: { id: true, name: true } } },
    });

    // Auto-create default settings
    await this.prisma.collegeSetting.create({
      data: { collegeId: college.id },
    });

    await this.audit.log(userId, userName, role, 'Created College', `Created college "${dto.name}" under group "${group.name}"`, 'colleges', 'College', college.id);

    return college;
  }

  /**
   * Update a college.
   */
  async update(id: string, dto: UpdateCollegeDto, userId: string, userName: string, role: string) {
    const college = await this.prisma.college.findFirst({ where: { id, deletedAt: null } });
    if (!college) throw new NotFoundException(`College with ID ${id} not found`);

    if (dto.name) {
      const existing = await this.prisma.college.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) throw new BadRequestException(`College "${dto.name}" already exists`);
    }

    const updated = await this.prisma.college.update({
      where: { id },
      data: { name: dto.name },
    });

    await this.audit.log(userId, userName, role, 'Updated College', `Updated college "${college.name}"`, 'colleges', 'College', id);

    return updated;
  }

  /**
   * Soft delete a college.
   */
  async remove(id: string, userId: string, userName: string, role: string) {
    const college = await this.prisma.college.findFirst({ where: { id, deletedAt: null } });
    if (!college) throw new NotFoundException(`College with ID ${id} not found`);

    await this.prisma.college.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log(userId, userName, role, 'Deleted College', `Soft-deleted college "${college.name}"`, 'colleges', 'College', id);

    return { message: `College "${college.name}" deleted successfully` };
  }

  /**
   * Get college settings/branding.
   */
  async getSettings(collegeId: string) {
    const settings = await this.prisma.collegeSetting.findUnique({
      where: { collegeId },
    });

    if (!settings) {
      // Auto-create if missing
      return this.prisma.collegeSetting.create({
        data: { collegeId },
      });
    }

    return settings;
  }

  /**
   * Update college settings/branding.
   */
  async updateSettings(collegeId: string, dto: UpdateCollegeSettingsDto, userId: string, userName: string, role: string) {
    const college = await this.prisma.college.findFirst({ where: { id: collegeId, deletedAt: null } });
    if (!college) throw new NotFoundException(`College with ID ${collegeId} not found`);

    const settings = await this.prisma.collegeSetting.upsert({
      where: { collegeId },
      create: { collegeId, ...dto },
      update: dto,
    });

    await this.audit.log(userId, userName, role, 'Updated College Settings', `Updated branding/settings for college "${college.name}"`, 'colleges', 'CollegeSetting', settings.id);

    return settings;
  }

  /**
   * Get college statistics (dashboard widget data).
   */
  async getStatistics(collegeId: string) {
    const college = await this.prisma.college.findFirst({ where: { id: collegeId, deletedAt: null } });
    if (!college) throw new NotFoundException(`College with ID ${collegeId} not found`);

    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalDepartments,
      totalAnnouncements,
      totalEvents,
    ] = await Promise.all([
      this.prisma.user.count({ where: { collegeId, deletedAt: null } }),
      this.prisma.student.count({
        where: {
          user: { collegeId, deletedAt: null },
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.teacher.count({
        where: {
          user: { collegeId, deletedAt: null },
          deletedAt: null,
        },
      }),
      this.prisma.department.count({ where: { collegeId, deletedAt: null } }),
      this.prisma.announcement.count({ where: { collegeId, deletedAt: null } }),
      this.prisma.event.count({ where: { collegeId, deletedAt: null } }),
    ]);

    return {
      collegeId,
      collegeName: college.name,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalDepartments,
      totalAnnouncements,
      totalEvents,
    };
  }
}
