import { Controller, Get, Post, Body, Param, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { Response } from 'express';

@ApiTags('Imports Center')
@Controller('api/v1/imports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ImportsController {
  constructor(
    private importsService: ImportsService,
    private auditService: AuditService,
  ) {}

  @Post('preview')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Preview bulk upload validation without committing' })
  async preview(@Body() body: { type: 'STUDENT' | 'TEACHER'; rows: any[] }) {
    const data = await this.importsService.previewImport(body.type, body.rows);
    return {
      message: 'Upload preview processed successfully',
      data,
    };
  }

  @Post('commit')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Commit validated rows to the database and register accounts' })
  async commit(
    @Req() req: any,
    @Body() body: {
      type: 'STUDENT' | 'TEACHER';
      rows: any[];
      duplicatePolicy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW';
      filename: string;
    },
  ) {
    const user = req.user;
    const data = await this.importsService.commitImport(
      body.type,
      body.rows,
      body.duplicatePolicy,
      user.id,
      body.filename,
    );

    // Log to Audit logs
    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      `Imported Bulk ${body.type}s`,
      `User ${user.email} successfully imported bulk ${body.type}s from ${body.filename}. Success: ${data.successRows}, Failed: ${data.failedRows}`,
    );

    return {
      message: `Bulk registration completed. Status: ${data.status}`,
      data,
    };
  }

  @Get('history')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve logs of past import uploads' })
  async getHistory() {
    const data = await this.importsService.getHistory();
    return {
      message: 'Import history retrieved successfully',
      data,
    };
  }

  @Post('promote')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bulk promote students of a division' })
  async promote(
    @Req() req: any,
    @Body() body: {
      sourceDivisionId: string;
      targetDivisionId: string;
      failedStudentIds: string[];
    },
  ) {
    const user = req.user;
    const data = await this.importsService.promoteDivision(
      body.sourceDivisionId,
      body.targetDivisionId,
      body.failedStudentIds || [],
    );

    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Bulk Promoted Division',
      `User ${user.email} promoted students of division ${body.sourceDivisionId} to ${body.targetDivisionId}. Promoted: ${data.promotedCount}, Skipped: ${data.skippedCount}`,
    );

    return {
      message: 'Promotion completed successfully',
      data,
    };
  }

  @Get('template/:type')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Download CSV templates for student or teacher imports' })
  async getTemplate(@Param('type') type: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type.toLowerCase()}_template.csv`);

    let csvContent = '';
    if (type.toUpperCase() === 'STUDENT') {
      csvContent = 'Roll No,Name,Email,Mobile,Department,Course,Semester,Division\n' +
                   '1001,Anish Patil,anish@gmail.com,9876543210,Computer Science,BSc IT,Semester 1,Division A\n';
    } else {
      csvContent = 'Employee ID,Name,Email,Department,Phone\n' +
                   'T101,Sarah Jenkins,teacher@college.edu,Computer Science,+91 9876543210\n';
    }

    return res.send(csvContent);
  }
}
