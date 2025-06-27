import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateDeadlineNotificationUserDto } from './dto/update-deadline-notification-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SystemInfoResponseDto, BackupInfoDto } from './dto/system-info.dto';
import { CreateBackupConfigDto } from './dto/create-backup-config.dto';
import { CreateOrUpdateSettingDto } from './dto/create-or-update-setting.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings') 
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('deadline-notification-user')
  @ApiOperation({ summary: 'Get the user who receives deadline notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user who receives deadline notifications.',
  })
  getDeadlineNotificationUser() {
    return this.settingsService.getDeadlineNotificationUser();
  }

  @Patch('deadline-notification-user')
  @ApiOperation({ summary: 'Update the user who receives deadline notifications' })
  @ApiResponse({
    status: 200,
    description: 'The user who receives deadline notifications has been updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  updateDeadlineNotificationUser(
    @Body() updateDto: UpdateDeadlineNotificationUserDto,
  ) {
    return this.settingsService.updateDeadlineNotificationUser(updateDto);
  }

  @Get('system-info')
  @ApiOperation({ 
    summary: 'Get system information including CPU, memory, and OS details',
    description: 'Returns current system information. For real-time updates, connect to the WebSocket endpoint: /system-info'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns system information and backup configuration.',
    type: SystemInfoResponseDto,
  })
  getSystemInfo() {
    return this.settingsService.getSystemInfo();
  }

  @Post('backup/create')
  @ApiOperation({ summary: 'Create a database backup' })
  @ApiResponse({
    status: 200,
    description: 'Database backup created successfully.',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to create database backup.',
  })
  createBackup() {
    return this.settingsService.createBackup();
  }

  @Post('backup/configure')
  @ApiOperation({ summary: 'Create a new backup configuration' })
  @ApiResponse({
    status: 201,
    description: 'Backup configuration created successfully.',
    type: BackupInfoDto,
  })
  createBackupConfig(@Body() createBackupConfigDto: CreateBackupConfigDto) {
    return this.settingsService.configureBackup(createBackupConfigDto);
  }

  @Patch('backup/configure')
  @ApiOperation({ summary: 'Update backup settings' })
  @ApiResponse({
    status: 200,
    description: 'Backup settings updated successfully.',
    type: BackupInfoDto,
  })
  updateBackupConfig(@Body() backupConfig: Partial<BackupInfoDto>) {
    return this.settingsService.configureBackup(backupConfig);
  }

  @Get('backup/configure')
  @ApiOperation({ summary: 'Get the current backup configuration' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current backup configuration.',
    type: BackupInfoDto,
  })
  getBackupConfig() {
    return this.settingsService.getBackupConfig();
  }

  @Post('backup/cleanup')
  @ApiOperation({ summary: 'Clean up old backups based on retention policy' })
  @ApiResponse({
    status: 200,
    description: 'Old backups cleaned up successfully.',
  })
  cleanupOldBackups() {
    return this.settingsService.cleanupOldBackups();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key' })
  @ApiResponse({
    status: 200,
    description: 'Returns the setting with the specified key.',
  })
  @ApiResponse({
    status: 404,
    description: 'Setting not found.',
  })
  getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Create or update a setting' })
  @ApiResponse({
    status: 200,
    description: 'The setting has been successfully created or updated.',
  })
  createOrUpdateSetting(
    @Param('key') key: string,
    @Body() data: { value: string; description?: string },
  ) {
    return this.settingsService.createOrUpdateSetting(
      key,
      data.value,
      data.description,
    );
  }
}
