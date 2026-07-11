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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  RegisterEventDto,
  SubmitAttendanceDto,
  SubmitResultDto,
  CreateCertificateDto,
  CreateFeedbackDto,
} from './dto/event-ops.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  async findAll(@Query('collegeId') collegeId?: string) {
    const data = await this.eventsService.findAll(collegeId);
    return {
      success: true,
      message: 'Events retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single event by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.eventsService.findOne(id);
    return {
      success: true,
      message: 'Event retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new event' })
  async create(@Body() dto: CreateEventDto, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';
    const collegeId = req.user.collegeId;

    const data = await this.eventsService.create(dto, actorId, collegeId, actorName, actorRole);
    return {
      success: true,
      message: 'Event created successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update existing event' })
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';

    const data = await this.eventsService.update(id, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Event updated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete (cancel) an event' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';

    await this.eventsService.remove(id, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Event deleted successfully',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a student for an event' })
  async register(@Param('id') id: string, @Body() dto: RegisterEventDto, @Req() req: any) {
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'STUDENT';

    const data = await this.eventsService.register(id, dto, req.user.id, actorName, actorRole);
    return {
      success: true,
      message: 'Event registration processed',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/approve/:registrationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve waitlisted registration' })
  async approveRegistration(
    @Param('id') id: string,
    @Param('registrationId') registrationId: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';

    const data = await this.eventsService.approveRegistration(id, registrationId, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Event registration approved',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/attendance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit participant attendance' })
  async submitAttendance(@Param('id') id: string, @Body() dto: SubmitAttendanceDto, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';

    const data = await this.eventsService.submitAttendance(id, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Attendance record submitted',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/result')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit event winner results' })
  async submitResult(@Param('id') id: string, @Body() dto: SubmitResultDto, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';

    const data = await this.eventsService.submitResult(id, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Event result submitted successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/certificate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue participation/winner certificate' })
  async issueCertificate(@Param('id') id: string, @Body() dto: CreateCertificateDto, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';

    const data = await this.eventsService.issueCertificate(id, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Certificate generated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/feedback')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit feedback rating' })
  async submitFeedback(@Param('id') id: string, @Body() dto: CreateFeedbackDto, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'STUDENT';

    const data = await this.eventsService.submitFeedback(id, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Feedback submitted successfully',
      data,
    };
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get event activity logs' })
  async getLogs(@Param('id') id: string) {
    const data = await this.eventsService.getLogs(id);
    return {
      success: true,
      message: 'Event logs retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a student registration for an event' })
  async cancelRegister(@Param('id') id: string, @Req() req: any) {
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'STUDENT';
    const data = await this.eventsService.cancelRegistration(id, req.user.id, actorName, actorRole);
    return {
      success: true,
      message: 'Event registration cancelled successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a student registration for an event (Alternative route)' })
  async cancelRegisterAlt(@Body() dto: { eventId: string }, @Req() req: any) {
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'STUDENT';
    const data = await this.eventsService.cancelRegistration(dto.eventId, req.user.id, actorName, actorRole);
    return {
      success: true,
      message: 'Event registration cancelled successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for an event (Alternative route)' })
  async registerAlt(@Body() dto: RegisterEventDto & { eventId: string }, @Req() req: any) {
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'STUDENT';
    const data = await this.eventsService.register(dto.eventId, dto, req.user.id, actorName, actorRole);
    return {
      success: true,
      message: 'Event registration processed',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('attendance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit participant attendance (Alternative route)' })
  async submitAttendanceAlt(@Body() dto: SubmitAttendanceDto & { eventId: string }, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';
    const data = await this.eventsService.submitAttendance(dto.eventId, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Attendance record submitted',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('results')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit event winner results (Alternative route)' })
  async submitResultAlt(@Body() dto: SubmitResultDto & { eventId: string }, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';
    const data = await this.eventsService.submitResult(dto.eventId, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Event result submitted successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('certificate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue participation/winner certificate (Alternative route)' })
  async issueCertificateAlt(@Body() dto: CreateCertificateDto & { eventId: string }, @Req() req: any) {
    const actorId = req.user.id;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'ADMIN';
    const data = await this.eventsService.issueCertificate(dto.eventId, dto, actorId, actorName, actorRole);
    return {
      success: true,
      message: 'Certificate generated successfully',
      data,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get event activity logs (Alternative route)' })
  async getLogsAlt(@Query('eventId') eventId: string) {
    const data = await this.eventsService.getLogs(eventId);
    return {
      success: true,
      message: 'Event logs retrieved successfully',
      data,
    };
  }
}

