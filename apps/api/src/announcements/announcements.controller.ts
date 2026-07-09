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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Announcements')
@Controller('api/v1/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all announcements' })
  async findAll(@Query('collegeId') collegeId?: string) {
    const data = await this.announcementsService.findAll(collegeId);
    return {
      success: true,
      message: 'Announcements retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single announcement by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.announcementsService.findOne(id);
    return {
      success: true,
      message: 'Announcement retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new announcement (admin/teacher only)' })
  async create(@Body() dto: CreateAnnouncementDto, @Req() req: any) {
    const authorId = req.user.id;
    const collegeId = req.user.collegeId;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'TEACHER';
    const data = await this.announcementsService.create(dto, authorId, collegeId, actorName, actorRole);
    return {
      success: true,
      message: 'Announcement created successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing announcement' })
  async update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'TEACHER';
    const data = await this.announcementsService.update(id, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Announcement updated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an announcement' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'TEACHER';
    await this.announcementsService.remove(id, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Announcement deleted successfully',
      data: null,
    };
  }
}
