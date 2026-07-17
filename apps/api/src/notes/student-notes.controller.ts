import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Student Notes Dashboard')
@Controller('student/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentNotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get published notes for current student curriculum' })
  async getStudentNotes(@Req() req: any) {
    const data = await this.notesService.getNotesForStudent(req.user.id);
    return { success: true, message: 'Notes retrieved successfully', data };
  }
}
