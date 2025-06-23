import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsNumber, 
  IsString, 
  IsOptional, 
  IsObject, 
  IsDateString 
} from 'class-validator';

export class AssignPermissionToUserDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the user to assign the permission to',
  })
  @IsNumber({}, { message: 'userId must be a number' })
  @IsNotEmpty({ message: 'userId is required' })
  userId: number;

  @ApiProperty({
    example: 1,
    description: 'The ID of the permission to assign',
  })
  @IsNumber({}, { message: 'permissionId must be a number' })
  @IsNotEmpty({ message: 'permissionId is required' })
  permissionId: number;

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