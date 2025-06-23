import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsNumber, 
  IsObject, 
  ValidateIf,
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'Create User',
    description: 'The name of the permission (Ruxsat nomi)',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'Permission to create new users',
    description: 'The description of the permission (Ruxsat tavsifi)',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'users:create',
    description: 'The key of the permission (Ruxsat kaliti)',
  })
  @IsString({ message: 'Key must be a string' })
  @IsNotEmpty({ message: 'Key is required' })
  key: string;

  @ApiProperty({
    example: 'users',
    description: 'The module of the permission (Module nomi)',
  })
  @IsString({ message: 'Module must be a string' })
  @IsNotEmpty({ message: 'Module is required' })
  module: string;

  @ApiProperty({
    example: true,
    description: 'Whether the permission is active',
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 1,
    description: 'The ID of the parent permission for permission inheritance',
    required: false,
  })
  @IsNumber({}, { message: 'parentId must be a number' })
  @IsOptional()
  parentId?: number;

  @ApiProperty({
    example: 'document',
    description: 'The type of resource this permission applies to (for resource-specific permissions)',
    required: false,
  })
  @IsString({ message: 'resourceType must be a string' })
  @IsOptional()
  resourceType?: string;

  @ApiProperty({
    example: '1',
    description: 'The ID of the resource this permission applies to (for resource-specific permissions)',
    required: false,
  })
  @IsString({ message: 'resourceId must be a string' })
  @ValidateIf(o => o.resourceType !== undefined)
  @IsOptional()
  resourceId?: string;

  @ApiProperty({
    example: { requireResourceMatch: true, resourceType: 'document', resourceId: '1' },
    description: 'Conditions for dynamic permission checking',
    required: false,
  })
  @IsObject({ message: 'conditions must be an object' })
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiProperty({
    example: '2023-12-31T23:59:59Z',
    description: 'Expiration date for temporary permissions',
    required: false,
  })
  @IsDateString({}, { message: 'expiresAt must be a valid date string' })
  @IsOptional()
  expiresAt?: string;
}
