import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApprovalWorkflowDto } from './dto/create-approval-workflow.dto';
import { UpdateApprovalStatusDto } from './dto/update-approval-status.dto';
import { ApprovalStepStatus, ApprovalType } from '../common/enums/approval.enum';

@Injectable()
export class ApprovalWorkflowsService {
  private readonly logger = new Logger(ApprovalWorkflowsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    createApprovalWorkflowDto: CreateApprovalWorkflowDto,
    userId: number,
  ) {
    const { documentId, type, steps } = createApprovalWorkflowDto;

    try {

      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID ${documentId} not found`);
      }
     if (document.createdById !== userId) {
         throw new ForbiddenException(
          'You do not have permission to create an approval workflow for this document',
        );
      }
      const existingWorkflow = await this.prisma.approvalWorkflow.findFirst({
        where: {
          documentId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },//asdasd
      });

      if (existingWorkflow) {
        throw new BadRequestException(
          `There is already an active approval workflow for document with ID ${documentId}`,
        );
      }

      if (type === ApprovalType.SEQUENTIAL) {
        const orders = steps.map((step) => step.order).sort((a, b) => a - b);
        const expectedOrders = Array.from(
          { length: orders.length },
          (_, i) => i + 1,
        );

        if (!this.arraysEqual(orders, expectedOrders)) {
          throw new BadRequestException(
            'For sequential workflows, step orders must be sequential starting from 1',
          );
        }
      } else {
        if (!steps.every((step) => step.order === 1)) {
          throw new BadRequestException(
            'For parallel workflows, all step orders must be 1',
          );
        }
      }

      const approverIds = steps.map((step) => step.approverId);
      const approvers = await this.prisma.user.findMany({
        where: { id: { in: approverIds } },
        select: { id: true },
      });

      if (approvers.length !== approverIds.length) {
        throw new BadRequestException('One or more approvers do not exist');
      }

      const workflow = await this.prisma.$transaction(async (prisma) => {
        const newWorkflow = await prisma.approvalWorkflow.create({
          data: {
            documentId,
            type,
            status: 'PENDING',
            initiatedBy: userId,
          },
        });

        // Create steps
        await prisma.approvalStep.createMany({
          data: steps.map((step) => ({
            workflowId: newWorkflow.id,
            approverId: step.approverId,
            order: step.order,
            status: ApprovalStepStatus.PENDING,
          })),
        });

        // Return workflow with steps
        return prisma.approvalWorkflow.findUnique({
          where: { id: newWorkflow.id },
          include: {
            document: {
              select: {
                id: true,
                title: true,
                fileUrl: true,
              },
            },
            initiator: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            steps: {
              include: {
                approver: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        });
      });
      if (type === ApprovalType.SEQUENTIAL && workflow) {
        await this.prisma.approvalWorkflow.update({
          where: { id: workflow.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return workflow;
    } catch (error) {
      this.logger.error(
        `Error creating approval workflow: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create approval workflow');
    }
  }

  async findAll(userId: number) {
    try {
      // Get workflows where the user is either the initiator or an approver
      const workflows = await this.prisma.approvalWorkflow.findMany({
        where: {
          OR: [
            { initiatedBy: userId },
            { steps: { some: { approverId: userId } } },
          ],
        },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
            },
          },
          initiator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          steps: {
            include: {
              approver: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return workflows;
    } catch (error) {
      this.logger.error(
        `Error finding approval workflows: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve approval workflows');
    }
  }

  async findOne(id: number, userId: number) {
    try {
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              createdById: true,
            },
          },
          initiator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          steps: {
            include: {
              approver: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Approval workflow with ID ${id} not found`,
        );
      }

      // Check if user has permission to view this workflow
      const isInitiator = workflow.initiatedBy === userId;
      const isApprover = workflow.steps.some(
        (step) => step.approverId === userId,
      );
      const isDocumentOwner = workflow.document.createdById === userId;

      if (!isInitiator && !isApprover && !isDocumentOwner) {
        throw new ForbiddenException(
          'You do not have permission to view this approval workflow',
        );
      }

      return workflow;
    } catch (error) {
      this.logger.error(
        `Error finding approval workflow: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve approval workflow');
    }
  }

  async updateStepStatus(
    workflowId: number,
    stepId: number,
    updateDto: UpdateApprovalStatusDto,
    userId: number,
  ) {
    try {
      // Get the workflow with steps
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Approval workflow with ID ${workflowId} not found`,
        );
      }

      // Get the step
      const step = workflow.steps.find((s) => s.id === stepId);
      if (!step) {
        throw new NotFoundException(
          `Approval step with ID ${stepId} not found in workflow ${workflowId}`,
        );
      }

      // Check if user is the approver for this step
      if (step.approverId !== userId) {
        throw new ForbiddenException('You are not the approver for this step');
      }

      // Check if step is already completed
      if (step.status !== ApprovalStepStatus.PENDING) {
        throw new BadRequestException(
          `This step has already been ${step.status.toLowerCase()}`,
        );
      }

      // For sequential workflows, check if this is the current step
      if (workflow.type === 'SEQUENTIAL') {
        const currentStep = workflow.steps.find(
          (s) => s.status === ApprovalStepStatus.PENDING,
        );
        if (currentStep && currentStep.id !== stepId) {
          throw new BadRequestException(
            'This step is not currently active in the sequential workflow',
          );
        }
      }

      // Validate the update data
      if (
        updateDto.status === ApprovalStepStatus.REJECTED &&
        !updateDto.rejectionReason
      ) {
        throw new BadRequestException(
          'Rejection reason is required when rejecting a step',
        );
      }

      if (
        updateDto.status === ApprovalStepStatus.RETURNED &&
        !updateDto.returnToStepId
      ) {
        throw new BadRequestException(
          'Return to step ID is required when returning a step',
        );
      }

      if (updateDto.returnToStepId) {
        const returnStep = workflow.steps.find(
          (s) => s.id === updateDto.returnToStepId,
        );
        if (!returnStep) {
          throw new BadRequestException(
            `Return step with ID ${updateDto.returnToStepId} not found in workflow`,
          );
        }
        if (returnStep.order >= step.order) {
          throw new BadRequestException(
            'Cannot return to a step with the same or higher order',
          );
        }
      }

      // Update the step status
      const updatedStep = await this.prisma.approvalStep.update({
        where: { id: stepId },
        data: {
          status: updateDto.status,
          comment: updateDto.comment,
          rejectionReason: updateDto.rejectionReason,
          returnToStepId: updateDto.returnToStepId,
          completedAt: new Date(),
        },
        include: {
          approver: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Handle workflow status updates based on step status
      await this.updateWorkflowStatus(
        workflowId,
        updateDto.status,
        workflow.type === 'SEQUENTIAL' ? ApprovalType.SEQUENTIAL : ApprovalType.PARALLEL,
        step.order,
        updateDto.returnToStepId,
      );

      return updatedStep;
    } catch (error) {
      this.logger.error(
        `Error updating approval step: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update approval step');
    }
  }

  private async updateWorkflowStatus(
    workflowId: number,
    stepStatus: ApprovalStepStatus,
    workflowType: ApprovalType,
    currentStepOrder: number,
    returnToStepId?: number,
  ) {
    // Get all steps for this workflow
    const steps = await this.prisma.approvalStep.findMany({
      where: { workflowId },
      orderBy: { order: 'asc' },
    });

    // Handle different step statuses
    if (stepStatus === ApprovalStepStatus.REJECTED) {
      // If any step is rejected, mark the workflow as rejected
      await this.prisma.approvalWorkflow.update({
        where: { id: workflowId },
        data: { status: 'REJECTED' },
      });
      return;
    }

    if (stepStatus === ApprovalStepStatus.RETURNED) {
      // If a step is returned, reset the workflow to the returned step
      if (returnToStepId) {
        const returnStep = steps.find((s) => s.id === returnToStepId);
        if (returnStep) {
          // Reset all steps after the return step to PENDING
          await this.prisma.approvalStep.updateMany({
            where: {
              workflowId,
              order: { gte: returnStep.order },
            },
            data: {
              status: ApprovalStepStatus.PENDING,
              comment: null,
              rejectionReason: null,
              returnToStepId: null,
              completedAt: null,
            },
          });

          // Update workflow status to IN_PROGRESS
          await this.prisma.approvalWorkflow.update({
            where: { id: workflowId },
            data: { status: 'IN_PROGRESS' },
          });
        }
      }
      return;
    }

    if (stepStatus === ApprovalStepStatus.APPROVED) {
      if (workflowType === ApprovalType.SEQUENTIAL) {
        // For sequential workflows, check if this was the last step
        const nextStep = steps.find((s) => s.order === currentStepOrder + 1);

        if (!nextStep) {
          // This was the last step, mark workflow as completed
          await this.prisma.approvalWorkflow.update({
            where: { id: workflowId },
            data: { status: 'COMPLETED' },
          });
        }
      } else {
        // For parallel workflows, check if all steps are approved
        const allApproved = steps.every(
          (s) => s.status === ApprovalStepStatus.APPROVED,
        );

        if (allApproved) {
          // All steps are approved, mark workflow as completed
          await this.prisma.approvalWorkflow.update({
            where: { id: workflowId },
            data: { status: 'COMPLETED' },
          });
        }
      }
    }
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  async getPendingApprovals(userId: number) {
    try {
      // Get steps that are pending and assigned to this user
      const pendingSteps = await this.prisma.approvalStep.findMany({
        where: {
          approverId: userId,
          status: ApprovalStepStatus.PENDING,
          workflow: {
            status: 'IN_PROGRESS',
          },
        },
        include: {
          workflow: {
            include: {
              document: {
                select: {
                  id: true,
                  title: true,
                  fileUrl: true,
                },
              },
              initiator: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          workflow: {
            createdAt: 'desc',
          },
        },
      });

      // For sequential workflows, filter out steps that are not the current step
      const filteredSteps = pendingSteps.filter((step) => {
        if (step.workflow.type === 'PARALLEL') {
          return true; // Include all parallel workflow steps
        }

        // For sequential workflows, check if this is the current step
        return this.isCurrentStep(step.id, step.workflowId);
      });

      return filteredSteps;
    } catch (error) {
      this.logger.error(
        `Error getting pending approvals: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve pending approvals');
    }
  }

  private async isCurrentStep(
    stepId: number,
    workflowId: number,
  ): Promise<boolean> {
    const steps = await this.prisma.approvalStep.findMany({
      where: { workflowId },
      orderBy: { order: 'asc' },
    });

    // Find the first pending step
    const currentStep = steps.find(
      (s) => s.status === ApprovalStepStatus.PENDING,
    );

    // If there's no pending step or this is the current step, return true
    return !currentStep || currentStep.id === stepId;
  }
}
