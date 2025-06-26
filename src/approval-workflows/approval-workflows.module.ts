import { Module } from '@nestjs/common';
import { ApprovalWorkflowsController } from './approval-workflows.controller';
import { ApprovalWorkflowsService } from './approval-workflows.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentAccessModule } from '../document-access/document-access.module';

@Module({
  imports: [PrismaModule, SettingsModule, NotificationsModule, DocumentAccessModule],
  controllers: [ApprovalWorkflowsController],
  providers: [ApprovalWorkflowsService],
  exports: [ApprovalWorkflowsService],
})
export class ApprovalWorkflowsModule {}
