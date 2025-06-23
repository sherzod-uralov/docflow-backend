import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { name, description, key, module } = createPermissionDto;

    // Check if permission with the same name or key already exists
    const existingPermission = await this.prisma.permission.findFirst({
      where: {
        OR: [{ name }, { key }],
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        existingPermission.name === name
          ? `Permission with name ${name} already exists`
          : `Permission with key ${key} already exists`,
      );
    }

    // Create permission
    const permission = await this.prisma.permission.create({
      data: {
        name,
        description,
        key,
        module,
      },
    });

    return permission;
  }

  async findAll() {
    return this.prisma.permission.findMany();
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const { name, key } = updatePermissionDto;

    // Check if permission exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if name is unique if it's being updated
    if (name && name !== existingPermission.name) {
      const permissionWithSameName = await this.prisma.permission.findUnique({
        where: { name },
      });

      if (permissionWithSameName) {
        throw new ConflictException(
          `Permission with name ${name} already exists`,
        );
      }
    }

    // Check if key is unique if it's being updated
    if (key && key !== existingPermission.key) {
      const permissionWithSameKey = await this.prisma.permission.findUnique({
        where: { key },
      });

      if (permissionWithSameKey) {
        throw new ConflictException(
          `Permission with key ${key} already exists`,
        );
      }
    }

    // Update permission
    const permission = await this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });

    return permission;
  }

  async remove(id: number) {
    // Check if permission exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if permission is assigned to any roles
    const rolesWithPermission = await this.prisma.rolePermission.count({
      where: { permissionId: id },
    });

    if (rolesWithPermission > 0) {
      throw new ConflictException(
        `Cannot delete permission with ID ${id} because it is assigned to ${rolesWithPermission} roles`,
      );
    }

    // Delete permission
    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: `Permission with ID ${id} has been deleted` };
  }
}
