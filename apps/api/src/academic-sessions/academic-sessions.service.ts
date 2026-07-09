import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicSessionDto, UpdateAcademicSessionDto, CreateSemesterDto, CreateDivisionDto } from './dto/academic-session.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AcademicSessionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateAcademicSessionDto, actorId: string, actorName: string, actorRole: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
    }

    const existing = await this.prisma.academicSession.findFirst({
      where: { name: dto.name, courseId: dto.courseId, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Academic session "${dto.name}" already exists for this course`);
    }

    const session = await this.prisma.academicSession.create({
      data: {
        name: dto.name,
        courseId: dto.courseId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created Academic Session',
      `Created academic session "${dto.name}" for course "${course.name}"`,
      'academic-sessions',
      'AcademicSession',
      session.id,
    );

    return session;
  }

  async findAll() {
    return this.prisma.academicSession.findMany({
      where: { deletedAt: null },
      include: {
        course: { select: { id: true, name: true } },
        semesters: {
          where: { deletedAt: null },
          include: {
            divisions: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.academicSession.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: true,
        semesters: {
          where: { deletedAt: null },
          include: {
            divisions: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Academic session with ID ${id} not found`);
    }

    return session;
  }

  async update(id: string, dto: UpdateAcademicSessionDto, actorId: string, actorName: string, actorRole: string) {
    const session = await this.findOne(id);

    const data: any = {};
    if (dto.name) {
      const existing = await this.prisma.academicSession.findFirst({
        where: { name: dto.name, courseId: session.courseId, id: { not: id }, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException(`Academic session "${dto.name}" already exists for this course`);
      }
      data.name = dto.name;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.startDate) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      data.endDate = new Date(dto.endDate);
    }

    const updated = await this.prisma.academicSession.update({
      where: { id },
      data,
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Updated Academic Session',
      `Updated academic session "${session.name}"`,
      'academic-sessions',
      'AcademicSession',
      id,
    );

    return updated;
  }

  async remove(id: string, actorId: string, actorName: string, actorRole: string) {
    const session = await this.findOne(id);

    await this.prisma.academicSession.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Deleted Academic Session',
      `Soft-deleted academic session "${session.name}"`,
      'academic-sessions',
      'AcademicSession',
      id,
    );

    return { message: `Academic session "${session.name}" deleted successfully` };
  }

  async addSemester(sessionId: string, dto: CreateSemesterDto, actorId: string, actorName: string, actorRole: string) {
    const session = await this.findOne(sessionId);

    const existing = await this.prisma.semester.findFirst({
      where: { name: dto.name, academicSessionId: sessionId, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Semester "${dto.name}" already exists in this academic session`);
    }

    const semester = await this.prisma.semester.create({
      data: {
        name: dto.name,
        number: dto.number,
        academicSessionId: sessionId,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created Semester',
      `Created semester "${dto.name}" in session "${session.name}"`,
      'academic-sessions',
      'Semester',
      semester.id,
    );

    return semester;
  }

  async addDivision(semesterId: string, dto: CreateDivisionDto, actorId: string, actorName: string, actorRole: string) {
    const semester = await this.prisma.semester.findFirst({
      where: { id: semesterId, deletedAt: null },
      include: { academicSession: true },
    });
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${semesterId} not found`);
    }

    const existing = await this.prisma.division.findFirst({
      where: { name: dto.name, semesterId, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Division "${dto.name}" already exists in this semester`);
    }

    const division = await this.prisma.division.create({
      data: {
        name: dto.name,
        semesterId,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Created Division',
      `Created division "${dto.name}" in semester "${semester.name}"`,
      'academic-sessions',
      'Division',
      division.id,
    );

    return division;
  }
}
