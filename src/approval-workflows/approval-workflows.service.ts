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
import { UpdateApprovalWorkflowDto } from './dto/update-approval-workflow.dto';

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
            deadline: createApprovalWorkflowDto.deadline,
          },
        });

        // Create steps
        await prisma.approvalStep.createMany({
          data: steps.map((step) => ({
            workflowId: newWorkflow.id,
            approverId: step.approverId,
            order: step.order,
            status: ApprovalStepStatus.PENDING,
            deadline: step.deadline,
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
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          document: {
            select: {
              id: true,
              title: true,
            },
          },
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

      // Check if user is the approver for this step or a later step in the workflow
      const isApproverForThisStep = step.approverId === userId;
      let isApproverForLaterStep = false;

      if (workflow.type === 'SEQUENTIAL' && !isApproverForThisStep) {
        // For sequential workflows, check if user is an approver for a later step
        const currentUserStep = workflow.steps.find(s => s.approverId === userId);
        if (currentUserStep && currentUserStep.order > step.order) {
          isApproverForLaterStep = true;
        }
      }

      if (!isApproverForThisStep && !isApproverForLaterStep) {
        throw new ForbiddenException('You are not the approver for this step');
      }

      // Check if step is already completed
      // Only direct approvers are restricted from modifying completed steps
      // Later approvers in sequential workflows can modify previous steps
      if (isApproverForThisStep && step.status !== ApprovalStepStatus.PENDING) {
        throw new BadRequestException(
          `This step has already been ${step.status.toLowerCase()}`,
        );
      }

      // For sequential workflows, check if this is the current step
      if (workflow.type === 'SEQUENTIAL' && isApproverForThisStep) {
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
        !updateDto.returnToUserId
      ) {
        throw new BadRequestException(
          'Return to user ID is required when returning a step',
        );
      }

      if (
        updateDto.status === ApprovalStepStatus.RESUBMITTED &&
        (!updateDto.resubmissionExplanation || !updateDto.resubmitToUserId)
      ) {
        throw new BadRequestException(
          'Resubmission explanation and resubmit to user ID are required when resubmitting a step',
        );
      }

      if (updateDto.returnToUserId) {
        // Find the step associated with the return user
        const returnStep = workflow.steps.find(
          (s) => s.approverId === updateDto.returnToUserId,
        );
        if (!returnStep) {
          throw new BadRequestException(
            `Step for user with ID ${updateDto.returnToUserId} not found in workflow`,
          );
        }

        // For sequential workflows, ensure the return step has a lower order
        if (workflow.type === 'SEQUENTIAL') {
          if (returnStep.order >= step.order) {
            throw new BadRequestException(
              'Cannot return to a user with the same or higher order step',
            );
          }
        } else {
          // For parallel workflows, ensure the return step is not the current step
          if (returnStep.id === step.id) {
            throw new BadRequestException(
              'Cannot return to the current user',
            );
          }
        }

        // Verify that the return user is one of the returnable users
        const returnableUsers = await this.getReturnableUsers(workflowId, stepId, userId);
        const isReturnableUser = returnableUsers.some(returnableUser => returnableUser.approverId === updateDto.returnToUserId);

        if (!isReturnableUser) {
          throw new BadRequestException(
            'Can only return to a returnable user in the workflow',
          );
        }
      }

      if (updateDto.resubmitToUserId) {
        // Find the step associated with the resubmit user
        const resubmitStep = workflow.steps.find(
          (s) => s.approverId === updateDto.resubmitToUserId,
        );
        if (!resubmitStep) {
          throw new BadRequestException(
            `Step for user with ID ${updateDto.resubmitToUserId} not found in workflow`,
          );
        }

        // Ensure the resubmit step is not the current step
        if (resubmitStep.id === step.id) {
          throw new BadRequestException(
            'Cannot resubmit to the current user',
          );
        }

        // For sequential workflows, ensure the resubmit step has a higher order than the current step
        if (workflow.type === 'SEQUENTIAL') {
          if (resubmitStep.order <= step.order) {
            throw new BadRequestException(
              'Resubmit step must have a higher order than the current step',
            );
          }
        }
      }

      // Find the step IDs based on user IDs if provided
      let returnToStepId: number | undefined = undefined;
      let nextStepId: number | undefined = undefined;

      if (updateDto.returnToUserId) {
        const returnStep = workflow.steps.find(s => s.approverId === updateDto.returnToUserId);
        if (returnStep) {
          returnToStepId = returnStep.id;
        }
      }

      if (updateDto.resubmitToUserId) {
        const resubmitStep = workflow.steps.find(s => s.approverId === updateDto.resubmitToUserId);
        if (resubmitStep) {
          nextStepId = resubmitStep.id;
        }
      }

      // Update the step status
      const updatedStep = await this.prisma.approvalStep.update({
        where: { id: stepId },
        data: {
          status: updateDto.status,
          comment: updateDto.comment,
          rejectionReason: updateDto.rejectionReason,
          returnToStepId: returnToStepId || null,
          resubmissionExplanation: updateDto.resubmissionExplanation,
          nextStepId: nextStepId || null,
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
        returnToStepId, 
        nextStepId,
        workflow.document?.title,
        updateDto.rejectionReason,
        updateDto.resubmissionExplanation,
        userId
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
    nextStepId?: number,
    documentTitle?: string,
    rejectionReason?: string,
    resubmissionExplanation?: string,
    currentUserId?: number
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
      if (returnToStepId) {
        const returnStep = steps.find((s) => s.id === returnToStepId);
        if (returnStep) {
          await this.prisma.approvalStep.update({
            where: { id: returnToStepId },
            data: { 
              isResubmitted: true,
              status: ApprovalStepStatus.PENDING,
            },
          });

          await this.prisma.approvalStep.updateMany({
            where: {
              workflowId,
              order: { gt: returnStep.order },
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

          // Send notification to the user who is receiving the returned step
          if (documentTitle && rejectionReason) {
            // TODO: Implement notification service
            this.logger.log(
              `Approval step for document "${documentTitle}" is overdue. Approver ${rejectionReason} is late.`,
            );
          }
        }
      }
      return;
    }

    if (stepStatus === ApprovalStepStatus.RESUBMITTED) {
      if (nextStepId) {
        // Update the next step to PENDING
        await this.prisma.approvalStep.update({
          where: { id: nextStepId },
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

        // Send notification to the user who will receive the resubmitted step
        if (documentTitle && resubmissionExplanation) {
          const nextStep = steps.find((s) => s.id === nextStepId);
          if (nextStep) {
            // TODO: Implement notification service
            this.logger.log(
              `Approval step for document "${documentTitle}" is overdue. Approver ${resubmissionExplanation} is late.`,
            );
          }
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
              steps: {
                select: {
                  id: true,
                  order: true,
                  status: true,
                  isResubmitted: true,
                },
                orderBy: {
                  order: 'asc',
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

      const filteredSteps: typeof pendingSteps = [];

      for (const step of pendingSteps) {
        if (step.workflow.type === 'PARALLEL') {
          filteredSteps.push(step);
        } else {
          const currentStep = step.workflow.steps.find(
            s => s.status === ApprovalStepStatus.PENDING
          );

          if (currentStep && currentStep.id === step.id) {
            filteredSteps.push(step);
          }
        }
      }

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

    const currentStep = steps.find(
      (s) => s.status === ApprovalStepStatus.PENDING,
    );

    return !currentStep || currentStep.id === stepId;
  }

  async checkOverdueSteps() {
    try {
      const now = new Date();

      // Get the notification recipient user from settings
      // const notificationSetting = await this.settingsService.getDeadlineNotificationUser();
      // const notificationUser = notificationSetting?.deadlineNotificationUser;
      const notificationUser: { username: string } | null = null; // TODO: Implement settings service

      if (!notificationUser) {
        this.logger.warn('No deadline notification user configured in settings');
      }

      const overdueSteps = await this.prisma.approvalStep.findMany({
        where: {
          status: ApprovalStepStatus.PENDING,
          deadline: {
            lt: now,
          },
          isOverdue: {
            not: true,
          },
        },
        include: {
          workflow: {
            include: {
              document: {
                select: {
                  title: true,
                },
              },
            },
          },
          approver: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      for (const step of overdueSteps) {
        // Mark the step as overdue
        await this.prisma.approvalStep.update({
          where: { id: step.id },
          data: {
            isOverdue: true,
          },
        });

        // Log the overdue step
        this.logger.log(
          `Step ${step.id} for workflow ${step.workflowId} is overdue. Approver: ${step.approver.username}`,
        );

        // Send notification to the configured user
        if (notificationUser) {
          // TODO: Implement notification service
          this.logger.log(
            `Approval step for document "${step.workflow.document.title}" is overdue. Approver ${step.approver.username} is late.`,
          );
        }
      }

      const overdueWorkflows = await this.prisma.approvalWorkflow.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          deadline: {
            lt: now,
          },
        },
        include: {
          document: {
            select: {
              title: true,
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
          },
        },
      });

      for (const workflow of overdueWorkflows) {
        // Log the overdue workflow
        this.logger.log(
          `Workflow ${workflow.id} is overdue. Initiator: ${workflow.initiator.username}`,
        );

        // Send notification to the configured user
        if (notificationUser) {
          // TODO: Implement notification service
          this.logger.log(
            `Approval workflow for document "${workflow.document.title}" is overdue. Initiator ${workflow.initiator.username} is late.`,
          );
        }
      }

      return { overdueSteps, overdueWorkflows };
    } catch (error) {
      this.logger.error(
        `Error checking overdue steps: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to check overdue steps');
    }
  }

  // approval-workflows.service.ts
  async update(
    id: number,
    updateApprovalWorkflowDto: UpdateApprovalWorkflowDto,
    userId: number,
  ) {
    try {
      // First check if workflow exists
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id },
        include: {
          document: {
            select: {
              createdById: true,
            },
          },
        },
      });

      if (!workflow) {
        throw new NotFoundException(`Approval workflow with ID ${id} not found`);
      }

      // Check if user has permission (document owner or workflow initiator)
      const isDocumentOwner = workflow.document.createdById === userId;
      const isInitiator = workflow.initiatedBy === userId;

      // if (!isDocumentOwner && !isInitiator) {
      //   throw new ForbiddenException(
      //     'You do not have permission to update this approval workflow',
      //   );
      // }

      // Check if workflow is in a state that can be updated
      if (!['PENDING', 'IN_PROGRESS'].includes(workflow.status)) {
        throw new BadRequestException(
          'Only PENDING or IN_PROGRESS workflows can be updated',
        );
      }

      // Update the workflow
      const updatedWorkflow = await this.prisma.approvalWorkflow.update({
        where: { id },
        data: {
          documentId: Number(updateApprovalWorkflowDto.documentId)
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
      });

      return updatedWorkflow;
    } catch (error) {
      this.logger.error(
        `Error updating approval workflow: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update approval workflow');
    }
  }

  /**
   * Get users who can receive a return from current step
   */
  async getReturnableUsers(
    workflowId: number,
    stepId: number,
    userId: number,
  ) {
    try {
      // Get the workflow with steps
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: {
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

      // Check if user is the approver for this step or a later step in the workflow
      const isApproverForThisStep = step.approverId === userId;
      let isApproverForLaterStep = false;

      if (workflow.type === 'SEQUENTIAL' && !isApproverForThisStep) {
        // For sequential workflows, check if user is an approver for a later step
        const currentUserStep = workflow.steps.find(s => s.approverId === userId);
        if (currentUserStep && currentUserStep.order > step.order) {
          isApproverForLaterStep = true;
        }
      }

      if (!isApproverForThisStep && !isApproverForLaterStep) {
        throw new ForbiddenException('You are not the approver for this step');
      }

      // For sequential workflows, get all previous steps
      if (workflow.type === 'SEQUENTIAL') {
        // Get all steps with order less than the current step's order
        const previousSteps = workflow.steps.filter((s) => s.order < step.order);

        // Return the approvers of these steps
        return previousSteps.map((s) => ({
          id: s.id,
          approverId: s.approverId,
          approver: s.approver,
          order: s.order,
        }));
      } else {
        // For parallel workflows, return all other approvers
        const otherSteps = workflow.steps.filter((s) => s.id !== stepId);

        return otherSteps.map((s) => ({
          id: s.id,
          approverId: s.approverId,
          approver: s.approver,
          order: s.order,
        }));
      }
    } catch (error) {
      this.logger.error(
        `Error getting previous users: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to get previous users');
    }
  }
  /**
   * Get the user who returned this step (for resubmission)
   */
  async getResubmissionTarget(
    workflowId: number,
    stepId: number,
    userId: number,
  ) {
    try {
      // Get the workflow with steps
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: {
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
          },
        },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Approval workflow with ID ${workflowId} not found`,
        );
      }

      const step = workflow.steps.find((s) => s.id === stepId);
      if (!step) {
        throw new NotFoundException(
          `Approval step with ID ${stepId} not found in workflow ${workflowId}`,
        );
      }

      if (step.approverId !== userId) {
        throw new ForbiddenException('You are not the approver for this step');
      }
      if (step.status !== ApprovalStepStatus.RETURNED) {
        throw new NotFoundException('This step was not returned');
      }

      const returnedByStep = workflow.steps.find((s) => s.returnToStepId === step.id);
      if (!returnedByStep) {
        throw new NotFoundException('Could not determine who returned this step');
      }

      return {
        id: returnedByStep.approverId,
        username: returnedByStep.approver.username,
        email: returnedByStep.approver.email,
      };
    } catch (error) {
      this.logger.error(
        `Error getting resubmission target: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to get resubmission target');
    }
  }

  async getReturnHistory(
    workflowId: number,
    userId: number,
  ) {
    try {
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: {
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
          },
        },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Approval workflow with ID ${workflowId} not found`,
        );
      }

      const isInvolved = workflow.steps.some((s) => s.approverId === userId);
      if (!isInvolved) {
        throw new ForbiddenException('You are not involved in this workflow');
      }

      const returnHistory = workflow.steps
        .filter((s) => 
          s.status === ApprovalStepStatus.RETURNED || 
          s.status === ApprovalStepStatus.RESUBMITTED
        )
        .map((s) => ({
          stepId: s.id,
          status: s.status,
          approver: s.approver,
          returnedAt: s.completedAt,
          returnReason: s.rejectionReason,
          resubmissionExplanation: s.resubmissionExplanation,
          returnToStepId: s.returnToStepId,
          returnToUser: s.returnToStepId ? workflow.steps.find(rs => rs.id === s.returnToStepId)?.approver : null,
          nextStepId: s.nextStepId,
          resubmitToUser: s.nextStepId ? workflow.steps.find(ns => ns.id === s.nextStepId)?.approver : null,
        }));

      return returnHistory;
    } catch (error) {
      this.logger.error(
        `Error getting return history: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to get return history');
    }
  }

  /**
   * Get all steps returned to current user that need resubmission
   */
  async getReturnedSteps(userId: number) {
    try {
      // Get all steps assigned to this user that have been returned
      const returnedSteps = await this.prisma.approvalStep.findMany({
        where: {
          approverId: userId,
          status: ApprovalStepStatus.PENDING,
          isResubmitted: true,
        },
        include: {
          workflow: {
            include: {
              document: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          approver: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return returnedSteps.map((step) => ({
        stepId: step.id,
        workflowId: step.workflowId,
        document: step['workflow']?.['document'],
        returnedAt: step.completedAt,
        returnReason: step.rejectionReason,
        status: step.status,
        approver: step['approver'],
      }));
    } catch (error) {
      this.logger.error(
        `Error getting returned steps: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to get returned steps');
    }
  }
}
