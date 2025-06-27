import { Module } from '@nestjs/common';
import { DocumentAccessService } from './document-access.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DepartmentsModule } from '../departments/departments.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, DepartmentsModule, SettingsModule],
  providers: [DocumentAccessService],
  exports: [DocumentAccessService],
})
export class DocumentAccessModule {}
