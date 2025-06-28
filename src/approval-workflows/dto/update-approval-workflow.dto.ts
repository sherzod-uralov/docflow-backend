// approval-workflows/dto/update-approval-workflow.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApprovalType } from '../../common/enums/approval.enum';

export class UpdateApprovalWorkflowDto {
  @ApiProperty({
    required: false,
    description: 'New type of the approval workflow',
    enum: ApprovalType,
  })
  @IsOptional()
  @IsEnum(ApprovalType)
  type?: ApprovalType;

  @ApiProperty({
    required: false,
    description: 'New document of the approval workflow',
  })
  @IsOptional()
  documentId?: ApprovalType;

  @ApiProperty({
    required: false,
    description: 'New deadline for the approval workflow',
  })
  @IsOptional()
  @IsDateString()
  deadline?: Date;
}