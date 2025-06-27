import { ApiProperty } from '@nestjs/swagger';

export class CpuInfo {
  @ApiProperty({
    example: 8,
    description: 'Number of CPU cores',
  })
  count: number;

  @ApiProperty({
    example: 'Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz',
    description: 'CPU model name',
  })
  model: string;

  @ApiProperty({
    example: 3800,
    description: 'CPU speed in MHz',
  })
  speed: number;
}

export class MemoryInfo {
  @ApiProperty({
    example: 16384,
    description: 'Total memory in MB',
  })
  total: number;

  @ApiProperty({
    example: 8192,
    description: 'Free memory in MB',
  })
  free: number;

  @ApiProperty({
    example: 8192,
    description: 'Used memory in MB',
  })
  used: number;

  @ApiProperty({
    example: 50,
    description: 'Memory usage percentage',
  })
  usagePercentage: number;
}

export class SystemInfoDto {
  @ApiProperty({
    example: 'Windows_NT',
    description: 'Operating system platform',
  })
  platform: string;

  @ApiProperty({
    example: 'Windows 10 Pro',
    description: 'Operating system name',
  })
  osName: string;

  @ApiProperty({
    example: '10.0.19042',
    description: 'Operating system version',
  })
  osVersion: string;

  @ApiProperty({
    type: CpuInfo,
    description: 'CPU information',
  })
  cpu: CpuInfo;

  @ApiProperty({
    type: MemoryInfo,
    description: 'Memory information',
  })
  memory: MemoryInfo;

  @ApiProperty({
    example: 3600,
    description: 'System uptime in seconds',
  })
  uptime: number;

  @ApiProperty({
    example: '2023-05-15T10:30:00.000Z',
    description: 'Current system time',
  })
  currentTime: string;
}

export class BackupInfoDto {
  @ApiProperty({
    example: 'daily',
    description: 'Backup schedule (e.g., daily, weekly, monthly)',
  })
  schedule: string;

  @ApiProperty({
    example: '0 0 * * *',
    description: 'Cron expression for the backup schedule',
  })
  cronExpression: string;

  @ApiProperty({
    example: '/backups',
    description: 'Directory where backups are stored',
  })
  backupDirectory: string;

  @ApiProperty({
    example: 7,
    description: 'Number of days to keep backups',
  })
  retentionDays: number;

  @ApiProperty({
    example: true,
    description: 'Whether backups are enabled',
  })
  enabled: boolean;

  @ApiProperty({
    example: '2023-05-15T00:00:00.000Z',
    description: 'Last backup time',
    nullable: true,
  })
  lastBackupTime: string | null;

  @ApiProperty({
    example: '2023-05-16T00:00:00.000Z',
    description: 'Next scheduled backup time',
    nullable: true,
  })
  nextBackupTime: string | null;
}

export class SystemInfoResponseDto {
  @ApiProperty({
    type: SystemInfoDto,
    description: 'System information',
  })
  systemInfo: SystemInfoDto;

  @ApiProperty({
    type: BackupInfoDto,
    description: 'Backup information',
  })
  backupInfo: BackupInfoDto;
}
