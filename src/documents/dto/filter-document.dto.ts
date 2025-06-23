import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterDocumentDto {
  @ApiProperty({
    example: 'Contract',
    description: 'Filter documents by title (partial match)',
    required: false,
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 1,
    description: 'Filter documents by type ID',
    required: false,
  })
  @IsInt({ message: 'Type ID must be an integer' })
  @Type(() => Number)
  @IsOptional()
  typeId?: number;

  @ApiProperty({
    example: 1,
    description: 'Filter documents by journal ID',
    required: false,
  })
  @IsInt({ message: 'Journal ID must be an integer' })
  @Type(() => Number)
  @IsOptional()
  journalId?: number;

  @ApiProperty({
    example: '#contract',
    description: 'Filter documents by hashtags (partial match)',
    required: false,
  })
  @IsString({ message: 'Hashtags must be a string' })
  @IsOptional()
  hashtags?: string;

  @ApiProperty({
    example: 1,
    description: 'Filter documents by creator ID',
    required: false,
  })
  @IsInt({ message: 'Created by ID must be an integer' })
  @Type(() => Number)
  @IsOptional()
  createdById?: number;

  @ApiProperty({
    example: 1,
    description: 'Page number (1-based)',
    required: false,
    default: 1,
  })
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
    required: false,
    default: 10,
  })
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    example: 'createdAt:desc',
    description: 'Sort field and direction (field:asc|desc)',
    required: false,
    default: 'createdAt:desc',
  })
  @IsString({ message: 'Sort must be a string' })
  @IsOptional()
  sort?: string = 'createdAt:desc';

  get skip(): number {
    const page = this.page || 1;
    const limit = this.limit || 10;
    return (page - 1) * limit;
  }

  get take(): number {
    return this.limit || 10;
  }
}
