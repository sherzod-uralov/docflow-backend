import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description, permissionIds } = createRoleDto;

    // Check if role with the same name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name ${name} already exists`);
    }

    // Check if all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Create role with permissions
    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permission: {
              connect: {
                id: permissionId,
              },
            },
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Transform the response to a more readable format
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Transform the response to a more readable format
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Transform the response to a more readable format
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const { name, description, permissionIds } = updateRoleDto;

    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if name is unique if it's being updated
    if (name && name !== existingRole.name) {
      const roleWithSameName = await this.prisma.role.findUnique({
        where: { name },
      });

      if (roleWithSameName) {
        throw new ConflictException(`Role with name ${name} already exists`);
      }
    }

    // Check if all permissions exist if permissionIds is provided
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: {
          id: {
            in: permissionIds,
          },
        },
      });

      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('One or more permissions not found');
      }
    }

    // Update role
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Start a transaction to update role and permissions
    const role = await this.prisma.$transaction(async (prisma) => {
      // Update role basic info
      const updatedRole = await prisma.role.update({
        where: { id },
        data: updateData,
      });

      // Update permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        // Delete existing role-permission relationships
        await prisma.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Create new role-permission relationships
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      // Return updated role with permissions
      return prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    // Check if role is null
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found after update`);
    }

    // Transform the response to a more readable format
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async remove(id: number) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if role is assigned to any users
    const usersWithRole = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(
        `Cannot delete role with ID ${id} because it is assigned to ${usersWithRole} users`,
      );
    }

    // Delete role
    await this.prisma.role.delete({
      where: { id },
    });

    return { message: `Role with ID ${id} has been deleted` };
  }
}
