import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

export class NotificationFilterDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  type?: NotificationType;

  @IsOptional()
  priority?: NotificationPriority;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
