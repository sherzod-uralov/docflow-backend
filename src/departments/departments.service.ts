import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AssignUserDto } from './dto/assign-user.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      if (createDepartmentDto.parentId) {
        const parentDepartment = await this.prisma.department.findUnique({
          where: { id: createDepartmentDto.parentId },
        });

        if (!parentDepartment) {
          throw new NotFoundException(
            `Parent department with ID ${createDepartmentDto.parentId} not found`,
          );
        }
      }

      const department = await this.prisma.department.create({
        data: createDepartmentDto,
        include: {
          parent: true,
          children: true,
          users: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      return department;
    } catch (error) {
      this.logger.error(
        `Error creating department: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Department with this name already exists',
        );
      }
      throw new BadRequestException('Failed to create department');
    }
  }

  async findAll() {
    try {
      const departments = await this.prisma.department.findMany({
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          users: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      return departments;
    } catch (error) {
      this.logger.error(
        `Error finding departments: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve departments');
    }
  }

  async findOne(id: number) {
    try {
      const department = await this.prisma.department.findUnique({
        where: { id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          users: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!department) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      return department;
    } catch (error) {
      this.logger.error(
        `Error finding department: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve department');
    }
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    try {
      const existingDepartment = await this.prisma.department.findUnique({
        where: { id },
        include: {
          children: true,
        },
      });

      if (!existingDepartment) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      if (updateDepartmentDto.parentId) {
        if (updateDepartmentDto.parentId === id) {
          throw new BadRequestException('Department cannot be its own parent');
        }

     const isChildDepartment = await this.isChildDepartment(
          id,
          updateDepartmentDto.parentId,
        );
        if (isChildDepartment) {
          throw new BadRequestException(
            'Cannot set a child department as parent (circular reference)',
          );
        }

        const parentDepartment = await this.prisma.department.findUnique({
          where: { id: updateDepartmentDto.parentId },
        });

        if (!parentDepartment) {
          throw new NotFoundException(
            `Parent department with ID ${updateDepartmentDto.parentId} not found`,
          );
        }
      }


      return await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          users: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating department: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Department with this name already exists',
        );
      }
      throw new BadRequestException('Failed to update department');
    }
  }
  private async isChildDepartment(
    parentId: number,
    childId: number,
  ): Promise<boolean> {
    const children = await this.prisma.department.findMany({
      where: { parentId },
      select: { id: true },
    });

    if (children.some((child) => child.id === childId)) {
      return true;
    }

    for (const child of children) {
      const isChild = await this.isChildDepartment(child.id, childId);
      if (isChild) {
        return true;
      }
    }

    return false;
  }

  async remove(id: number) {
    try {
      const existingDepartment = await this.prisma.department.findUnique({
        where: { id },
        include: { users: true },
      });

      if (!existingDepartment) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      // Check if department has users
      if (existingDepartment.users.length > 0) {
        throw new BadRequestException(
          'Cannot delete department with assigned users',
        );
      }

      await this.prisma.department.delete({
        where: { id },
      });

      return { message: `Department with ID ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(
        `Error removing department: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete department');
    }
  }

  async assignUser(departmentId: number, assignUserDto: AssignUserDto) {
    try {
      const { userId } = assignUserDto;

      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentId} not found`,
        );
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }


      return await this.prisma.user.update({
        where: { id: userId },
        data: { departmentId },
        select: {
          id: true,
          username: true,
          email: true,
          department: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error assigning user to department: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign user to department');
    }
  }

  async removeUserFromDepartment(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!user.departmentId) {
        throw new BadRequestException(
          `User with ID ${userId} is not assigned to any department`,
        );
      }

      return await this.prisma.user.update({
        where: { id: userId },
        data: { departmentId: null },
        select: {
          id: true,
          username: true,
          email: true,
          department: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error removing user from department: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to remove user from department');
    }
  }

  async getUsersByDepartment(departmentId: number) {
    try {
      // Check if department exists
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentId} not found`,
        );
      }


      return await this.prisma.user.findMany({
        where: { departmentId },
        select: {
          id: true,
          username: true,
          email: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        `Error getting users by department: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve users by department');
    }
  }

  async getDepartmentHierarchy() {
    try {
      // Get all departments
      const allDepartments = await this.prisma.department.findMany({
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      const departmentMap = new Map();
      allDepartments.forEach((dept) => {
        departmentMap.set(dept.id, { ...dept, children: [] });
      });

      const rootDepartments: any[] = [];
      allDepartments.forEach((dept) => {
        const department = departmentMap.get(dept.id);

        if (dept.parentId === null) {
          rootDepartments.push(department);
        } else {
          const parent = departmentMap.get(dept.parentId);
          if (parent) {
            parent.children.push(department);
          }
        }
      });

      return rootDepartments;
    } catch (error) {
      this.logger.error(
        `Error getting department hierarchy: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve department hierarchy');
    }
  }

  async getDepartmentHierarchyForChart() {
    try {
      // Get the department hierarchy
      const departmentHierarchy = await this.getDepartmentHierarchy();

      // Format the hierarchy for chart visualization
      const formatDepartmentForChart = (department, level = 0) => {
        const userCount = department.users?.length || 0;

        // Create a node for the current department
        const node = {
          id: department.id,
          name: department.name,
          description: department.description,
          userCount,
          level,
          parentId: department.parentId,
          children: [],
        };

        // Process children recursively
        if (department.children && department.children.length > 0) {
          node.children = department.children.map((child) =>
            formatDepartmentForChart(child, level + 1),
          );
        }

        return node;
      };

      // Format all root departments
      const chartData = departmentHierarchy.map((dept) =>
        formatDepartmentForChart(dept),
      );

      // Add additional metadata for the chart
      return {
        chartData,
        totalDepartments: this.countTotalDepartments(chartData),
        maxDepth: this.findMaxDepth(chartData),
        totalUsers: this.countTotalUsers(chartData),
      };
    } catch (error) {
      this.logger.error(
        `Error getting department hierarchy for chart: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to retrieve department hierarchy for chart',
      );
    }
  }

  // Helper method to count total departments in the hierarchy
  private countTotalDepartments(departments: any[]): number {
    let count = departments.length;

    for (const dept of departments) {
      if (dept.children && dept.children.length > 0) {
        count += this.countTotalDepartments(dept.children);
      }
    }

    return count;
  }

  // Helper method to find the maximum depth of the hierarchy
  private findMaxDepth(departments: any[], currentDepth = 1): number {
    if (!departments || departments.length === 0) {
      return currentDepth - 1;
    }

    let maxDepth = currentDepth;

    for (const dept of departments) {
      if (dept.children && dept.children.length > 0) {
        const childDepth = this.findMaxDepth(dept.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }

    return maxDepth;
  }

  // Helper method to count total users in the hierarchy
  private countTotalUsers(departments: any[]): number {
    let count = 0;

    for (const dept of departments) {
      count += dept.userCount || 0;

      if (dept.children && dept.children.length > 0) {
        count += this.countTotalUsers(dept.children);
      }
    }

    return count;
  }

  async getAllDepartmentUsers() {
    try {
      // Get all departments with their users
      const departments = await this.prisma.department.findMany({
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return departments;
    } catch (error) {
      this.logger.error(
        `Error getting all department users: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve all department users');
    }
  }

  async getUsersInDepartmentHierarchy(departmentId: number) {
    try {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentId} not found`,
        );
      }
      const childDepartmentIds =
        await this.getAllChildDepartmentIds(departmentId);
      const allDepartmentIds = [departmentId, ...childDepartmentIds];



      return await this.prisma.user.findMany({
        where: {
          departmentId: {
            in: allDepartmentIds,
          },
        },
        select: {
          id: true,
          username: true,
          email: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error getting users in department hierarchy: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to retrieve users in department hierarchy',
      );
    }
  }

  private async getAllChildDepartmentIds(
    departmentId: number,
  ): Promise<number[]> {
    const childDepartments = await this.prisma.department.findMany({
      where: { parentId: departmentId },
      select: { id: true },
    });

    if (childDepartments.length === 0) {
      return [];
    }

    const childIds = childDepartments.map((dept) => dept.id);

    const nestedChildIds = await Promise.all(
      childIds.map((id) => this.getAllChildDepartmentIds(id)),
    );

    return [...childIds, ...nestedChildIds.flat()];
  }
}
