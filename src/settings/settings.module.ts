import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemInfoGateway } from './system-info.gateway';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, SystemInfoGateway],
  exports: [SettingsService],
})
export class SettingsModule {}
