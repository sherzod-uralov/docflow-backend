import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateDeadlineNotificationUserDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the user who will receive deadline notifications',
  })
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: number;
}