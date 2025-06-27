import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepartmentsService } from '../departments/departments.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class DocumentAccessService {
  private readonly logger = new Logger(DocumentAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly departmentsService: DepartmentsService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Assigns document access permissions to department supervisors
   * @param documentId The ID of the document
   * @param initiatorId The ID of the user who initiated the document workflow
   */
  async assignDepartmentSupervisorAccess(
    documentId: number,
    initiatorId: number,
  ): Promise<void> {
    try {
      // Check if automatic assignment is enabled
      const autoAssignSetting = await this.settingsService.getSetting('AUTO_ASSIGN_DEPARTMENT_SUPERVISOR_ACCESS');
      const autoAssignEnabled = autoAssignSetting?.value === 'true';

      if (!autoAssignEnabled) {
        this.logger.log('Automatic department supervisor access assignment is disabled');
        return;
      }

      // Get the initiator's department
      const initiator = await this.prisma.user.findUnique({
        where: { id: initiatorId },
        include: { department: true },
      });

      if (!initiator || !initiator.departmentId) {
        this.logger.warn(
          `User ${initiatorId} does not have a department assigned`,
        );
        return;
      }

      // Get the department hierarchy
      const departmentHierarchy = await this.getDepartmentHierarchy(
        initiator.departmentId,
      );

      // Assign permissions to users in parent departments
      for (const departmentId of departmentHierarchy) {
        await this.assignPermissionsToUsersInDepartment(
          documentId,
          departmentId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error assigning department supervisor access: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Gets the department hierarchy (parent departments) for a given department
   * @param departmentId The ID of the department
   * @returns An array of department IDs, starting from the given department and going up the hierarchy
   */
  private async getDepartmentHierarchy(
    departmentId: number,
  ): Promise<number[]> {
    const departmentIds: number[] = [departmentId];
    let currentDepartmentId = departmentId;

    while (true) {
      const department = await this.prisma.department.findUnique({
        where: { id: currentDepartmentId },
        select: { parentId: true },
      });

      if (!department || !department.parentId) {
        break;
      }

      departmentIds.push(department.parentId);
      currentDepartmentId = department.parentId;
    }

    return departmentIds;
  }

  /**
   * Assigns document access permissions to users in a department
   * @param documentId The ID of the document
   * @param departmentId The ID of the department
   */
  private async assignPermissionsToUsersInDepartment(
    documentId: number,
    departmentId: number,
  ): Promise<void> {
    // Get all users in the department
    const users = await this.prisma.user.findMany({
      where: { departmentId },
    });

    // Find the document:read permission
    const readPermission = await this.prisma.permission.findFirst({
      where: { key: 'documents:read' },
    });

    // Find the document:update permission
    const updatePermission = await this.prisma.permission.findFirst({
      where: { key: 'documents:update' },
    });

    if (!readPermission || !updatePermission) {
      this.logger.warn('Document permissions not found');
      return;
    }

    // Assign permissions to each user
    for (const user of users) {
      // Assign read permission
      await this.prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: user.id,
            permissionId: readPermission.id,
          },
        },
        update: {
          resourceType: 'document',
          resourceId: documentId.toString(),
        },
        create: {
          userId: user.id,
          permissionId: readPermission.id,
          resourceType: 'document',
          resourceId: documentId.toString(),
        },
      });

      // Assign update permission
      await this.prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: user.id,
            permissionId: updatePermission.id,
          },
        },
        update: {
          resourceType: 'document',
          resourceId: documentId.toString(),
        },
        create: {
          userId: user.id,
          permissionId: updatePermission.id,
          resourceType: 'document',
          resourceId: documentId.toString(),
        },
      });
    }
  }
}
