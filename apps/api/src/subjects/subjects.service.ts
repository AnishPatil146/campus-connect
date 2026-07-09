import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateSubjectDto, actorId: string, actorName: string, actorRole: string) {
    // Validate Department & Course links
    const [department, course] = await Promise.all([
      this.prisma.department.findFirst({ where: { id: dto.departmentId, deletedAt: null } }),
      this.prisma.course.findFirst({ where: { id: dto.courseId, deletedAt: null } }),
    ]);

    if (!department) throw new NotFoundException(`Department with ID ${dto.departmentId} not found`);
    if (!course) throw new NotFoundException(`Course with ID ${dto.courseId} not found`);

    if (dto.code) {
      const existingCode = await this.prisma.subject.findFirst({
        where: { code: dto.code, courseId: dto.courseId, deletedAt: null },
      });
      if (existingCode) {
        throw new BadRequestException(`Subject with code "${dto.code}" already exists for this course`);
      }
    }

    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        code: dto.code || null,
        courseId: dto.courseId,
        departmentId: dto.departmentId,
        creditHours: dto.creditHours || null,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created Subject',
      `Created subject "${dto.name}" (${dto.code || 'No Code'})`,
      'subjects',
      'Subject',
      subject.id,
    );

    return subject;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        where: { deletedAt: null },
        include: {
          course: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.subject.count({ where: { deletedAt: null } }),
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
    const subject = await this.prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: true,
        department: true,
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto, actorId: string, actorName: string, actorRole: string) {
    const subject = await this.findOne(id);

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.creditHours !== undefined) data.creditHours = dto.creditHours;
    if (dto.code) {
      const existingCode = await this.prisma.subject.findFirst({
        where: { code: dto.code, courseId: subject.courseId, id: { not: id }, deletedAt: null },
      });
      if (existingCode) {
        throw new BadRequestException(`Subject with code "${dto.code}" already exists for this course`);
      }
      data.code = dto.code;
    }

    const updated = await this.prisma.subject.update({
      where: { id },
      data,
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Updated Subject',
      `Updated subject "${subject.name}"`,
      'subjects',
      'Subject',
      id,
    );

    return updated;
  }

  async remove(id: string, actorId: string, actorName: string, actorRole: string) {
    const subject = await this.findOne(id);

    await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Deleted Subject',
      `Soft-deleted subject "${subject.name}"`,
      'subjects',
      'Subject',
      id,
    );

    return { message: `Subject "${subject.name}" deleted successfully` };
  }
}
