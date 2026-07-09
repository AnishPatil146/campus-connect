import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEducationGroupDto, UpdateEducationGroupDto } from './dto/education-group.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class EducationGroupsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.educationGroup.findMany({
        where: { deletedAt: null },
        include: {
          colleges: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  departments: true,
                  users: true,
                },
              },
            },
          },
          _count: {
            select: { colleges: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.educationGroup.count({ where: { deletedAt: null } }),
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
    const group = await this.prisma.educationGroup.findFirst({
      where: { id, deletedAt: null },
      include: {
        colleges: {
          where: { deletedAt: null },
          include: {
            departments: {
              where: { deletedAt: null },
              select: { id: true, name: true },
            },
            _count: {
              select: { users: true, departments: true },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Education group with ID ${id} not found`);
    }

    return group;
  }

  async create(dto: CreateEducationGroupDto, userId: string, userName: string, role: string) {
    // Check uniqueness
    const existing = await this.prisma.educationGroup.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Education group "${dto.name}" already exists`);
    }

    const group = await this.prisma.educationGroup.create({
      data: { name: dto.name },
    });

    await this.audit.log(userId, userName, role, 'Created Education Group', `Created education group "${dto.name}"`, 'education-groups', 'EducationGroup', group.id);

    return group;
  }

  async update(id: string, dto: UpdateEducationGroupDto, userId: string, userName: string, role: string) {
    const group = await this.prisma.educationGroup.findFirst({
      where: { id, deletedAt: null },
    });
    if (!group) {
      throw new NotFoundException(`Education group with ID ${id} not found`);
    }

    if (dto.name) {
      const existing = await this.prisma.educationGroup.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(`Education group "${dto.name}" already exists`);
      }
    }

    const updated = await this.prisma.educationGroup.update({
      where: { id },
      data: { name: dto.name },
    });

    await this.audit.log(userId, userName, role, 'Updated Education Group', `Updated education group "${group.name}" to "${dto.name}"`, 'education-groups', 'EducationGroup', id);

    return updated;
  }

  async remove(id: string, userId: string, userName: string, role: string) {
    const group = await this.prisma.educationGroup.findFirst({
      where: { id, deletedAt: null },
    });
    if (!group) {
      throw new NotFoundException(`Education group with ID ${id} not found`);
    }

    // Soft delete
    await this.prisma.educationGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log(userId, userName, role, 'Deleted Education Group', `Soft-deleted education group "${group.name}"`, 'education-groups', 'EducationGroup', id);

    return { message: `Education group "${group.name}" deleted successfully` };
  }
}
