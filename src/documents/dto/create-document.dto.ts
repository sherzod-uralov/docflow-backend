import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @ApiProperty({
    example: 'Contract Agreement',
    description: 'The title of the document',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    example: 'Legal contract for project X',
    description: 'The description of the document',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://cdn.example.com/documents/contract.pdf',
    description: 'The URL of the document file',
  })
  @IsUrl({}, { message: 'File URL must be a valid URL' })
  @IsNotEmpty({ message: 'File URL is required' })
  fileUrl: string;

  @ApiProperty({
    example: 1,
    description: 'The ID of the document type',
  })
  @IsNumber({}, { message: 'Type ID must be a number' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Type ID is required' })
  typeId: number;

  @ApiProperty({
    example: 1,
    description: 'The ID of the journal to associate with the document',
    required: false,
  })
  @IsNumber({}, { message: 'Journal ID must be a number' })
  @Type(() => Number)
  @IsOptional()
  journalId?: number;

  @ApiProperty({
    example: '#contract #legal #project',
    description: 'Hashtags for the document',
    required: false,
  })
  @IsString({ message: 'Hashtags must be a string' })
  @IsOptional()
  hashtags?: string;
}
