import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class MarkStepAsReadDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the approval step to mark as read',
  })
  @IsNumber({}, { message: 'Step ID must be a number' })
  @IsNotEmpty({ message: 'Step ID is required' })
  stepId: number;
}