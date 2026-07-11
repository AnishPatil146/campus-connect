import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdatePreferenceDto,
  CreateBroadcastDto,
  SendNotificationDto,
} from './dto/notification-ops.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notification preferences' })
  async getPreferences(@Req() req: any) {
    const data = await this.notificationsService.getPreferences(req.user.id);
    return {
      success: true,
      message: 'Preferences retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user notification preferences' })
  async updatePreferences(@Req() req: any, @Body() dto: UpdatePreferenceDto) {
    const data = await this.notificationsService.updatePreferences(req.user.id, dto);
    return {
      success: true,
      message: 'Preferences updated successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('in-app')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all in-app notifications for logged in user' })
  async getInAppNotifications(@Req() req: any) {
    const data = await this.notificationsService.getInAppNotifications(req.user.id);
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('in-app/:id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark single notification as read' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(req.user.id, id);
    return {
      success: true,
      message: 'Notification marked as read',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('in-app/read-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all in-app notifications as read' })
  async markAllAsRead(@Req() req: any) {
    const data = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      success: true,
      message: 'All notifications marked as read',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('broadcast')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast message to target users (Admin/Teacher only)' })
  async createBroadcast(@Req() req: any, @Body() dto: CreateBroadcastDto) {
    const senderId = req.user.id;
    const collegeId = req.user.collegeId;
    const actorName = req.user.name || req.user.email;
    const actorRole = req.user.role || 'TEACHER';

    const data = await this.notificationsService.createBroadcast(
      dto,
      senderId,
      collegeId,
      actorName,
      actorRole,
    );
    return {
      success: true,
      message: 'Broadcast sent successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('broadcast')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sent broadcasts for college' })
  async getBroadcasts(@Req() req: any) {
    const data = await this.notificationsService.getBroadcasts(req.user.collegeId);
    return {
      success: true,
      message: 'Broadcasts retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('send')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send direct notification to a user' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    const data = await this.notificationsService.sendNotification(dto);
    return {
      success: true,
      message: 'Notification processed',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('queue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending items in the notification queue' })
  async getQueue() {
    const data = await this.notificationsService.getQueue();
    return {
      success: true,
      message: 'Queue retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('queue/process')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process pending items in the notification queue' })
  async processQueue() {
    const data = await this.notificationsService.processQueue();
    return {
      success: true,
      message: 'Queue processed successfully',
      data,
    };
  }
}

