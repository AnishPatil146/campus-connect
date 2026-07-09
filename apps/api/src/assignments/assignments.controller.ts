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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UploadAssignmentFileDto } from './dto/upload-assignment-file.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Assignments')
@Controller('api/v1/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assignments with filters' })
  async findAll(
    @Query('subjectId') subjectId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.assignmentsService.findAll({ subjectId, semesterId, divisionId, teacherId, status });
    return {
      success: true,
      message: 'Assignments retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single assignment by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.assignmentsService.findOne(id);
    return {
      success: true,
      message: 'Assignment retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new assignment' })
  async create(@Body() dto: CreateAssignmentDto, @Req() req: any) {
    const teacherId = req.user.teacherProfile?.id || req.user.id;
    const data = await this.assignmentsService.create(dto, teacherId, req.user.name);
    return {
      success: true,
      message: 'Assignment created successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an assignment' })
  async update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto, @Req() req: any) {
    const data = await this.assignmentsService.update(id, dto, req.user.id, req.user.name);
    return {
      success: true,
      message: 'Assignment updated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an assignment' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.assignmentsService.remove(id, req.user.id, req.user.name);
    return {
      success: true,
      message: 'Assignment deleted successfully',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit an assignment' })
  async submit(@Param('id') id: string, @Body() dto: SubmitAssignmentDto, @Req() req: any) {
    const data = await this.assignmentsService.submit(id, dto, req.user.id, req.user.name);
    return {
      success: true,
      message: 'Assignment submitted successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/files')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload file metadata for an assignment' })
  async uploadFile(@Param('id') id: string, @Body() dto: UploadAssignmentFileDto, @Req() req: any) {
    const data = await this.assignmentsService.uploadFile(id, dto, req.user.id);
    return {
      success: true,
      message: 'Assignment file metadata saved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/grade')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grade a student submission' })
  async grade(@Param('id') id: string, @Body() dto: GradeAssignmentDto, @Req() req: any) {
    const data = await this.assignmentsService.grade(id, dto, req.user.teacherProfile?.id || req.user.id, req.user.name);
    return {
      success: true,
      message: 'Assignment graded successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit an assignment (Alternative route)' })
  async submitAlt(@Body() dto: SubmitAssignmentDto & { assignmentId: string }, @Req() req: any) {
    const data = await this.assignmentsService.submit(dto.assignmentId, dto, req.user.id, req.user.name);
    return {
      success: true,
      message: 'Assignment submitted successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('grade')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grade a student submission (Alternative route)' })
  async gradeAlt(@Body() dto: GradeAssignmentDto & { assignmentId: string }, @Req() req: any) {
    const data = await this.assignmentsService.grade(dto.assignmentId, dto, req.user.teacherProfile?.id || req.user.id, req.user.name);
    return {
      success: true,
      message: 'Assignment graded successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('feedback')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add feedback to a student submission' })
  async feedback(@Body() dto: { submissionId: string; feedback: string }, @Req() req: any) {
    const teacherId = req.user.teacherProfile?.id || req.user.id;
    const data = await this.assignmentsService.addFeedback(dto.submissionId, dto.feedback, teacherId, req.user.name);
    return {
      success: true,
      message: 'Feedback added successfully',
      data,
    };
  }
}
