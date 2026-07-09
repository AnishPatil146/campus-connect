import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UploadNoteFileDto } from './dto/upload-note-file.dto';
import { CreateNoteCommentDto } from './dto/create-note-comment.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

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
    const data: any = {
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      subjectId: dto.subjectId,
      semesterId: dto.semesterId,
      divisionId: dto.divisionId,
      categoryId: dto.categoryId,
      teacherId,
      visibility: dto.visibility || 'SEMESTER',
      status: dto.status || 'DRAFT',
      publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    };

    const note = await this.prisma.note.create({ data });
    await this.auditService.log(teacherId, actorName, 'TEACHER', 'UPLOAD_NOTE', `Created note ${note.id}`, 'notes', 'Note', note.id);
    return note;
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
}
