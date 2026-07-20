import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UploadNoteFileDto } from './dto/upload-note-file.dto';
import { CreateNoteCommentDto } from './dto/create-note-comment.dto';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(filters: any) {
    const where: any = {};

    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.semesterId) where.semesterId = filters.semesterId;
    if (filters.divisionId) where.divisionId = filters.divisionId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.status) where.status = filters.status;
    if (filters.visibility) where.visibility = filters.visibility;

    return this.prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { select: { id: true, userId: true } },
        subject: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
        category: true,
      },
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, userId: true } },
        subject: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
        category: true,
        files: true,
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID "${id}" not found`);
    }

    return note;
  }

  async create(dto: CreateNoteDto, teacherId: string, actorName: string) {
    let categoryId = dto.categoryId;
    if (!categoryId || categoryId === 'default' || categoryId.length < 10) {
      let cat = await this.prisma.noteCategory.findFirst({
        where: { name: 'Study Materials' }
      });
      if (!cat) {
        cat = await this.prisma.noteCategory.create({
          data: { name: 'Study Materials' }
        });
      }
      categoryId = cat.id;
    }

    let subjectId = dto.subjectId;
    if (!subjectId || subjectId === 'default' || subjectId.length < 10) {
      const sub = await this.prisma.subject.findFirst();
      if (!sub) {
        throw new NotFoundException('No subjects found in the database');
      }
      subjectId = sub.id;
    }

    let semesterId = dto.semesterId;
    if (!semesterId || semesterId === 'default' || semesterId.length < 10) {
      const sem = await this.prisma.semester.findFirst();
      if (!sem) {
        throw new NotFoundException('No semesters found in the database');
      }
      semesterId = sem.id;
    }

    let divisionId = dto.divisionId;
    if (!divisionId || divisionId === 'default' || divisionId.length < 10) {
      const div = await this.prisma.division.findFirst();
      if (!div) {
        throw new NotFoundException('No divisions found in the database');
      }
      divisionId = div.id;
    }

    const data: any = {
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl || '/files/mock-pdf.pdf',
      fileName: dto.fileName || 'lecture-notes.pdf',
      fileSize: dto.fileSize || 1024 * 1024 * 2.5,
      mimeType: dto.mimeType || 'application/pdf',
      subjectId,
      semesterId,
      divisionId,
      categoryId,
      teacherId,
      visibility: dto.visibility || 'SEMESTER',
      status: dto.status || 'PUBLISHED',
      publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    };

    const note = await this.prisma.note.create({ data });
    await this.auditService.log(teacherId, actorName, 'TEACHER', 'UPLOAD_NOTE', `Created note ${note.id}`, 'notes', 'Note', note.id);

    const fullNote = await this.prisma.note.findUnique({
      where: { id: note.id },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        subject: true,
        category: true,
      },
    });

    if (note.status === 'PUBLISHED') {
      this.eventsGateway.broadcast('noteUploaded', fullNote);
      this.eventsGateway.broadcast('notes:uploaded', fullNote);
      // Notify all students in the division
      await this.notifyStudentsOfNewNote(divisionId, dto.title, note.id).catch(() => {});
    }

    return note;
  }

  async createFromNames(dto: any, teacherId: string, actorName: string) {
    let category = await this.prisma.noteCategory.findFirst({
      where: { name: { contains: dto.category || 'Study Materials', mode: 'insensitive' } }
    });
    if (!category) {
      category = await this.prisma.noteCategory.create({
        data: { name: dto.category || 'Study Materials' }
      });
    }

    let subject = await this.prisma.subject.findFirst({
      where: { name: { contains: dto.subject || 'Database Management Systems', mode: 'insensitive' } }
    });
    if (!subject) {
      subject = await this.prisma.subject.findFirst();
    }
    if (!subject) throw new NotFoundException('No subjects found in the database');

    let semester = await this.prisma.semester.findFirst({
      where: { name: { contains: dto.semester?.toString() || 'Semester 1', mode: 'insensitive' } }
    });
    if (!semester) {
      semester = await this.prisma.semester.findFirst();
    }
    if (!semester) throw new NotFoundException('No semesters found in the database');

    let division = await this.prisma.division.findFirst({
      where: { name: { contains: dto.division || 'Division A', mode: 'insensitive' } }
    });
    if (!division) {
      division = await this.prisma.division.findFirst();
    }
    if (!division) throw new NotFoundException('No divisions found in the database');

    const data: any = {
      title: dto.title,
      description: dto.description || '',
      fileUrl: dto.fileUrl || '/files/mock-pdf.pdf',
      fileName: dto.fileName || 'lecture-notes.pdf',
      fileSize: dto.fileSize || 1024 * 1024 * 2.5,
      mimeType: dto.mimeType || 'application/pdf',
      subjectId: subject.id,
      semesterId: semester.id,
      divisionId: division.id,
      categoryId: category.id,
      teacherId,
      visibility: dto.visibility || 'SEMESTER',
      status: dto.status || 'PUBLISHED',
      publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    };

    const note = await this.prisma.note.create({ data });
    await this.auditService.log(teacherId, actorName, 'TEACHER', 'UPLOAD_NOTE', `Created note ${note.id}`, 'notes', 'Note', note.id);

    const fullNote = await this.prisma.note.findUnique({
      where: { id: note.id },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        subject: true,
        category: true,
      },
    });

    if (note.status === 'PUBLISHED') {
      this.eventsGateway.broadcast('noteUploaded', fullNote);
      this.eventsGateway.broadcast('notes:uploaded', fullNote);
      // Notify all students in the division
      await this.notifyStudentsOfNewNote(division.id, dto.title, note.id).catch(() => {});
    }

    return fullNote;
  }

  /** Helper: send in-app notification to all active students in a division */
  private async notifyStudentsOfNewNote(divisionId: string, noteTitle: string, noteId: string) {
    const students = await this.prisma.student.findMany({
      where: { divisionId, status: 'ACTIVE' },
      select: { userId: true },
    });
    for (const student of students) {
      this.notificationsService.sendNotification({
        recipientId: student.userId,
        title: 'New Study Material Available',
        body: `New notes uploaded: "${noteTitle}". Access them in your Notes section.`,
        type: 'IN_APP',
        link: `/dashboard/student/notes?id=${noteId}`,
      }).catch(() => { /* Non-blocking */ });
    }
  }

  async update(id: string, dto: UpdateNoteDto, userId: string, actorName: string) {
    const existing = await this.prisma.note.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Note with ID "${id}" not found`);
    }

    await this.prisma.noteVersion.create({
      data: {
        noteId: id,
        version: existing.version,
        updatedById: userId,
        changeLog: dto.changeLog || 'Note updated',
      },
    });

    const data: any = {
      title: dto.title,
      description: dto.description,
      subjectId: dto.subjectId,
      semesterId: dto.semesterId,
      divisionId: dto.divisionId,
      categoryId: dto.categoryId,
      visibility: dto.visibility,
      status: dto.status,
      publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      version: existing.version + 1,
    };

    const note = await this.prisma.note.update({
      where: { id },
      data,
    });

    await this.auditService.log(userId, actorName, 'TEACHER', 'UPDATE_NOTE', `Updated note ${id}`, 'notes', 'Note', id);

    const fullNote = await this.prisma.note.findUnique({
      where: { id: note.id },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        subject: true,
        category: true,
      },
    });

    if (note.status === 'PUBLISHED') {
      this.eventsGateway.broadcast('noteUploaded', fullNote);
      this.eventsGateway.broadcast('notes:uploaded', fullNote);
    }

    return note;
  }

  async remove(id: string, userId: string, actorName: string) {
    const existing = await this.findOne(id);
    await this.prisma.note.update({
      where: { id },
      data: { status: 'DELETED', deletedAt: new Date() },
    });
    await this.auditService.log(userId, actorName, 'TEACHER', 'DELETE_NOTE', `Soft deleted note ${id}`, 'notes', 'Note', id);
    return existing;
  }

  async uploadFile(noteId: string, dto: UploadNoteFileDto, userId: string) {
    await this.findOne(noteId);
    const file = await this.prisma.noteFile.create({
      data: {
        noteId,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        storageUrl: dto.storageUrl,
        checksum: dto.checksum,
      },
    });
    await this.prisma.noteActivity.create({
      data: {
        noteId,
        userId,
        action: 'UPLOAD',
        details: `Uploaded file ${dto.fileName}`,
      },
    });
    return file;
  }

  async createComment(noteId: string, userId: string, dto: CreateNoteCommentDto) {
    await this.findOne(noteId);
    const comment = await this.prisma.noteComment.create({
      data: {
        noteId,
        userId,
        comment: dto.comment,
        replyToId: dto.replyToId,
      },
    });
    await this.prisma.noteActivity.create({
      data: {
        noteId,
        userId,
        action: 'COMMENT',
        details: `Commented on note ${noteId}`,
      },
    });
    return comment;
  }

  async favorite(noteId: string, userId: string) {
    await this.findOne(noteId);
    const existing = await this.prisma.noteFavorite.findUnique({
      where: { noteId_userId: { noteId, userId } },
    });

    if (existing) {
      return existing;
    }

    const favorite = await this.prisma.noteFavorite.create({
      data: { noteId, userId },
    });
    await this.prisma.noteActivity.create({
      data: {
        noteId,
        userId,
        action: 'FAVORITE',
        details: `Favorited note ${noteId}`,
      },
    });
    return favorite;
  }

  async recordView(noteId: string, userId: string, durationSeconds?: number) {
    await this.findOne(noteId);
    const view = await this.prisma.noteView.create({
      data: {
        noteId,
        userId,
        durationSeconds,
      },
    });
    await this.prisma.noteActivity.create({
      data: {
        noteId,
        userId,
        action: 'VIEW',
        details: `Viewed note ${noteId}`,
      },
    });
    return view;
  }

  async getActivity(noteId?: string) {
    const where: any = {};
    if (noteId) where.noteId = noteId;
    return this.prisma.noteActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async recordDownload(noteId: string, userId: string) {
    await this.findOne(noteId);
    const download = await this.prisma.noteDownload.create({
      data: {
        noteId,
        userId,
      },
    });

    await this.prisma.noteActivity.create({
      data: {
        noteId,
        userId,
        action: 'DOWNLOAD',
        details: `Downloaded note ${noteId}`,
      },
    });

    return download;
  }

  async findTeacherProfileByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }
    return teacher;
  }

  async getNotesForStudent(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.note.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { divisionId: student.divisionId },
          { semesterId: student.semesterId },
          { visibility: 'PUBLIC' },
        ],
      },
      include: {
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
        subject: true,
        semester: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
