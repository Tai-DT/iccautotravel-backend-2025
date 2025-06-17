import { Notification as PrismaNotification } from '@prisma/client';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

export class NotificationEntity {
  id: string = '';
  userId: string = '';
  title: string = '';
  message: string = '';
  type: NotificationType = NotificationType.INFO;
  priority: NotificationPriority = NotificationPriority.MEDIUM;
  metadata: Record<string, any> = {};
  isRead: boolean = false;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  static fromPrisma(notification: PrismaNotification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = notification.id;
    entity.userId = notification.userId;
    entity.title = notification.title;
    entity.message = notification.message;
    entity.type = notification.type as NotificationType;
    entity.priority = notification.priority as NotificationPriority;
    entity.metadata = notification.metadata as Record<string, any>;
    entity.isRead = notification.isRead;
    entity.createdAt = notification.createdAt;
    entity.updatedAt = notification.updatedAt;
    return entity;
  }
}
