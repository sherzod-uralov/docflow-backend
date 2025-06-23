import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsPositive } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiProperty({
    example: 'Finance Department',
    description: 'The name of the department',
    required: false,
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Handles all financial operations',
    description: 'Description of the department',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'The ID of the parent department',
    required: false,
  })
  @IsNumber({}, { message: 'Parent ID must be a number' })
  @IsPositive({ message: 'Parent ID must be a positive number' })
  @IsOptional()
  parentId?: number;
}
