import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterJournalDto {
  @ApiProperty({
    example: 'Finance',
    description: 'Filter journals by name (partial match)',
    required: false,
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'FIN',
    description: 'Filter journals by prefix (partial match)',
    required: false,
  })
  @IsString({ message: 'Prefix must be a string' })
  @IsOptional()
  prefix?: string;

  @ApiProperty({
    example: 'Finance',
    description: 'Filter journals by kartoteka (partial match)',
    required: false,
  })
  @IsString({ message: 'Kartoteka must be a string' })
  @IsOptional()
  kartoteka?: string;

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
    example: 'name:asc',
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
