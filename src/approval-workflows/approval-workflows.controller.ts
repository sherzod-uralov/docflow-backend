import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalWorkflowsService } from './approval-workflows.service';
import { CreateApprovalWorkflowDto } from './dto/create-approval-workflow.dto';
import { UpdateApprovalStatusDto } from './dto/update-approval-status.dto';
import { MarkStepAsReadDto } from './dto/mark-step-as-read.dto';
import { WorkflowStatisticsDto } from './dto/workflow-statistics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('approval-workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approval-workflows')
export class ApprovalWorkflowsController {
  constructor(private readonly approvalWorkflowsService: ApprovalWorkflowsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new approval workflow' })
  @ApiResponse({
    status: 201,
    description: 'The approval workflow has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have permission to create a workflow for this document.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  create(@Body() createApprovalWorkflowDto: CreateApprovalWorkflowDto, @Request() req) {
    return this.approvalWorkflowsService.create(createApprovalWorkflowDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approval workflows for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all approval workflows where the user is involved.',
  })
  findAll(@Request() req) {
    return this.approvalWorkflowsService.findAll(req.user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending approvals for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all pending approval steps assigned to the current user.',
  })
  getPendingApprovals(@Request() req) {
    return this.approvalWorkflowsService.getPendingApprovals(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an approval workflow by ID' })
  @ApiParam({ name: 'id', description: 'Approval workflow ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the approval workflow with the specified ID.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have permission to view this workflow.',
  })
  @ApiResponse({
    status: 404,
    description: 'Approval workflow not found.',
  })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.approvalWorkflowsService.findOne(id, req.user.id);
  }

  @Patch(':workflowId/steps/:stepId')
  @ApiOperation({ summary: 'Update the status of an approval step' })
  @ApiParam({ name: 'workflowId', description: 'Approval workflow ID' })
  @ApiParam({ name: 'stepId', description: 'Approval step ID' })
  @ApiResponse({
    status: 200,
    description: 'The approval step has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data or step is not in a valid state.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User is not the approver for this step.',
  })
  @ApiResponse({
    status: 404,
    description: 'Approval workflow or step not found.',
  })
  updateStepStatus(
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @Body() updateApprovalStatusDto: UpdateApprovalStatusDto,
    @Request() req,
  ) {
    return this.approvalWorkflowsService.updateStepStatus(
      workflowId,
      stepId,
      updateApprovalStatusDto,
      req.user.id,
    );
  }
}
