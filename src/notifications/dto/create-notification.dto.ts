import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { NotificationType } from '../../common/enums/notification.enum';
import { Type } from 'class-transformer';

export class NotificationMetadataDto {
  @ApiProperty({
    example: { workflowId: 1, stepId: 2 },
    description: 'Additional data related to the notification',
    required: false,
    type: 'object',
    additionalProperties: true
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  // Allow any property to be assigned
  [key: string]: any;
}

export class CreateNotificationDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the user who will receive the notification',
  })
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: number;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.SYSTEM,
    description: 'The type of notification',
  })
  @IsEnum(NotificationType, {
    message: 'Type must be a valid notification type',
  })
  @IsNotEmpty({ message: 'Type is required' })
  type: NotificationType;

  @ApiProperty({
    example: 'New Document Approval',
    description: 'The title of the notification',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    example: 'You have a new document to approve',
    description: 'The message content of the notification',
  })
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  message: string;

  @ApiProperty({
    example: false,
    description: 'Whether the notification has been read',
    default: false,
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
