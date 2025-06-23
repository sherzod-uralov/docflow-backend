import { ApiProperty } from '@nestjs/swagger';

export class WorkflowStatusCount {
  @ApiProperty({ example: 5, description: 'Number of pending approval workflows' })
  pending: number;

  @ApiProperty({ example: 3, description: 'Number of in progress approval workflows' })
  inProgress: number;

  @ApiProperty({ example: 10, description: 'Number of completed approval workflows' })
  completed: number;

  @ApiProperty({ example: 2, description: 'Number of rejected approval workflows' })
  rejected: number;
}

export class WorkflowTypeCount {
  @ApiProperty({ example: 10, description: 'Number of sequential workflows' })
  sequential: number;

  @ApiProperty({ example: 5, description: 'Number of parallel workflows' })
  parallel: number;

  @ApiProperty({ example: 8, description: 'Number of agreement workflows' })
  agreement: number;

  @ApiProperty({ example: 3, description: 'Number of signature workflows' })
  signature: number;
}

export class StepStatusCount {
  @ApiProperty({ example: 15, description: 'Number of pending approval steps' })
  pending: number;

  @ApiProperty({ example: 25, description: 'Number of approved approval steps' })
  approved: number;

  @ApiProperty({ example: 5, description: 'Number of rejected approval steps' })
  rejected: number;

  @ApiProperty({ example: 2, description: 'Number of returned approval steps' })
  returned: number;
}

export class ReadStatusCount {
  @ApiProperty({ example: 20, description: 'Number of read approval steps' })
  read: number;

  @ApiProperty({ example: 10, description: 'Number of unread approval steps' })
  unread: number;
}

export class WorkflowStatisticsDto {
  @ApiProperty({ example: 30, description: 'Total number of approval workflows' })
  totalWorkflows: number;

  @ApiProperty({ example: 50, description: 'Total number of approval steps' })
  totalSteps: number;

  @ApiProperty({ type: WorkflowStatusCount, description: 'Workflow status counts' })
  statusCounts: WorkflowStatusCount;

  @ApiProperty({ type: WorkflowTypeCount, description: 'Workflow type counts' })
  typeCounts: WorkflowTypeCount;

  @ApiProperty({ type: StepStatusCount, description: 'Step status counts' })
  stepStatusCounts: StepStatusCount;

  @ApiProperty({ type: ReadStatusCount, description: 'Read status counts' })
  readStatusCounts: ReadStatusCount;

  @ApiProperty({ example: '2023-06-21', description: 'Date of the statistics' })
  date: string;
}