import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOrUpdateSettingDto {
  @ApiProperty({
    example: 'true',
    description: 'The value of the setting',
  })
  @IsString({ message: 'Value must be a string' })
  @IsNotEmpty({ message: 'Value is required' })
  value: string;

  @ApiProperty({
    example: 'Controls whether department supervisor access is assigned automatically',
    description: 'Optional description of the setting',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;
}