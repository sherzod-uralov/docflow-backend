import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import { ApprovalStepStatus } from '../../common/enums/approval.enum';

export class UpdateApprovalStatusDto {
  @ApiProperty({
    enum: ApprovalStepStatus,
    example: ApprovalStepStatus.APPROVED,
    description: 'The new status of the approval step',
  })
  @IsEnum(ApprovalStepStatus, {
    message: 'Status must be one of: PENDING, APPROVED, REJECTED, RETURNED',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: ApprovalStepStatus;

  @ApiProperty({
    example: 'Looks good to me!',
    description: 'Optional comment for the approval or rejection',
    required: false,
  })
  @IsString({ message: 'Comment must be a string' })
  @IsOptional()
  comment?: string;

  @ApiProperty({
    example: 'Document is incomplete',
    description: 'Reason for rejection (required if status is REJECTED or RETURNED)',
    required: false,
  })
  @ValidateIf((o) => o.status === ApprovalStepStatus.REJECTED || o.status === ApprovalStepStatus.RETURNED)
  @IsString({ message: 'Rejection reason must be a string' })
  @IsNotEmpty({ message: 'Rejection reason is required when status is REJECTED or RETURNED' })
  rejectionReason?: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the step to return to (required if status is RETURNED)',
    required: false,
  })
  @ValidateIf((o) => o.status === ApprovalStepStatus.RETURNED)
  @IsNumber({}, { message: 'Return to step ID must be a number' })
  @IsNotEmpty({ message: 'Return to step ID is required when status is RETURNED' })
  returnToStepId?: number;
}
