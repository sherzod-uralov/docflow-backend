import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min, IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalType } from '../../common/enums/approval.enum';

export class ApprovalStepDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the user who will approve this step',
  })
  @IsNumber({}, { message: 'Approver ID must be a number' })
  @IsNotEmpty({ message: 'Approver ID is required' })
  approverId: number;

  @ApiProperty({
    example: 1,
    description: 'The order of the step (1 for parallel workflows, sequential number for sequential workflows)',
  })
  @IsNumber({}, { message: 'Order must be a number' })
  @Min(1, { message: 'Order must be at least 1' })
  @IsNotEmpty({ message: 'Order is required' })
  order: number;

  @ApiProperty({ 
    example: '2023-12-31T23:59:59Z',
    description: 'Optional deadline for this specific step',
    required: false,
  })
  @IsOptional()
  deadline?: Date;
}

export class CreateApprovalWorkflowDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the document to be approved',
  })
  @IsNumber({}, { message: 'Document ID must be a number' })
  @IsNotEmpty({ message: 'Document ID is required' })
  documentId: number;

  @ApiProperty({
    enum: ApprovalType,
    example: ApprovalType.SEQUENTIAL,
    description: 'The type of approval workflow (SEQUENTIAL or PARALLEL)',
  })
  @IsEnum(ApprovalType, { message: 'Type must be either SEQUENTIAL or PARALLEL' })
  @IsNotEmpty({ message: 'Type is required' })
  type: ApprovalType;

  @ApiProperty({
    example: '2023-12-31T23:59:59Z',
    description: 'Optional deadline for the entire workflow',
    required: false,
  })
  @IsOptional()
  deadline?: Date;

  @ApiProperty({
    type: [ApprovalStepDto],
    description: 'The approval steps',
  })
  @IsArray({ message: 'Steps must be an array' })
  @ArrayMinSize(1, { message: 'At least one approval step is required' })
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  @IsNotEmpty({ message: 'Steps are required' })
  steps: ApprovalStepDto[];
}
