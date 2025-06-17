import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import fetch from 'node-fetch';
import { PrismaService, Prisma } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { PaginationOptionsDto } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationPriority } from './enums/notification-priority.enum';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    try {
      // Validate required fields
      if (!createNotificationDto.title || !createNotificationDto.message) {
        throw new BadRequestException('Title and message are required');
      }

      // Validate notification type
      if (
        !Object.values(NotificationType).includes(createNotificationDto.type)
      ) {
        throw new BadRequestException('Invalid notification type');
      }

      // Validate priority
      if (
        !Object.values(NotificationPriority).includes(
          createNotificationDto.priority,
        )
      ) {
        throw new BadRequestException('Invalid notification priority');
      }

      const notification = await this.prisma.notification.create({
        data: {
          id: uuidv4(),
          userId: createNotificationDto.userId,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          type: createNotificationDto.type as any,
          priority: createNotificationDto.priority as any,
          metadata: createNotificationDto.metadata || {},
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Created notification for user ${createNotificationDto.userId}`,
      );
      return NotificationEntity.fromPrisma(notification);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create notification: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Failed to create notification: Unknown error');
      }
      throw error;
    }
  }

  async findAll(
    options: PaginationOptionsDto & NotificationFilterDto,
  ): Promise<{ data: NotificationEntity[]; metadata: any }> {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const where: Prisma.NotificationWhereInput = {
        userId: options.userId,
        type: options.type as any,
        priority: options.priority as any,
        isRead: options.isRead,
        createdAt: {
          gte: options.dateFrom ? new Date(options.dateFrom) : undefined,
          lte: options.dateTo ? new Date(options.dateTo) : undefined,
        },
      };

      const [data, total] = await Promise.all([
        this.prisma.notification.findMany({
          skip,
          take: limit,
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.count({ where }),
      ]);

      return {
        data: data.map(NotificationEntity.fromPrisma),
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to find notifications: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Failed to find notifications: Unknown error');
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<NotificationEntity> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      return NotificationEntity.fromPrisma(notification);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to find notification ${id}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Failed to find notification ${id}: Unknown error`);
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationEntity> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(updateNotificationDto.title && {
            title: updateNotificationDto.title,
          }),
          ...(updateNotificationDto.message && {
            message: updateNotificationDto.message,
          }),
          ...(updateNotificationDto.isRead !== undefined && {
            isRead: updateNotificationDto.isRead,
          }),
          ...(updateNotificationDto.metadata && {
            metadata: updateNotificationDto.metadata,
          }),
        },
      });

      this.logger.log(`Updated notification ${id}`);
      return NotificationEntity.fromPrisma(updatedNotification);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to update notification ${id}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Failed to update notification ${id}: Unknown error`);
      }
      throw error;
    }
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Marked notification ${id} as read`);
      return NotificationEntity.fromPrisma(updatedNotification);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to mark notification ${id} as read: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to mark notification ${id} as read: Unknown error`,
        );
      }
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Marked all notifications as read for user ${userId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to mark all notifications as read: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'Failed to mark all notifications as read: Unknown error',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      await this.prisma.notification.delete({
        where: { id },
      });

      this.logger.log(`Deleted notification ${id}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to remove notification ${id}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Failed to remove notification ${id}: Unknown error`);
      }
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to get unread count: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Failed to get unread count: Unknown error');
      }
      throw error;
    }
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const [total, unread, byType, byPriority] = await Promise.all([
        this.prisma.notification.count({
          where: { userId },
        }),
        this.prisma.notification.count({
          where: {
            userId,
            isRead: false,
          },
        }),
        this.prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: true,
        }),
        this.prisma.notification.groupBy({
          by: ['priority'],
          where: { userId },
          _count: true,
        }),
      ]);

      return {
        total,
        unread,
        byType: byType.reduce(
          (
            acc: Record<string, number>,
            curr: { type: string; _count: number },
          ) => {
            acc[curr.type] = curr._count;
            return acc;
          },
          {},
        ),
        byPriority: byPriority.reduce(
          (
            acc: Record<string, number>,
            curr: { priority: string; _count: number },
          ) => {
            acc[curr.priority] = curr._count;
            return acc;
          },
          {},
        ),
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to get notification stats: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Failed to get notification stats: Unknown error');
      }
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        throw new BadRequestException('SendGrid API key not configured');
      }

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.com',
        subject,
        html,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send email to ${to}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Failed to send email to ${to}: Unknown error`);
      }
      throw error;
    }
  }

  async sendPush(
    to: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!process.env.FCM_SERVER_KEY) {
        throw new BadRequestException('FCM server key not configured');
      }

      const payload = {
        to,
        notification: { title, body },
        data: data || {},
      };

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${process.env.FCM_SERVER_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`FCM error: ${response.statusText}`);
      }

      this.logger.log(`Push notification sent successfully to ${to}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send push notification to ${to}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to send push notification to ${to}: Unknown error`,
        );
      }
      throw error;
    }
  }

  async sendBookingUpdate(booking: {
    id: string;
    status: string;
    startDate: Date;
    endDate: Date;
    User?: {
      email?: string;
      fcmToken?: string;
    };
    user?: {
      email?: string;
      fcmToken?: string;
    };
  }): Promise<void> {
    try {
      const user = booking.User || booking.user;
      if (!user) {
        throw new BadRequestException(
          'No user info for booking update notification',
        );
      }

      const subject = `Booking Updated: ${booking.id}`;
      const html = `
        <p>Your booking <b>${booking.id}</b> has been updated.</p>
        <p>Status: <b>${booking.status}</b></p>
        <p>Time: ${booking.startDate.toLocaleString()} - ${booking.endDate.toLocaleString()}</p>
      `;

      const notificationPromises: Promise<void>[] = [];

      if (user.email) {
        notificationPromises.push(this.sendEmail(user.email, subject, html));
      } else {
        this.logger.warn(
          `No email found for user in booking update ${booking.id}`,
        );
      }

      if (user.fcmToken) {
        notificationPromises.push(
          this.sendPush(
            user.fcmToken,
            'Booking Updated',
            `Your booking ${booking.id} status: ${booking.status}`,
            { bookingId: booking.id, status: booking.status },
          ),
        );
      } else {
        this.logger.warn(
          `No FCM token found for user in booking update ${booking.id}`,
        );
      }

      await Promise.all(notificationPromises);
      this.logger.log(
        `Booking update notifications sent successfully for booking ${booking.id}`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send booking update notifications: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'Failed to send booking update notifications: Unknown error',
        );
      }
      throw error;
    }
  }

  async sendBookingCancel(booking: {
    id: string;
    startDate: Date;
    endDate: Date;
    User?: {
      email?: string;
      fcmToken?: string;
    };
    user?: {
      email?: string;
      fcmToken?: string;
    };
  }): Promise<void> {
    try {
      const user = booking.User || booking.user;
      if (!user) {
        throw new BadRequestException(
          'No user info for booking cancel notification',
        );
      }

      const subject = `Booking Cancelled: ${booking.id}`;
      const html = `
        <p>Your booking <b>${booking.id}</b> has been cancelled.</p>
        <p>Time: ${booking.startDate.toLocaleString()} - ${booking.endDate.toLocaleString()}</p>
      `;

      const notificationPromises: Promise<void>[] = [];

      if (user.email) {
        notificationPromises.push(this.sendEmail(user.email, subject, html));
      } else {
        this.logger.warn(
          `No email found for user in booking cancel ${booking.id}`,
        );
      }

      if (user.fcmToken) {
        notificationPromises.push(
          this.sendPush(
            user.fcmToken,
            'Booking Cancelled',
            `Your booking ${booking.id} has been cancelled.`,
            { bookingId: booking.id, status: 'CANCELLED' },
          ),
        );
      } else {
        this.logger.warn(
          `No FCM token found for user in booking cancel ${booking.id}`,
        );
      }

      await Promise.all(notificationPromises);
      this.logger.log(
        `Booking cancel notifications sent successfully for booking ${booking.id}`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send booking cancel notifications: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'Failed to send booking cancel notifications: Unknown error',
        );
      }
      throw error;
    }
  }
}
