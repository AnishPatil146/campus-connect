import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UploadNoteFileDto } from './dto/upload-note-file.dto';
import { CreateNoteCommentDto } from './dto/create-note-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notes with optional filters' })
  async findAll(
    @Query('subjectId') subjectId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
  ) {
    const data = await this.notesService.findAll({ subjectId, semesterId, divisionId, teacherId, status, visibility });
    return {
      success: true,
      message: 'Notes retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.notesService.findOne(id);
    return {
      success: true,
      message: 'Note retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new note' })
  async create(@Body() dto: CreateNoteDto, @Req() req: any) {
    const teacherId = req.user.teacherProfile?.id || req.user.id;
    const data = await this.notesService.create(dto, teacherId, req.user.name);
    return {
      success: true,
      message: 'Note created successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing note' })
  async update(@Param('id') id: string, @Body() dto: UpdateNoteDto, @Req() req: any) {
    const userId = req.user.id;
    const data = await this.notesService.update(id, dto, userId, req.user.name);
    return {
      success: true,
      message: 'Note updated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a note' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.notesService.remove(id, req.user.id, req.user.name);
    return {
      success: true,
      message: 'Note deleted successfully',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/files')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload file metadata for a note' })
  async uploadFile(@Param('id') id: string, @Body() dto: UploadNoteFileDto, @Req() req: any) {
    const data = await this.notesService.uploadFile(id, dto, req.user.id);
    return {
      success: true,
      message: 'Note file metadata saved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a note' })
  async createComment(@Param('id') id: string, @Body() dto: CreateNoteCommentDto, @Req() req: any) {
    const data = await this.notesService.createComment(id, req.user.id, dto);
    return {
      success: true,
      message: 'Comment added successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Favorite a note' })
  async favorite(@Param('id') id: string, @Req() req: any) {
    const data = await this.notesService.favorite(id, req.user.id);
    return {
      success: true,
      message: 'Note favorited successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a note view' })
  async recordView(@Param('id') id: string, @Body() dto: { durationSeconds?: number }, @Req() req: any) {
    const data = await this.notesService.recordView(id, req.user.id, dto.durationSeconds);
    return {
      success: true,
      message: 'Note view recorded successfully',
      data,
    };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get note activity log entries' })
  async activity(@Query('noteId') noteId?: string) {
    const data = await this.notesService.getActivity(noteId);
    return {
      success: true,
      message: 'Note activity retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload file metadata for a note' })
  async uploadFileAlt(@Body() dto: UploadNoteFileDto & { noteId: string }, @Req() req: any) {
    const data = await this.notesService.uploadFile(dto.noteId, dto, req.user.id);
    return {
      success: true,
      message: 'Note file metadata saved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('download')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a note download' })
  async download(@Body() dto: { noteId: string }, @Req() req: any) {
    const data = await this.notesService.recordDownload(dto.noteId, req.user.id);
    return {
      success: true,
      message: 'Note download recorded successfully',
      data,
    };
  }
}

