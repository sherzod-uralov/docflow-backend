import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationType } from '../common/enums/notification.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    try {
      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: createNotificationDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${createNotificationDto.userId} not found`,
        );
      }

      // Create the notification
      const notification = await this.prisma.notification.create({
        data: {
          userId: createNotificationDto.userId,
          type: createNotificationDto.type,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          isRead: createNotificationDto.isRead || false,
          metadata: createNotificationDto.metadata || {},
        },
      });

      return notification;
    } catch (error) {
      this.logger.error(
        `Error creating notification: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create notification');
    }
  }

  async findAll(userId: number) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return notifications;
    } catch (error) {
      this.logger.error(
        `Error finding notifications: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve notifications');
    }
  }

  async findUnread(userId: number) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
      });

      return notifications;
    } catch (error) {
      this.logger.error(
        `Error finding unread notifications: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve unread notifications');
    }
  }

  async findOne(id: number, userId: number) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      // Check if the user has permission to view this notification
      if (notification.userId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to view this notification',
        );
      }

      return notification;
    } catch (error) {
      this.logger.error(
        `Error finding notification: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve notification');
    }
  }

  async update(
    id: number,
    userId: number,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      // Check if the user has permission to update this notification
      if (notification.userId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this notification',
        );
      }

      // Update the notification
      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: updateNotificationDto,
      });

      return updatedNotification;
    } catch (error) {
      this.logger.error(
        `Error updating notification: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update notification');
    }
  }

  async markAsRead(id: number, userId: number) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      // Check if the user has permission to mark this notification as read
      if (notification.userId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to mark this notification as read',
        );
      }

      // Mark the notification as read
      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return updatedNotification;
    } catch (error) {
      this.logger.error(
        `Error marking notification as read: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId: number) {
    try {
      // Mark all notifications for this user as read
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return { count: result.count };
    } catch (error) {
      this.logger.error(
        `Error marking all notifications as read: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to mark all notifications as read');
    }
  }

  // Helper methods for creating specific types of notifications

  async createSystemNotification(userId: number, title: string, message: string, metadata?: any) {
    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.SYSTEM,
      title,
      message,
      metadata,
    };
    return this.create(notificationDto);
  }

  async createOverdueStepNotification(userId: number, workflowId: number, stepId: number, documentTitle: string) {
    const title = 'Overdue Approval Step';
    const message = `The approval step for document "${documentTitle}" is overdue.`;
    const metadata = { workflowId, stepId };

    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.OVERDUE_STEP,
      title,
      message,
      metadata,
    };

    return this.create(notificationDto);
  }

  async createOverdueWorkflowNotification(userId: number, workflowId: number, documentTitle: string) {
    const title = 'Overdue Approval Workflow';
    const message = `The approval workflow for document "${documentTitle}" is overdue.`;
    const metadata = { workflowId };

    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.OVERDUE_WORKFLOW,
      title,
      message,
      metadata,
    };

    return this.create(notificationDto);
  }

  async createWorkflowReturnedNotification(userId: number, workflowId: number, stepId: number, documentTitle: string, returnReason: string) {
    const title = 'Document Returned for Revision';
    const message = `The document "${documentTitle}" has been returned to you for revision. Reason: ${returnReason}`;
    const metadata = { workflowId, stepId };

    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.WORKFLOW_RETURNED,
      title,
      message,
      metadata,
    };

    return this.create(notificationDto);
  }

  async createWorkflowResubmittedNotification(userId: number, workflowId: number, stepId: number, documentTitle: string, resubmissionExplanation: string) {
    const title = 'Document Resubmitted';
    const message = `A document "${documentTitle}" has been resubmitted to you with the following explanation: ${resubmissionExplanation}`;
    const metadata = { workflowId, stepId };

    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.WORKFLOW_RESUBMITTED,
      title,
      message,
      metadata,
    };

    return this.create(notificationDto);
  }
}
