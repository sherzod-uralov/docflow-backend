import { ApiProperty } from '@nestjs/swagger';

export class DocumentStatusCount {
  @ApiProperty({ example: 5, description: 'Number of pending documents' })
  pending: number;

  @ApiProperty({ example: 10, description: 'Number of approved documents' })
  approved: number;

  @ApiProperty({ example: 2, description: 'Number of rejected documents' })
  rejected: number;

  @ApiProperty({ example: 1, description: 'Number of returned documents' })
  returned: number;
}

export class ApprovalWorkflowStatusCount {
  @ApiProperty({ example: 5, description: 'Number of pending approval workflows' })
  pending: number;

  @ApiProperty({ example: 3, description: 'Number of in progress approval workflows' })
  inProgress: number;

  @ApiProperty({ example: 10, description: 'Number of completed approval workflows' })
  completed: number;

  @ApiProperty({ example: 2, description: 'Number of rejected approval workflows' })
  rejected: number;
}

export class StatisticsResponseDto {
  @ApiProperty({ example: 50, description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ example: 5, description: 'Total number of roles' })
  totalRoles: number;

  @ApiProperty({ example: 20, description: 'Total number of permissions' })
  totalPermissions: number;

  @ApiProperty({ example: 100, description: 'Total number of documents' })
  totalDocuments: number;

  @ApiProperty({ example: 8, description: 'Total number of document types' })
  totalDocumentTypes: number;

  @ApiProperty({ example: 5, description: 'Total number of journals' })
  totalJournals: number;

  @ApiProperty({ example: 80, description: 'Total number of approval workflows' })
  totalApprovalWorkflows: number;

  @ApiProperty({ type: DocumentStatusCount, description: 'Document status counts' })
  documentStatusCounts: DocumentStatusCount;

  @ApiProperty({ type: ApprovalWorkflowStatusCount, description: 'Approval workflow status counts' })
  approvalWorkflowStatusCounts: ApprovalWorkflowStatusCount;

  @ApiProperty({ example: 150, description: 'Total number of approval steps' })
  totalApprovalSteps: number;

  @ApiProperty({ example: '2023-06-21', description: 'Date of the statistics' })
  date: string;
}