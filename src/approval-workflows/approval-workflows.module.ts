import { Module } from '@nestjs/common';
import { ApprovalWorkflowsController } from './approval-workflows.controller';
import { ApprovalWorkflowsService } from './approval-workflows.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApprovalWorkflowsController],
  providers: [ApprovalWorkflowsService],
  exports: [ApprovalWorkflowsService],
})
export class ApprovalWorkflowsModule {}
