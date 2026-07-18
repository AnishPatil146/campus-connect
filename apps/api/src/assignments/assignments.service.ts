import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UploadAssignmentFileDto } from './dto/upload-assignment-file.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { AssignmentStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(filters: any) {
    const where: any = {};
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.semesterId) where.semesterId = filters.semesterId;
    if (filters.divisionId) where.divisionId = filters.divisionId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.status) where.status = filters.status;

    return this.prisma.assignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { select: { id: true, userId: true } },
        subject: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, userId: true } },
        subject: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
        files: true,
        submissions: true,
        extensions: true,
        rubrics: true,
        activities: true,
        statistics: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID "${id}" not found`);
    }

    return assignment;
  }

  async create(dto: CreateAssignmentDto, teacherId: string, actorName: string) {
    const assignment = await this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        teacherId,
        subjectId: dto.subjectId,
        divisionId: dto.divisionId,
        semesterId: dto.semesterId,
        totalMarks: dto.totalMarks,
        passingMarks: dto.passingMarks,
        dueDate: new Date(dto.dueDate),
        allowLateSubmission: dto.allowLateSubmission ?? false,
        status: (dto.status || 'DRAFT') as AssignmentStatus,
      },
    });
    await this.auditService.log(teacherId, actorName, 'TEACHER', 'CREATE_ASSIGNMENT', `Created assignment ${assignment.id}`, 'assignments', 'Assignment', assignment.id);
    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto, userId: string, actorName: string) {
    const existing = await this.prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Assignment with ID "${id}" not found`);
    }

    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        divisionId: dto.divisionId,
        semesterId: dto.semesterId,
        totalMarks: dto.totalMarks,
        passingMarks: dto.passingMarks,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        allowLateSubmission: dto.allowLateSubmission,
        status: dto.status as AssignmentStatus,
      },
    });

    await this.auditService.log(userId, actorName, 'TEACHER', 'UPDATE_ASSIGNMENT', `Updated assignment ${id}`, 'assignments', 'Assignment', id);
    return assignment;
  }

  async remove(id: string, userId: string, actorName: string) {
    const existing = await this.findOne(id);
    await this.prisma.assignment.update({
      where: { id },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
    await this.auditService.log(userId, actorName, 'TEACHER', 'DELETE_ASSIGNMENT', `Archived assignment ${id}`, 'assignments', 'Assignment', id);
    return existing;
  }

  async submit(id: string, dto: SubmitAssignmentDto, userId: string, actorName: string) {
    const assignment = await this.findOne(id);
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new NotFoundException(`Student profile not found for user ${userId}`);
    }

    const submission = await this.prisma.submission.create({
      data: {
        assignmentId: id,
        studentId: student.id,
        status: dto.status || 'SUBMITTED',
        attemptNumber: dto.attemptNumber ?? 1,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        content: dto.content,
        isLate: dto.isLate ?? false,
      },
    });

    await this.prisma.assignmentActivity.create({
      data: {
        assignmentId: id,
        userId,
        action: 'SUBMITTED',
        details: `Submitted assignment ${id}`,
      },
    });

    await this.auditService.log(userId, actorName, 'STUDENT', 'SUBMIT_ASSIGNMENT', `Submitted assignment ${id}`, 'assignments', 'Assignment', id);
    return { assignment, submission };
  }

  async recordGrade(assignmentId: string, studentId: string, marks: number, feedback: string, teacherId: string, actorName: string) {
    let submission = await this.prisma.submission.findFirst({
      where: { assignmentId, studentId },
    });

    if (!submission) {
      submission = await this.prisma.submission.create({
        data: {
          assignmentId,
          studentId,
          status: 'GRADED',
          attemptNumber: 1,
          marks,
          feedback,
        },
      });
    }

    const graded = await this.prisma.assignmentMark.create({
      data: {
        submissionId: submission.id,
        obtainedMarks: marks,
        gradedById: teacherId,
      },
    });

    await this.prisma.submission.update({
      where: { id: submission.id },
      data: {
        marks,
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
      },
    });

    await this.prisma.assignmentActivity.create({
      data: {
        assignmentId,
        userId: teacherId,
        action: 'GRADED',
        details: `Recorded grade for student ${studentId}`,
      },
    });

    this.eventsGateway.broadcast('RESULT_PUBLISHED', {
      assignmentId,
      submissionId: submission.id,
      studentId,
      marks,
    });

    await this.auditService.log(
      teacherId,
      actorName,
      'TEACHER',
      'GRADE_ASSIGNMENT',
      `Recorded grade for student ${studentId}`,
      'assignments',
      'Submission',
      submission.id,
    );

    return graded;
  }

  async uploadFile(id: string, dto: UploadAssignmentFileDto, userId: string) {
    await this.findOne(id);
    const file = await this.prisma.assignmentFile.create({
      data: {
        assignmentId: id,
        storageUrl: dto.storageUrl,
        fileType: dto.fileType,
        fileName: dto.fileName,
        size: dto.size,
      },
    });

    await this.prisma.assignmentActivity.create({
      data: {
        assignmentId: id,
        userId,
        action: 'UPDATED',
        details: `Uploaded assignment file ${dto.fileName}`,
      },
    });
    return file;
  }

  async grade(id: string, dto: GradeAssignmentDto, teacherId: string, actorName: string) {
    const submission = await this.prisma.submission.findUnique({ where: { id: dto.submissionId } });
    if (!submission) {
      throw new NotFoundException(`Submission with ID "${dto.submissionId}" not found`);
    }

    const graded = await this.prisma.assignmentMark.create({
      data: {
        submissionId: dto.submissionId,
        obtainedMarks: dto.obtainedMarks,
        gradedById: teacherId,
      },
    });

    await this.prisma.assignmentFeedback.create({
      data: {
        submissionId: dto.submissionId,
        teacherId,
        feedback: dto.feedback || '',
      },
    });

    await this.prisma.submission.update({
      where: { id: dto.submissionId },
      data: {
        marks: dto.obtainedMarks,
        feedback: dto.feedback,
        status: 'GRADED',
        gradedAt: new Date(),
      },
    });

    await this.prisma.assignmentActivity.create({
      data: {
        assignmentId: id,
        userId: teacherId,
        action: 'GRADED',
        details: `Graded submission ${dto.submissionId}`,
      },
    });

    await this.auditService.log(teacherId, actorName, 'TEACHER', 'GRADE_ASSIGNMENT', `Graded submission ${dto.submissionId}`, 'assignments', 'Submission', dto.submissionId);

    // Emit live WebSocket update
    this.eventsGateway.broadcast('RESULT_PUBLISHED', {
      assignmentId: id,
      submissionId: dto.submissionId,
      studentId: submission.studentId,
      marks: dto.obtainedMarks,
    });

    return graded;
  }

  async addFeedback(submissionId: string, feedback: string, teacherId: string, actorName: string) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      throw new NotFoundException(`Submission with ID "${submissionId}" not found`);
    }

    const createdFeedback = await this.prisma.assignmentFeedback.create({
      data: {
        submissionId,
        teacherId,
        feedback,
      },
    });

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        feedback,
      },
    });

    await this.prisma.assignmentActivity.create({
      data: {
        assignmentId: submission.assignmentId,
        userId: teacherId,
        action: 'GRADED',
        details: `Added feedback to submission ${submissionId}`,
      },
    });

    await this.auditService.log(
      teacherId,
      actorName,
      'TEACHER',
      'GRADE_ASSIGNMENT',
      `Added feedback to submission ${submissionId}`,
      'assignments',
      'Submission',
      submissionId,
    );

    return createdFeedback;
  }
}
