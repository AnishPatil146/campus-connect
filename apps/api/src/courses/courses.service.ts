import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateCourseDto, actorId: string, actorName: string, actorRole: string) {
    // Validate that the parent department exists
    const department = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, deletedAt: null },
    });
    if (!department) {
      throw new NotFoundException(`Department with ID ${dto.departmentId} not found`);
    }

    // Check unique course name in this department
    const existing = await this.prisma.course.findFirst({
      where: { name: dto.name, departmentId: dto.departmentId, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Course "${dto.name}" already exists in this department`);
    }

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        departmentId: dto.departmentId,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created Course',
      `Created course "${dto.name}" in department "${department.name}"`,
      'courses',
      'Course',
      course.id,
    );

    return course;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { deletedAt: null },
        include: {
          department: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              academicSessions: true,
              subjects: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.course.count({ where: { deletedAt: null } }),
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

  async findOne(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        academicSessions: { where: { deletedAt: null } },
        subjects: { where: { deletedAt: null } },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto, actorId: string, actorName: string, actorRole: string) {
    const course = await this.findOne(id);

    const data: any = {};

    if (dto.name) {
      data.name = dto.name;
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, deletedAt: null },
      });
      if (!department) {
        throw new NotFoundException(`Department with ID ${dto.departmentId} not found`);
      }
      data.departmentId = dto.departmentId;
    }

    // Check unique course name in target department
    const targetDeptId = data.departmentId || course.departmentId;
    const targetName = data.name || course.name;
    
    if (dto.name || dto.departmentId) {
      const existing = await this.prisma.course.findFirst({
        where: { name: targetName, departmentId: targetDeptId, id: { not: id }, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException(`Course "${targetName}" already exists in the target department`);
      }
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data,
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Updated Course',
      `Updated course "${course.name}"`,
      'courses',
      'Course',
      id,
    );

    return updated;
  }

  async remove(id: string, actorId: string, actorName: string, actorRole: string) {
    const course = await this.findOne(id);

    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Deleted Course',
      `Soft-deleted course "${course.name}"`,
      'courses',
      'Course',
      id,
    );

    return { message: `Course "${course.name}" deleted successfully` };
  }
}
