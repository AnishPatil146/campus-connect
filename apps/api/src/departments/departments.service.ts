import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateDepartmentDto, collegeId: string, actorId: string, actorName: string, actorRole: string) {
    // Check if collegeId matches request context
    const finalCollegeId = dto.collegeId || collegeId;
    if (finalCollegeId !== collegeId) {
      throw new BadRequestException('Cannot create department for a different college context');
    }

    const existing = await this.prisma.department.findFirst({
      where: { name: dto.name, collegeId: finalCollegeId, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Department "${dto.name}" already exists in this college`);
    }

    const dept = await this.prisma.department.create({
      data: {
        name: dto.name,
        collegeId: finalCollegeId,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created Department',
      `Created department "${dto.name}"`,
      'departments',
      'Department',
      dept.id,
    );

    return dept;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: {
              courses: true,
              teachers: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.department.count({ where: { deletedAt: null } }),
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
    const dept = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        courses: { where: { deletedAt: null } },
        teachers: true,
      },
    });

    if (!dept) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, actorId: string, actorName: string, actorRole: string) {
    const dept = await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.department.findFirst({
        where: { name: dto.name, collegeId: dept.collegeId, id: { not: id }, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException(`Department "${dto.name}" already exists in this college`);
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: { name: dto.name },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Updated Department',
      `Updated department "${dept.name}" to "${dto.name || dept.name}"`,
      'departments',
      'Department',
      id,
    );

    return updated;
  }

  async remove(id: string, actorId: string, actorName: string, actorRole: string) {
    const dept = await this.findOne(id);

    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Deleted Department',
      `Soft-deleted department "${dept.name}"`,
      'departments',
      'Department',
      id,
    );

    return { message: `Department "${dept.name}" deleted successfully` };
  }
}
