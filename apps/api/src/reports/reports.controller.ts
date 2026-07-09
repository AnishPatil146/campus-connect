import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService, GenerateReportDto } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new report' })
  async generate(@Body() dto: GenerateReportDto, @Req() req: any) {
    const data = await this.reportsService.generateReport(dto, req.user.id, req.user.name, req.user.role);
    return {
      success: true,
      message: 'Report generated successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all generated reports for the user' })
  async findAll(@Req() req: any) {
    const data = await this.reportsService.findAll(req.user.id);
    return {
      success: true,
      message: 'Reports retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single report' })
  async findOne(@Param('id') id: string) {
    const data = await this.reportsService.findOne(id);
    return {
      success: true,
      message: 'Report details retrieved successfully',
      data,
    };
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Download a report file' })
  async download(@Param('id') id: string, @Req() req: any) {
    const data = await this.reportsService.download(id, req.user.id, req.user.name, req.user.role);
    return {
      success: true,
      message: 'Report file prepared for download',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.reportsService.remove(id, req.user.id, req.user.name, req.user.role);
    return {
      success: true,
      message: 'Report deleted successfully',
      data: null,
    };
  }
}
