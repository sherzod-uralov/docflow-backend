import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJournalDto {
  @ApiProperty({
    example: 'Finance Journal',
    description: 'The name of the journal',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'FIN',
    description: 'The prefix of the journal',
  })
  @IsString({ message: 'Prefix must be a string' })
  @IsNotEmpty({ message: 'Prefix is required' })
  prefix: string;

  @ApiProperty({
    example: 'Finance Department',
    description: 'The kartoteka of the journal',
  })
  @IsString({ message: 'Kartoteka must be a string' })
  @IsNotEmpty({ message: 'Kartoteka is required' })
  kartoteka: string;

  @ApiProperty({
    example: 1,
    description: 'The order number of the journal',
  })
  @IsNumber({}, { message: 'Order number must be a number' })
  @Min(1, { message: 'Order number must be at least 1' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Order number is required' })
  orderNumber: number;
}