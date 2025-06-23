import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsResponseDto, DocumentStatusCount, ApprovalWorkflowStatusCount } from './dto/statistics-response.dto';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFullStatistics(): Promise<StatisticsResponseDto> {
    try {
      const [
        totalUsers,
        totalRoles,
        totalPermissions,
        totalDocuments,
        totalDocumentTypes,
        totalJournals,
        totalApprovalWorkflows,
        totalApprovalSteps,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.role.count(),
        this.prisma.permission.count(),
        this.prisma.document.count(),
        this.prisma.documentType.count(),
        this.prisma.journal.count(),
        this.prisma.approvalWorkflow.count(),
        this.prisma.approvalStep.count(),
      ]);

      const documentStatusCounts: DocumentStatusCount = {
        pending: 0,
        approved: 0,
        rejected: 0,
        returned: 0,
      };

      const approvalWorkflowStatusCounts = await this.getApprovalWorkflowStatusCounts();
      const documentsWithWorkflows = await this.prisma.document.findMany({
        include: {
          approvalWorkflows: {
            select: {
              status: true,
              createdAt: true,
              steps: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      });

      for (const document of documentsWithWorkflows) {
        if (document.approvalWorkflows.length === 0) {
          // Document without any workflows is considered pending
          documentStatusCounts.pending++;
          continue;
        }

        // Check the latest workflow status
        const latestWorkflow = document.approvalWorkflows.reduce((latest, current) => {
          return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
        }, document.approvalWorkflows[0]);

        // A document can only be in one primary status category
        if (latestWorkflow.status === 'COMPLETED') {
          documentStatusCounts.approved++;
        } else if (latestWorkflow.status === 'REJECTED') {
          documentStatusCounts.rejected++;
        } else if (latestWorkflow.status === 'PENDING' || latestWorkflow.status === 'IN_PROGRESS') {
          // Check if any step is returned - this takes precedence over pending status
          const hasReturnedStep = latestWorkflow.steps.some(step => step.status === 'RETURNED');
          if (hasReturnedStep) {
            documentStatusCounts.returned++;
          } else {
            documentStatusCounts.pending++;
          }
        }
      }

      return {
        totalUsers,
        totalRoles,
        totalPermissions,
        totalDocuments,
        totalDocumentTypes,
        totalJournals,
        totalApprovalWorkflows,
        totalApprovalSteps,
        documentStatusCounts,
        approvalWorkflowStatusCounts,
        date: new Date().toISOString().split('T')[0],
      };
    } catch (error) {
      this.logger.error(`Error getting statistics: ${error.message}`, error.stack);
      throw new Error('Failed to retrieve statistics');
    }
  }

  private async getApprovalWorkflowStatusCounts(): Promise<ApprovalWorkflowStatusCount> {
    const pendingCount = await this.prisma.approvalWorkflow.count({
      where: { status: 'PENDING' },
    });

    const inProgressCount = await this.prisma.approvalWorkflow.count({
      where: { status: 'IN_PROGRESS' },
    });

    const completedCount = await this.prisma.approvalWorkflow.count({
      where: { status: 'COMPLETED' },
    });

    const rejectedCount = await this.prisma.approvalWorkflow.count({
      where: { status: 'REJECTED' },
    });

    return {
      pending: pendingCount,
      inProgress: inProgressCount,
      completed: completedCount,
      rejected: rejectedCount,
    };
  }
}
