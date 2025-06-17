import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationPriority)
  priority!: NotificationPriority;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
