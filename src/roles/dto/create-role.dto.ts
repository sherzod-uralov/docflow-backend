import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'The name of the role',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'Administrator with full access',
    description: 'The description of the role',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of permission IDs to assign to the role',
    type: [Number],
  })
  @IsArray({ message: 'Permission IDs must be an array' })
  @IsNumber({}, { each: true, message: 'Each permission ID must be a number' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Permission IDs are required' })
  permissionIds: number[];
}
