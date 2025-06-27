import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDeadlineNotificationUserDto } from './dto/update-deadline-notification-user.dto';
import { SystemInfoResponseDto, SystemInfoDto, CpuInfo, MemoryInfo, BackupInfoDto } from './dto/system-info.dto';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { promisify } from 'util';
import { CronJob } from 'cron';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private backupInfo: BackupInfoDto;
  private backupDirectory: string;
  private exec = promisify(child_process.exec);
  private backupJob: CronJob;

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Initialize backup info with default values
    this.backupDirectory = process.env.BACKUP_DIRECTORY || path.join(process.cwd(), 'backups');
    this.backupInfo = {
      schedule: 'daily',
      cronExpression: '0 0 * * *', // Every day at midnight
      backupDirectory: this.backupDirectory,
      retentionDays: 7,
      enabled: false,
      lastBackupTime: null,
      nextBackupTime: null,
    };

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDirectory)) {
      try {
        fs.mkdirSync(this.backupDirectory, { recursive: true });
        this.logger.log(`Created backup directory: ${this.backupDirectory}`);
      } catch (error) {
        this.logger.error(`Failed to create backup directory: ${error.message}`, error.stack);
      }
    }
  }

  async getDeadlineNotificationUser() {
    try {
      const setting = await this.prisma.settings.findFirst({
        where: { key: 'deadlineNotificationUser' },
        include: {
          deadlineNotificationUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return setting;
    } catch (error) {
      this.logger.error(
        `Error getting deadline notification user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a setting by key
   * @param key The key of the setting to get
   * @returns The setting or null if not found
   */
  async getSetting(key: string) {
    try {
      const setting = await this.prisma.settings.findFirst({
        where: { key },
      });

      return setting;
    } catch (error) {
      this.logger.error(
        `Error getting setting ${key}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Create or update a setting
   * @param key The key of the setting
   * @param value The value of the setting
   * @param description Optional description of the setting
   * @returns The created or updated setting
   */
  async createOrUpdateSetting(key: string, value: string, description?: string) {
    try {
      // Check if the setting already exists
      const existingSetting = await this.prisma.settings.findFirst({
        where: { key },
      });

      if (existingSetting) {
        // Update existing setting
        return this.prisma.settings.update({
          where: { id: existingSetting.id },
          data: {
            value,
            description: description || existingSetting.description,
          },
        });
      } else {
        // Create new setting
        return this.prisma.settings.create({
          data: {
            key,
            value,
            description,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error creating or updating setting ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateDeadlineNotificationUser(updateDto: UpdateDeadlineNotificationUserDto) {
    try {
      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: updateDto.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${updateDto.userId} not found`);
      }

      // Check if the setting already exists
      const existingSetting = await this.prisma.settings.findFirst({
        where: { key: 'deadlineNotificationUser' },
      });

      if (existingSetting) {
        // Update existing setting
        return this.prisma.settings.update({
          where: { id: existingSetting.id },
          data: {
            deadlineNotificationUserId: updateDto.userId,
          },
          include: {
            deadlineNotificationUser: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        });
      } else {
        // Create new setting
        return this.prisma.settings.create({
          data: {
            key: 'deadlineNotificationUser',
            description: 'User who receives notifications about deadline violations',
            deadlineNotificationUserId: updateDto.userId,
          },
          include: {
            deadlineNotificationUser: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error updating deadline notification user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Initialize the service
   */
  async onModuleInit() {
    try {
      // Load backup configuration from database or environment variables
      await this.loadBackupConfig();

      // Schedule backup job if enabled
      if (this.backupInfo.enabled) {
        this.scheduleBackupJob();
      }
    } catch (error) {
      this.logger.error(`Error initializing settings service: ${error.message}`, error.stack);
    }
  }

  /**
   * Load backup configuration from database or environment variables
   */
  private async loadBackupConfig() {
    try {
      // Try to load from database
      const backupSetting = await this.prisma.settings.findFirst({
        where: { key: 'backupConfig' },
      });

      if (backupSetting && backupSetting.value) {
        try {
          const config = JSON.parse(backupSetting.value);
          this.backupInfo = {
            ...this.backupInfo,
            ...config,
          };
          this.logger.log('Loaded backup configuration from database');
        } catch (parseError) {
          this.logger.error(`Error parsing backup configuration: ${parseError.message}`);
        }
      } else {
        // If not in database, try to load from environment variables
        if (process.env.BACKUP_SCHEDULE) {
          this.backupInfo.schedule = process.env.BACKUP_SCHEDULE;
        }
        if (process.env.BACKUP_CRON) {
          this.backupInfo.cronExpression = process.env.BACKUP_CRON;
        }
        if (process.env.BACKUP_RETENTION_DAYS) {
          this.backupInfo.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS, 10);
        }
        if (process.env.BACKUP_ENABLED === 'true') {
          this.backupInfo.enabled = true;
        }

        // Save to database for future use
        await this.saveBackupConfig();
      }
    } catch (error) {
      this.logger.error(`Error loading backup configuration: ${error.message}`, error.stack);
    }
  }

  /**
   * Save backup configuration to database
   */
  private async saveBackupConfig() {
    try {
      const existingSetting = await this.prisma.settings.findFirst({
        where: { key: 'backupConfig' },
      });

      const configValue = JSON.stringify(this.backupInfo);

      if (existingSetting) {
        await this.prisma.settings.update({
          where: { id: existingSetting.id },
          data: {
            value: configValue,
            description: 'Backup configuration',
          },
        });
      } else {
        await this.prisma.settings.create({
          data: {
            key: 'backupConfig',
            value: configValue,
            description: 'Backup configuration',
          },
        });
      }

      this.logger.log('Saved backup configuration to database');
    } catch (error) {
      this.logger.error(`Error saving backup configuration: ${error.message}`, error.stack);
    }
  }

  /**
   * Schedule a backup job using the configured cron expression
   */
  private scheduleBackupJob() {
    try {
      // Remove existing job if it exists
      try {
        this.schedulerRegistry.deleteCronJob('database-backup');
        this.logger.log('Removed existing backup job');
      } catch (error) {
        // Job doesn't exist, which is fine
      }

      // Create a new job
      const job = new CronJob(this.backupInfo.cronExpression, async () => {
        this.logger.log('Running scheduled database backup');
        const result = await this.createBackup();
        if (result.success) {
          this.logger.log(`Scheduled backup created successfully: ${result.filePath}`);

          // Clean up old backups
          await this.cleanupOldBackups();
        } else {
          this.logger.error(`Scheduled backup failed: ${result.message}`);
        }
      });

      // Add the job to the registry
      // Use type assertion to work around the incompatible CronJob types
      this.schedulerRegistry.addCronJob('database-backup', job as any);

      // Start the job
      job.start();

      // Store the job reference
      this.backupJob = job;

      // Calculate next run time
      const nextRun = job.nextDate().toJSDate();
      this.backupInfo.nextBackupTime = nextRun.toISOString();

      this.logger.log(`Scheduled database backup job with cron expression: ${this.backupInfo.cronExpression}`);
      this.logger.log(`Next backup scheduled for: ${nextRun.toISOString()}`);
    } catch (error) {
      this.logger.error(`Error scheduling backup job: ${error.message}`, error.stack);
    }
  }

  /**
   * Get system information including CPU, memory, and OS details
   */
  async getSystemInfo(): Promise<SystemInfoResponseDto> {
    try {
      const systemInfo = this.collectSystemInfo();
      return {
        systemInfo,
        backupInfo: this.backupInfo,
      };
    } catch (error) {
      this.logger.error(
        `Error getting system information: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Collect system information using the os module
   */
  private collectSystemInfo(): SystemInfoDto {
    // Get CPU information
    const cpus = os.cpus();
    const cpuInfo: CpuInfo = {
      count: cpus.length,
      model: cpus.length > 0 ? cpus[0].model : 'Unknown',
      speed: cpus.length > 0 ? cpus[0].speed : 0,
    };

    // Get memory information
    const totalMemory = Math.round(os.totalmem() / (1024 * 1024)); // Convert to MB
    const freeMemory = Math.round(os.freemem() / (1024 * 1024)); // Convert to MB
    const usedMemory = totalMemory - freeMemory;
    const memoryInfo: MemoryInfo = {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercentage: Math.round((usedMemory / totalMemory) * 100),
    };

    // Get OS information
    const platform = os.platform();
    let osName = os.type();
    let osVersion = os.release();

    // Try to get more detailed OS information on Windows
    if (platform === 'win32') {
      try {
        const windowsRelease = this.getWindowsRelease();
        if (windowsRelease) {
          osName = windowsRelease.name;
          osVersion = windowsRelease.version;
        }
      } catch (error) {
        this.logger.warn(`Failed to get detailed Windows information: ${error.message}`);
      }
    }

    return {
      platform,
      osName,
      osVersion,
      cpu: cpuInfo,
      memory: memoryInfo,
      uptime: Math.round(os.uptime()),
      currentTime: new Date().toISOString(),
    };
  }

  /**
   * Get detailed Windows release information
   */
  private getWindowsRelease(): { name: string; version: string } {
    const release = os.release().split('.');
    const major = parseInt(release[0], 10);

    // Map Windows NT version to Windows name
    const ntToWindows = {
      '6.1': { name: 'Windows 7', version: '6.1' },
      '6.2': { name: 'Windows 8', version: '6.2' },
      '6.3': { name: 'Windows 8.1', version: '6.3' },
      '10.0': { name: 'Windows 10', version: '10.0' },
    };

    const ntVersion = `${major}.${release[1]}`;
    return ntToWindows[ntVersion] || { name: `Windows NT ${ntVersion}`, version: ntVersion };
  }

  /**
   * Create a database backup
   */
  async createBackup(): Promise<{ success: boolean; message: string; filePath?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.sql`;
      const backupFilePath = path.join(this.backupDirectory, backupFileName);

      // Get database connection info from environment variables
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // Parse the database URL to get connection details
      const dbUrlRegex = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
      const matches = dbUrl.match(dbUrlRegex);

      if (!matches) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = matches;

      const pgDumpCmd = `pg_dump -U ${user} -h ${host} -p ${port} -d ${database} -f "${backupFilePath}"`;

      const env = { ...process.env, PGPASSWORD: password };

      await this.exec(pgDumpCmd, { env });


      this.backupInfo.lastBackupTime = new Date().toISOString();

      this.logger.log(`Database backup created successfully: ${backupFilePath}`);

      return {
        success: true,
        message: 'Database backup created successfully',
        filePath: backupFilePath,
      };
    } catch (error) {
      this.logger.error(`Error creating database backup: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to create database backup: ${error.message}`,
      };
    }
  }

  /**
   * Configure backup settings
   */
  async configureBackup(backupConfig: Partial<BackupInfoDto>): Promise<BackupInfoDto> {
    try {
      const previousEnabled = this.backupInfo.enabled;
      const previousCronExpression = this.backupInfo.cronExpression;

      // Update backup configuration
      this.backupInfo = {
        ...this.backupInfo,
        ...backupConfig,
      };

      // If backup directory changed, create it if it doesn't exist
      if (backupConfig.backupDirectory && backupConfig.backupDirectory !== this.backupDirectory) {
        this.backupDirectory = backupConfig.backupDirectory;
        this.backupInfo.backupDirectory = this.backupDirectory;

        if (!fs.existsSync(this.backupDirectory)) {
          fs.mkdirSync(this.backupDirectory, { recursive: true });
          this.logger.log(`Created new backup directory: ${this.backupDirectory}`);
        }
      }

      // Handle scheduling changes
      if (this.backupInfo.enabled) {
        // Backup is enabled
        if (!previousEnabled || 
            (previousCronExpression !== this.backupInfo.cronExpression)) {
          // Either it was disabled before or the cron expression changed
          this.scheduleBackupJob();
          this.logger.log('Rescheduled backup job with new configuration');
        }
      } else if (previousEnabled) {
        // Backup was enabled before but is now disabled
        try {
          this.schedulerRegistry.deleteCronJob('database-backup');
          this.backupInfo.nextBackupTime = null;
          this.logger.log('Disabled backup job');
        } catch (error) {
          this.logger.warn(`Failed to delete backup job: ${error.message}`);
        }
      }

      // Save the updated configuration to the database
      await this.saveBackupConfig();

      return this.backupInfo;
    } catch (error) {
      this.logger.error(`Error configuring backup: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the current backup configuration
   */
  async getBackupConfig(): Promise<BackupInfoDto> {
    return this.backupInfo;
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      if (!this.backupInfo.retentionDays || this.backupInfo.retentionDays <= 0) {
        return {
          success: true,
          message: 'Retention policy is not set or is set to keep all backups',
          deletedCount: 0,
        };
      }

      const files = fs.readdirSync(this.backupDirectory);
      const now = new Date();
      let deletedCount = 0;

      for (const file of files) {
        if (!file.startsWith('backup-') || !file.endsWith('.sql')) {
          continue;
        }

        const filePath = path.join(this.backupDirectory, file);
        const stats = fs.statSync(filePath);
        const fileAge = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24); // Age in days

        if (fileAge > this.backupInfo.retentionDays) {
          fs.unlinkSync(filePath);
          deletedCount++;
          this.logger.log(`Deleted old backup: ${filePath}`);
        }
      }

      return {
        success: true,
        message: `Cleaned up ${deletedCount} old backups`,
        deletedCount,
      };
    } catch (error) {
      this.logger.error(`Error cleaning up old backups: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to clean up old backups: ${error.message}`,
        deletedCount: 0,
      };
    }
  }
}
