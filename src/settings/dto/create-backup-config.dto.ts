import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsNotEmpty, Min, Matches } from 'class-validator';

export class CreateBackupConfigDto {
  @ApiProperty({
    example: 'daily',
    description: 'Backup schedule (e.g., daily, weekly, monthly)',
  })
  @IsString({ message: 'Schedule must be a string' })
  @IsNotEmpty({ message: 'Schedule is required' })
  schedule: string;

  @ApiProperty({
    example: '0 0 * * *',
    description: 'Cron expression for the backup schedule',
  })
  @IsString({ message: 'Cron expression must be a string' })
  @IsNotEmpty({ message: 'Cron expression is required' })
  @Matches(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/, {
    message: 'Invalid cron expression format',
  })
  cronExpression: string;

  @ApiProperty({
    example: '/backups',
    description: 'Directory where backups are stored',
  })
  @IsString({ message: 'Backup directory must be a string' })
  @IsNotEmpty({ message: 'Backup directory is required' })
  backupDirectory: string;

  @ApiProperty({
    example: 7,
    description: 'Number of days to keep backups',
  })
  @IsNumber({}, { message: 'Retention days must be a number' })
  @Min(1, { message: 'Retention days must be at least 1' })
  @IsNotEmpty({ message: 'Retention days is required' })
  retentionDays: number;

  @ApiProperty({
    example: true,
    description: 'Whether backups are enabled',
  })
  @IsBoolean({ message: 'Enabled must be a boolean' })
  @IsNotEmpty({ message: 'Enabled is required' })
  enabled: boolean;
}