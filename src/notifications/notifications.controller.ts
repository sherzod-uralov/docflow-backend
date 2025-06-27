import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all notifications for the current user.',
  })
  findAll(@Request() req) {
    return this.notificationsService.findAll(req.user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get all unread notifications for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all unread notifications for the current user.',
  })
  findUnread(@Request() req) {
    return this.notificationsService.findUnread(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the notification with the specified ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.notificationsService.findOne(id, req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been marked as read.',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications have been marked as read.',
  })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The notification has been successfully created.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification (admin only)' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, req.user.id, updateNotificationDto);
  }
}