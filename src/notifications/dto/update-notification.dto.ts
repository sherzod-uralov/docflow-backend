import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { NotificationType } from '../../common/enums/notification.enum';
import { Type } from 'class-transformer';
import { NotificationMetadataDto } from './create-notification.dto';

export class UpdateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.SYSTEM,
    description: 'The type of notification',
    required: false,
  })
  @IsEnum(NotificationType, {
    message: 'Type must be a valid notification type',
  })
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({
    example: 'New Document Approval',
    description: 'The title of the notification',
    required: false,
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'You have a new document to approve',
    description: 'The message content of the notification',
    required: false,
  })
  @IsString({ message: 'Message must be a string' })
  @IsOptional()
  message?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the notification has been read',
    required: false,
  })
  @IsBoolean({ message: 'isRead must be a boolean' })
  @IsOptional()
  isRead?: boolean;

  @ApiProperty({
    type: NotificationMetadataDto,
    description: 'Additional data related to the notification',
    required: false,
  })
  @IsObject({ message: 'Metadata must be an object' })
  @ValidateNested()
  @Type(() => NotificationMetadataDto)
  @IsOptional()
  metadata?: NotificationMetadataDto;
}