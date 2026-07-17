import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Teacher Notes Dashboard')
@Controller('teacher/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeacherNotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Upload a new notes document' })
  async createNote(@Body() dto: any, @Req() req: any) {
    const teacher = await this.notesService.findTeacherProfileByUserId(req.user.id);
    const data = await this.notesService.createFromNames(dto, teacher.id, req.user.name);
    return { success: true, message: 'Note created successfully', data };
  }
}
